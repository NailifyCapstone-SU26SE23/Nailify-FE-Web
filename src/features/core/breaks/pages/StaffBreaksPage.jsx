import { useEffect, useState, useCallback } from "react";
import { DatePicker, Spin } from "antd";
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
  Sparkles
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

export function StaffBreaksPage() {
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
      toast.error(error.message || "Failed to load breaks list.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterDate]);

  useEffect(() => {
    loadBreaks();
  }, [loadBreaks]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formStartTime || !formEndTime) {
      toast.error("Please fill in start time and end time.");
      return;
    }
    if (formStartTime >= formEndTime) {
      toast.error("Start time must be before end time.");
      return;
    }
    if (!formReason.trim()) {
      toast.error("Please enter a reason.");
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

      toast.success("Break request submitted successfully!");
      setIsCreateOpen(false);
      
      // Reset form
      setFormDate(dayjs().format("YYYY-MM-DD"));
      setFormStartTime("09:00");
      setFormEndTime("10:00");
      setFormReason("");
      
      loadBreaks();
    } catch (error) {
      toast.error(error.message || "Failed to submit break request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formStartTime || !formEndTime) {
      toast.error("Please fill in start time and end time.");
      return;
    }
    if (formStartTime >= formEndTime) {
      toast.error("Start time must be before end time.");
      return;
    }
    if (!formReason.trim()) {
      toast.error("Please enter a reason.");
      return;
    }

    try {
      setIsActionLoading(true);
      await updateBreakRequest(selectedBreak.nailArtistBreakId, {
        startTime: formStartTime.includes(":") && formStartTime.split(":").length === 2 ? `${formStartTime}:00` : formStartTime,
        endTime: formEndTime.includes(":") && formEndTime.split(":").length === 2 ? `${formEndTime}:00` : formEndTime,
        reason: formReason.trim(),
      });

      toast.success("Break request updated successfully!");
      setIsEditOpen(false);
      setSelectedBreak(null);
      loadBreaks();
    } catch (error) {
      toast.error(error.message || "Failed to update break request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsActionLoading(true);
      await deleteBreakRequest(selectedBreak.nailArtistBreakId);
      toast.success("Break request cancelled successfully.");
      setIsDeleteOpen(false);
      setSelectedBreak(null);
      loadBreaks();
    } catch (error) {
      toast.error(error.message || "Failed to cancel break request.");
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

  const getStatusBadge = (status) => {
    const s = String(status || "Pending").trim().toLowerCase();
    switch (s) {
      case "approved":
      case "đã duyệt":
      case "đồng ý":
      case "active":
        return (
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-100">
            Đã duyệt
          </span>
        );
      case "rejected":
      case "từ chối":
      case "không đồng ý":
        return (
          <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-100">
            Từ chối
          </span>
        );
      case "pending":
      case "chờ duyệt":
      default:
        return (
          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 border border-amber-100">
            Chờ duyệt
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#3f2b3f]">Yêu Cầu Nghỉ Phép</h1>
          <p className="mt-1 text-sm text-[#a88a9d]">
            Gửi yêu cầu nghỉ đột xuất, việc riêng giữa ca và xem lịch sử của bạn.
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
          <span>Gửi yêu cầu nghỉ</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[#f1e7ed] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-[#69708a]">Lọc theo ngày:</span>
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
              Xóa lọc
            </button>
          )}
        </div>
        <button
          onClick={loadBreaks}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition"
          title="Tải lại dữ liệu"
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
          title="Không tìm thấy yêu cầu nghỉ phép nào" 
          description="Hãy click vào nút 'Gửi yêu cầu nghỉ' phía trên để xin nghỉ phép giữa ca."
        />
      ) : (
        <div className="space-y-4">
          {/* Table for desktop */}
          <div className="hidden overflow-hidden rounded-[22px] border border-[#f4e4d7] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#f4e4d7]">
                <thead className="bg-[#fff8f2]">
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-[#b38769]">
                    <th className="px-5 py-4 font-semibold">Ngày nghỉ</th>
                    <th className="px-5 py-4 font-semibold">Thời gian</th>
                    <th className="px-5 py-4 font-semibold">Lý do</th>
                    <th className="px-5 py-4 font-semibold">Trạng thái</th>
                    <th className="px-5 py-4 font-semibold">Phản hồi từ chối</th>
                    <th className="px-5 py-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f7ebdf] bg-white">
                  {breaks.map((item) => (
                    <tr key={item.nailArtistBreakId} className="align-middle text-sm text-[var(--color-ink)]">
                      <td className="px-5 py-4 font-semibold">
                        {dayjs(item.breakDate).format("DD/MM/YYYY")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Clock3 size={14} className="text-[#a88a9d]" />
                          <span>{item.startTime?.substring(0, 5)} - {item.endTime?.substring(0, 5)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-xs truncate text-[var(--color-muted)]" title={item.reason}>
                        {item.reason}
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-5 py-4 text-xs text-rose-500 italic max-w-xs truncate" title={item.rejectReason}>
                        {item.rejectReason || "-"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {String(item.status || "").toLowerCase() === "pending" || String(item.status || "").toLowerCase() === "chờ duyệt" ? (
                            <>
                              <button
                                onClick={() => openEditModal(item)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                                title="Sửa yêu cầu"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => openDeleteModal(item)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                                title="Hủy yêu cầu"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">Không thể sửa/hủy</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <p className="text-[var(--color-muted)]"><span className="font-semibold text-slate-700">Lý do:</span> {item.reason}</p>
                  {item.rejectReason && (
                    <p className="text-xs text-rose-500 italic"><span className="font-semibold">Từ chối:</span> {item.rejectReason}</p>
                  )}
                </div>
                
                {(String(item.status || "").toLowerCase() === "pending" || String(item.status || "").toLowerCase() === "chờ duyệt") && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#f7ebdf]">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      <Edit2 size={12} />
                      Sửa
                    </button>
                    <button
                      onClick={() => openDeleteModal(item)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
                    >
                      <Trash2 size={12} />
                      Hủy
                    </button>
                  </div>
                )}
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
                <h3 className="text-lg font-extrabold text-[#3f2b3f]">Gửi yêu cầu nghỉ</h3>
                <p className="mt-1 text-sm text-[#a88a9d]">Mặc định yêu cầu sẽ ở trạng thái Chờ duyệt.</p>
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
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">Ngày xin nghỉ</label>
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
                  <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">Từ giờ</label>
                  <input 
                    type="time" 
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3 text-sm text-[#3f2b3f] outline-none focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">Đến giờ</label>
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
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">Lý do nghỉ</label>
                <textarea 
                  rows={3}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Nhập lý do nghỉ của bạn..."
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
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-accent)] text-sm font-bold text-white shadow-sm hover:opacity-95 transition disabled:opacity-50"
                >
                  {isActionLoading ? "Đang gửi..." : "Gửi yêu cầu"}
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
                <h3 className="text-lg font-extrabold text-[#3f2b3f]">Cập nhật lịch nghỉ</h3>
                <p className="mt-1 text-sm text-[#a88a9d]">
                  Thay đổi thời gian nghỉ cho ngày {dayjs(formDate).format("DD/MM/YYYY")}.
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
                  <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">Từ giờ</label>
                  <input 
                    type="time" 
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[#f2bfd4] bg-[#fff9fc] px-4 py-3 text-sm text-[#3f2b3f] outline-none focus:border-[#ea4f93] focus:ring-1 focus:ring-[#ea4f93]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">Đến giờ</label>
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
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[#69708a] mb-2">Lý do nghỉ</label>
                <textarea 
                  rows={3}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Nhập lý do nghỉ của bạn..."
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
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex-1 inline-flex h-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-accent)] text-sm font-bold text-white shadow-sm hover:opacity-95 transition disabled:opacity-50"
                >
                  {isActionLoading ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Cancel Confirm Modal */}
      <ActionConfirmModal
        open={isDeleteOpen}
        intent="danger"
        title="Hủy yêu cầu xin nghỉ?"
        description="Bạn có chắc chắn muốn hủy yêu cầu xin nghỉ phép này không? Hành động này sẽ xóa yêu cầu khỏi hệ thống và không thể khôi phục."
        confirmText="Đồng ý hủy"
        cancelText="Hủy bỏ"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteOpen(false);
          setSelectedBreak(null);
        }}
        loading={isActionLoading}
        details={[
          { 
            label: "Ngày nghỉ", 
            value: selectedBreak ? dayjs(selectedBreak.breakDate).format("DD/MM/YYYY") : "" 
          },
          { 
            label: "Thời gian", 
            value: selectedBreak ? `${selectedBreak.startTime?.substring(0, 5)} - ${selectedBreak.endTime?.substring(0, 5)}` : "" 
          }
        ]}
      />
    </div>
  );
}
