import { useEffect, useState, useCallback } from "react";
import { DatePicker, Spin, Table, ConfigProvider } from "antd";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Clock3,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Eye
} from "lucide-react";
import { Pagination } from "../../../../shared/components/common/Pagination";
import { EmptyState } from "../../../../shared/components/common/EmptyState";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import {
  fetchBreaks,
  createBreakRequest,
  updateBreakRequest,
  deleteBreakRequest,
  getStaffArtistId
} from "../services/breakService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

export function StaffBreaksPage() {
  const { language } = useLanguage();

  const [breaks, setBreaks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [metaData, setMetaData] = useState(null);

  // Filters and Pagination
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Selected break for Edit/Delete
  const [selectedBreak, setSelectedBreak] = useState(null);

  // Form states
  const [formDate, setFormDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formReason, setFormReason] = useState("");

  const loadBreaks = useCallback(async () => {
    try {
      setIsLoading(true);
      const artistId = getStaffArtistId();
      const response = await fetchBreaks({
        pageNumber: currentPage,
        pageSize,
        artistId,
        date: filterDate ? dayjs(filterDate).toISOString() : undefined,
      });

      if (response) {
        setBreaks(response.items || []);
        setMetaData(response.metaData || null);
      }
    } catch (error) {
      console.error("Failed to load breaks:", error);
      toast.error(error.message || (language === "vi" ? "Lỗi khi tải danh sách lịch nghỉ." : "Failed to load breaks list."));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterDate, language]);

  useEffect(() => {
    loadBreaks();
  }, [loadBreaks]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formStartTime || !formEndTime) {
      toast.error(language === "vi" ? "Vui lòng điền giờ bắt đầu và kết thúc." : "Please fill in start time and end time.");
      return;
    }
    if (formStartTime >= formEndTime) {
      toast.error(language === "vi" ? "Giờ bắt đầu phải trước giờ kết thúc." : "Start time must be before end time.");
      return;
    }
    if (!formReason.trim()) {
      toast.error(language === "vi" ? "Vui lòng nhập lý do." : "Please enter a reason.");
      return;
    }

    try {
      setIsActionLoading(true);
      const artistId = getStaffArtistId();
      const breakDateIso = dayjs(formDate).startOf("day").toISOString();

      await createBreakRequest({
        nailArtistId: artistId,
        breakDate: breakDateIso,
        startTime: `${formStartTime}:00`,
        endTime: `${formEndTime}:00`,
        reason: formReason.trim(),
      });

      toast.success(language === "vi" ? "Đã gửi yêu cầu nghỉ thành công!" : "Break request submitted successfully!");
      setIsCreateOpen(false);

      // Reset form
      setFormDate(dayjs().format("YYYY-MM-DD"));
      setFormStartTime("09:00");
      setFormEndTime("10:00");
      setFormReason("");

      loadBreaks();
    } catch (error) {
      toast.error(error.message || (language === "vi" ? "Lỗi khi gửi yêu cầu nghỉ." : "Failed to submit break request."));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formStartTime || !formEndTime) {
      toast.error(language === "vi" ? "Vui lòng điền giờ bắt đầu và kết thúc." : "Please fill in start time and end time.");
      return;
    }
    if (formStartTime >= formEndTime) {
      toast.error(language === "vi" ? "Giờ bắt đầu phải trước giờ kết thúc." : "Start time must be before end time.");
      return;
    }
    if (!formReason.trim()) {
      toast.error(language === "vi" ? "Vui lòng nhập lý do." : "Please enter a reason.");
      return;
    }

    try {
      setIsActionLoading(true);
      await updateBreakRequest(selectedBreak.nailArtistBreakId, {
        startTime: formStartTime.includes(":") && formStartTime.split(":").length === 2 ? `${formStartTime}:00` : formStartTime,
        endTime: formEndTime.includes(":") && formEndTime.split(":").length === 2 ? `${formEndTime}:00` : formEndTime,
        reason: formReason.trim(),
      });

      toast.success(language === "vi" ? "Cập nhật yêu cầu thành công!" : "Break request updated successfully!");
      setIsEditOpen(false);
      setSelectedBreak(null);
      loadBreaks();
    } catch (error) {
      toast.error(error.message || (language === "vi" ? "Lỗi khi cập nhật yêu cầu nghỉ." : "Failed to update break request."));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsActionLoading(true);
      await deleteBreakRequest(selectedBreak.nailArtistBreakId);
      toast.success(language === "vi" ? "Đã hủy yêu cầu thành công." : "Break request cancelled successfully.");
      setIsDeleteOpen(false);
      setSelectedBreak(null);
      loadBreaks();
    } catch (error) {
      toast.error(error.message || (language === "vi" ? "Lỗi khi hủy yêu cầu." : "Failed to cancel break request."));
    } finally {
      setIsActionLoading(false);
    }
  };

  const openEditModal = (item) => {
    setSelectedBreak(item);
    // Remove seconds for form if present e.g. "09:00:00" -> "09:00"
    const start = item.startTime ? item.startTime.substring(0, 5) : "09:00";
    const end = item.endTime ? item.endTime.substring(0, 5) : "10:00";
    setFormDate(dayjs(item.breakDate).format("YYYY-MM-DD"));
    setFormStartTime(start);
    setFormEndTime(end);
    setFormReason(item.reason || "");
    setIsEditOpen(true);
  };

  const openDeleteModal = (item) => {
    setSelectedBreak(item);
    setIsDeleteOpen(true);
  };

  const openDetailModal = (item) => {
    setSelectedBreak(item);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status) => {
    const s = String(status || "Pending").trim().toLowerCase();
    switch (s) {
      case "approved":
      case "đã duyệt":
      case "đồng ý":
      case "active":
        return (
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-100">
            {language === "vi" ? "Đã duyệt" : "Approved"}
          </span>
        );
      case "rejected":
      case "từ chối":
      case "không đồng ý":
        return (
          <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-100">
            {language === "vi" ? "Từ chối" : "Rejected"}
          </span>
        );
      case "pending":
      case "chờ duyệt":
      default:
        return (
          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 border border-amber-100">
            {language === "vi" ? "Chờ duyệt" : "Pending"}
          </span>
        );
    }
  };

  const columns = [
    {
      title: <span className="uppercase tracking-[0.16em] font-semibold">{language === "vi" ? "Ngày nghỉ" : "Break Date"}</span>,
      key: "date",
      sorter: (a, b) => dayjs(a.breakDate).unix() - dayjs(b.breakDate).unix(),
      render: (_, item) => <span className="px-2 font-semibold">{dayjs(item.breakDate).format("DD/MM/YYYY")}</span>
    },
    {
      title: <span className="uppercase tracking-[0.16em] font-semibold">{language === "vi" ? "Thời gian" : "Time"}</span>,
      key: "time",
      sorter: (a, b) => {
        const timeA = a.startTime ? a.startTime.substring(0, 5) : "";
        const timeB = b.startTime ? b.startTime.substring(0, 5) : "";
        return timeA.localeCompare(timeB);
      },
      render: (_, item) => (
        <div className="flex items-center gap-1.5 text-slate-700 px-2">
          <Clock3 size={14} className="text-[#a88a9d]" />
          <span>{item.startTime?.substring(0, 5)} - {item.endTime?.substring(0, 5)}</span>
        </div>
      )
    },
    {
      title: <span className="uppercase tracking-[0.16em] font-semibold">{language === "vi" ? "Lý do" : "Reason"}</span>,
      key: "reason",
      sorter: (a, b) => (a.reason || "").localeCompare(b.reason || ""),
      render: (_, item) => (
        <div className="max-w-[200px] truncate text-[var(--color-muted)] px-2" title={item.reason}>
          {item.reason}
        </div>
      )
    },
    {
      title: <span className="uppercase tracking-[0.16em] font-semibold">{language === "vi" ? "Trạng thái" : "Status"}</span>,
      key: "status",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (_, item) => <div className="px-2">{getStatusBadge(item.status)}</div>
    },
    {
      title: <span className="uppercase tracking-[0.16em] font-semibold">{language === "vi" ? "Phản hồi từ chối" : "Rejection Reason"}</span>,
      key: "rejectReason",
      sorter: (a, b) => (a.rejectReason || "").localeCompare(b.rejectReason || ""),
      render: (_, item) => (
        <div className="max-w-[200px] truncate text-xs text-rose-500 italic px-2" title={item.rejectReason}>
          {item.rejectReason || "-"}
        </div>
      )
    },
    {
      title: <span className="uppercase tracking-[0.16em] font-semibold">{language === "vi" ? "Thao tác" : "Action"}</span>,
      key: "action",
      align: 'right',
      render: (_, item) => (
        <div className="flex justify-end gap-2 px-2">
          <button
            onClick={() => openDetailModal(item)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
            title={language === "vi" ? "Chi tiết" : "Details"}
          >
            <Eye size={13} />
          </button>
          {String(item.status || "").toLowerCase() === "pending" || String(item.status || "").toLowerCase() === "chờ duyệt" ? (
            <>
              <button
                onClick={() => openEditModal(item)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                title={language === "vi" ? "Sửa yêu cầu" : "Edit Request"}
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => openDeleteModal(item)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                title={language === "vi" ? "Hủy yêu cầu" : "Cancel Request"}
              >
                <Trash2 size={13} />
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400 self-center">{language === "vi" ? "Không thể sửa/hủy" : "Cannot edit/cancel"}</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#3f2b3f]">{language === "vi" ? "Yêu Cầu Nghỉ Phép" : "Break Requests"}</h1>
          <p className="mt-1 text-sm text-[#a88a9d]">
            {language === "vi" ? "Gửi yêu cầu nghỉ đột xuất, việc riêng giữa ca và xem lịch sử của bạn." : "Submit unexpected break requests, personal errands between shifts, and view your history."}
          </p>
        </div>
        <button
          onClick={() => {
            setFormDate(dayjs().format("YYYY-MM-DD"));
            setFormStartTime("09:00");
            setFormEndTime("10:00");
            setFormReason("");
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
        >
          <Plus size={16} />
          <span>{language === "vi" ? "Gửi yêu cầu xin nghỉ" : "Submit Request"}</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[#f1e7ed] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-[#69708a]">{language === "vi" ? "Lọc theo ngày:" : "Filter by date:"}</span>
          <DatePicker
            value={filterDate ? dayjs(filterDate) : null}
            onChange={(date, dateString) => {
              setFilterDate(dateString || "");
              setCurrentPage(1);
            }}
            className="rounded-xl border-[#f4c1d8] hover:border-[#ea4f93] focus:border-[#ea4f93]"
            format="YYYY-MM-DD"
          />
          {filterDate && (
            <button
              onClick={() => {
                setFilterDate("");
                setCurrentPage(1);
              }}
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-xs font-semibold text-[#69708a] transition"
            >
              {language === "vi" ? "Xóa lọc" : "Clear filter"}
            </button>
          )}
        </div>
        <button
          onClick={loadBreaks}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition"
          title={language === "vi" ? "Tải lại dữ liệu" : "Refresh data"}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Content area */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : breaks.length === 0 ? (
        <EmptyState
          title={language === "vi" ? "Không tìm thấy yêu cầu nghỉ phép nào" : "No break requests found"}
          description={language === "vi" ? "Hãy click vào nút 'Gửi yêu cầu nghỉ' phía trên để xin nghỉ phép giữa ca." : "Click the 'Submit Request' button above to ask for a break between shifts."}
        />
      ) : (
        <div className="space-y-4">
          {/* Table for desktop */}
          <div className="hidden md:block">
            <ConfigProvider
              theme={{
                components: {
                  Table: {
                    headerBg: "#fff8f2",
                    headerColor: "#b38769",
                  },
                },
              }}
            >
              <Table
                dataSource={breaks}
                columns={columns}
                rowKey="nailArtistBreakId"
                pagination={false}
                className="rounded-[22px] border border-[#f4e4d7] bg-white overflow-hidden"
              />
            </ConfigProvider>
          </div>

          {/* List for mobile */}
          <div className="grid gap-4 md:hidden">
            {breaks.map((item) => (
              <div
                key={item.nailArtistBreakId}
                className="rounded-[22px] border border-[#f4e4d7] bg-white p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#3f2b3f]">
                    {dayjs(item.breakDate).format("DD/MM/YYYY")}
                  </span>
                  {getStatusBadge(item.status)}
                </div>
                <div className="text-sm text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Clock3 size={14} className="text-[#a88a9d]" />
                    <span>{item.startTime?.substring(0, 5)} - {item.endTime?.substring(0, 5)}</span>
                  </div>
                  <p className="text-[var(--color-muted)] truncate" title={item.reason}>
                    <span className="font-semibold text-slate-700">{language === "vi" ? "Lý do:" : "Reason:"}</span> {item.reason}
                  </p>
                  {item.rejectReason && (
                    <p className="text-xs text-rose-500 italic truncate" title={item.rejectReason}>
                      <span className="font-semibold">{language === "vi" ? "Từ chối:" : "Rejected:"}</span> {item.rejectReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#f7ebdf]">
                  <button
                    onClick={() => openDetailModal(item)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition"
                  >
                    <Eye size={12} />
                    {language === "vi" ? "Chi tiết" : "Details"}
                  </button>
                  {(String(item.status || "").toLowerCase() === "pending" || String(item.status || "").toLowerCase() === "chờ duyệt") && (
                    <>
                      <button
                        onClick={() => openEditModal(item)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                      >
                        <Edit2 size={12} />
                        {language === "vi" ? "Sửa" : "Edit"}
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
                      >
                        <Trash2 size={12} />
                        {language === "vi" ? "Hủy" : "Cancel"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {metaData && metaData.totalPages > 1 && (
            <div className="flex justify-end pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={metaData.totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      )}

      {/* Create Break Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1c2e]/45 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-[#f1cddd] bg-white shadow-[0_24px_60px_rgba(63,43,63,0.24)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 border-b border-[#f7dfeb] px-6 py-5">
              <div>
                <h3 className="text-lg font-extrabold text-[#3f2b3f]">{language === "vi" ? "Gửi yêu cầu nghỉ" : "Submit Break Request"}</h3>
                <p className="mt-1 text-sm text-[#a88a9d]">{language === "vi" ? "Mặc định yêu cầu sẽ ở trạng thái Chờ duyệt." : "By default, requests will be in Pending status."}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] transition hover:bg-[#fff5f8]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">{language === "vi" ? "Ngày xin nghỉ" : "Break Date"}</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  min={dayjs().format("YYYY-MM-DD")}
                  required
                  className="w-full rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3 text-sm text-[#3f2b3f] outline-none focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">{language === "vi" ? "Từ giờ" : "From Time"}</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3 text-sm text-[#3f2b3f] outline-none focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">{language === "vi" ? "Đến giờ" : "To Time"}</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3 text-sm text-[#3f2b3f] outline-none focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">{language === "vi" ? "Lý do nghỉ" : "Reason for Break"}</label>
                <textarea
                  rows={3}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder={language === "vi" ? "Nhập lý do nghỉ của bạn..." : "Enter your reason..."}
                  required
                  className="w-full rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3 text-sm text-[#3f2b3f] outline-none focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93] placeholder:text-[#c59ab0]"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#f7dfeb]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isActionLoading}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-accent)] text-sm font-bold text-white shadow-sm hover:opacity-95 transition disabled:opacity-50"
                >
                  {isActionLoading ? (language === "vi" ? "Đang gửi..." : "Submitting...") : (language === "vi" ? "Gửi yêu cầu" : "Submit Request")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Break Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1c2e]/45 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-[#f1cddd] bg-white shadow-[0_24px_60px_rgba(63,43,63,0.24)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 border-b border-[#f7dfeb] px-6 py-5">
              <div>
                <h3 className="text-lg font-extrabold text-[#3f2b3f]">{language === "vi" ? "Cập nhật lịch nghỉ" : "Update Break Request"}</h3>
                <p className="mt-1 text-sm text-[#a88a9d]">
                  {language === "vi" ? `Thay đổi thời gian nghỉ cho ngày ${dayjs(formDate).format("DD/MM/YYYY")}.` : `Change break time for ${dayjs(formDate).format("DD/MM/YYYY")}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedBreak(null);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] transition hover:bg-[#fff5f8]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">{language === "vi" ? "Từ giờ" : "From Time"}</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3 text-sm text-[#3f2b3f] outline-none focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">{language === "vi" ? "Đến giờ" : "To Time"}</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3 text-sm text-[#3f2b3f] outline-none focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">{language === "vi" ? "Lý do nghỉ" : "Reason for Break"}</label>
                <textarea
                  rows={3}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder={language === "vi" ? "Nhập lý do nghỉ của bạn..." : "Enter your reason..."}
                  required
                  className="w-full rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3 text-sm text-[#3f2b3f] outline-none focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93] placeholder:text-[#c59ab0]"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#f7dfeb]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedBreak(null);
                  }}
                  disabled={isActionLoading}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-accent)] text-sm font-bold text-white shadow-sm hover:opacity-95 transition disabled:opacity-50"
                >
                  {isActionLoading ? (language === "vi" ? "Đang lưu..." : "Saving...") : (language === "vi" ? "Cập nhật" : "Update")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Break Detail Modal */}
      {isDetailOpen && selectedBreak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1c2e]/45 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-[#f1cddd] bg-white shadow-[0_24px_60px_rgba(63,43,63,0.24)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 border-b border-[#f7dfeb] px-6 py-5">
              <div>
                <h3 className="text-lg font-extrabold text-[#3f2b3f]">{language === "vi" ? "Chi tiết yêu cầu nghỉ" : "Break Request Details"}</h3>
                <p className="mt-1 text-sm text-[#a88a9d]">{language === "vi" ? "Thông tin chi tiết về yêu cầu nghỉ phép." : "Detailed information about the break request."}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedBreak(null);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f2bfd4] bg-white text-[#ea4f93] transition hover:bg-[#fff5f8]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-[#f7dfeb] bg-[#fff9fc] p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-[#69708a]">{language === "vi" ? "Trạng thái:" : "Status:"}</span>
                    {getStatusBadge(selectedBreak.status)}
                  </div>
                  
                  <div className="space-y-3 text-sm text-[#3f2b3f]">
                    <div className="flex justify-between border-b border-[#f7dfeb] pb-2">
                      <span className="text-[#a88a9d] font-medium">{language === "vi" ? "Ngày nghỉ:" : "Break Date:"}</span>
                      <span className="font-semibold">{dayjs(selectedBreak.breakDate).format("DD/MM/YYYY")}</span>
                    </div>
                    
                    <div className="flex justify-between border-b border-[#f7dfeb] pb-2">
                      <span className="text-[#a88a9d] font-medium">{language === "vi" ? "Thời gian:" : "Time:"}</span>
                      <span className="font-semibold">{selectedBreak.startTime?.substring(0, 5)} - {selectedBreak.endTime?.substring(0, 5)}</span>
                    </div>
                    
                    <div className="flex flex-col gap-1 border-b border-[#f7dfeb] pb-2">
                      <span className="text-[#a88a9d] font-medium">{language === "vi" ? "Lý do:" : "Reason:"}</span>
                      <p className="font-semibold whitespace-pre-wrap">{selectedBreak.reason || "-"}</p>
                    </div>

                    {selectedBreak.rejectReason && (
                      <div className="flex flex-col gap-1">
                        <span className="text-rose-500 font-medium">{language === "vi" ? "Phản hồi từ chối:" : "Rejection Reason:"}</span>
                        <p className="font-semibold text-rose-600 whitespace-pre-wrap">{selectedBreak.rejectReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#f7dfeb] p-4">
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedBreak(null);
                }}
                className="w-full inline-flex h-11 items-center justify-center rounded-2xl bg-[#fff9fc] border border-[#f2bfd4] text-sm font-bold text-[#ea4f93] hover:bg-[#fff5f8] transition"
              >
                {language === "vi" ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Cancel Confirm Modal */}
      <ActionConfirmModal
        open={isDeleteOpen}
        intent="danger"
        title={language === "vi" ? "Hủy yêu cầu xin nghỉ?" : "Cancel break request?"}
        description={language === "vi" ? "Bạn có chắc chắn muốn hủy yêu cầu xin nghỉ phép này không? Hành động này sẽ xóa yêu cầu khỏi hệ thống và không thể khôi phục." : "Are you sure you want to cancel this break request? This action will remove the request from the system and cannot be undone."}
        confirmText={language === "vi" ? "Đồng ý hủy" : "Confirm Cancel"}
        cancelText={language === "vi" ? "Hủy bỏ" : "Cancel"}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteOpen(false);
          setSelectedBreak(null);
        }}
        loading={isActionLoading}
        details={[
          {
            label: language === "vi" ? "Ngày nghỉ" : "Break Date",
            value: selectedBreak ? dayjs(selectedBreak.breakDate).format("DD/MM/YYYY") : ""
          },
          {
            label: language === "vi" ? "Thời gian" : "Time",
            value: selectedBreak ? `${selectedBreak.startTime?.substring(0, 5)} - ${selectedBreak.endTime?.substring(0, 5)}` : ""
          }
        ]}
      />
    </div>
  );
}