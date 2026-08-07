import { useEffect, useState, useCallback } from "react";
import { DatePicker, Spin, Select } from "antd";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Clock3,
  Trash2,
  RefreshCw,
  UserRound,
  X
} from "lucide-react";
import { Pagination } from "../../../../shared/components/common/Pagination";
import { EmptyState } from "../../../../shared/components/common/EmptyState";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import {
  fetchBreaks,
  deleteBreakRequest,
  fetchNailArtists
} from "../services/breakService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

export function ReceptionistBreaksPage() {
  const [breaks, setBreaks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArtistsLoading, setIsArtistsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [metaData, setMetaData] = useState(null);
  const { language } = useLanguage();

  // Filters and Pagination
  const [filterArtistId, setFilterArtistId] = useState(undefined);
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBreak, setSelectedBreak] = useState(null);

  const loadArtists = async () => {
    try {
      setIsArtistsLoading(true);
      const artistsList = await fetchNailArtists();
      setArtists(artistsList || []);
    } catch (error) {
      console.error("Failed to load artists:", error);
    } finally {
      setIsArtistsLoading(false);
    }
  };

  const loadBreaks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchBreaks({
        pageNumber: currentPage,
        pageSize,
        artistId: filterArtistId || undefined,
        date: filterDate ? dayjs(filterDate).toISOString() : undefined,
      });

      if (response) {
        setBreaks(response.items || []);
        setMetaData(response.metaData || null);
      }
    } catch (error) {
      console.error("Failed to load breaks:", error);
      toast.error(error.message || (language === "vi" ? "Không tải được danh sách nghỉ phép." : "Failed to load breaks list."));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterArtistId, filterDate, language]);

  useEffect(() => {
    loadArtists();
  }, []);

  useEffect(() => {
    loadBreaks();
  }, [loadBreaks]);

  const handleDeleteConfirm = async () => {
    try {
      setIsActionLoading(true);
      await deleteBreakRequest(selectedBreak.nailArtistBreakId);
      toast.success(language === "vi" ? "Hủy yêu cầu xin nghỉ phép thành công." : "Break request cancelled successfully.");
      setIsDeleteOpen(false);
      setSelectedBreak(null);
      loadBreaks();
    } catch (error) {
      toast.error(error.message || (language === "vi" ? "Không thể hủy yêu cầu nghỉ phép." : "Failed to cancel break request."));
    } finally {
      setIsActionLoading(false);
    }
  };

  const openDeleteModal = (item) => {
    setSelectedBreak(item);
    setIsDeleteOpen(true);
  };

  const getArtistName = (artistId) => {
    const artist = artists.find(a => String(a.id) === String(artistId));
    return artist ? artist.name : (language === "vi" ? "Thợ Nail" : "Nail Artist");
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

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#3f2b3f]">{language === "vi" ? "Danh Sách Xin Nghỉ Phép" : "Staff Break Requests"}</h1>
        <p className="mt-1 text-sm text-[#a88a9d]">
          {language === "vi" ? "Xem danh sách lịch xin nghỉ phép giữa ca của thợ nail và thực hiện hủy yêu cầu nếu cần." : "View break schedule requests of nail artists and cancel request if needed."}
        </p>
      </div>

      {/* Filter panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[#f1e7ed] bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Artist Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#69708a]">{language === "vi" ? "Thợ nail:" : "Artist:"}</span>
            <Select
              allowClear
              placeholder={language === "vi" ? "Tất cả thợ nail" : "All nail artists"}
              loading={isArtistsLoading}
              value={filterArtistId}
              onChange={(value) => {
                setFilterArtistId(value);
                setCurrentPage(1);
              }}
              style={{ width: 200 }}
              className="rounded-xl"
            >
              {artists.map((artist) => (
                <Select.Option key={artist.id} value={artist.id}>
                  {artist.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#69708a]">{language === "vi" ? "Ngày:" : "Date:"}</span>
            <DatePicker
              value={filterDate ? dayjs(filterDate) : null}
              onChange={(date, dateString) => {
                setFilterDate(dateString || "");
                setCurrentPage(1);
              }}
              className="rounded-xl border-[#f4c1d8]"
              format="YYYY-MM-DD"
            />
          </div>

          {/* Clear Filters */}
          {(filterArtistId || filterDate) && (
            <button
              onClick={() => {
                setFilterArtistId(undefined);
                setFilterDate("");
                setCurrentPage(1);
              }}
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-xs font-semibold text-[#69708a] transition cursor-pointer"
            >
              {language === "vi" ? "Xóa lọc" : "Clear filters"}
            </button>
          )}
        </div>

        <button
          onClick={loadBreaks}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition cursor-pointer"
          title={language === "vi" ? "Tải lại dữ liệu" : "Reload data"}
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
          description={language === "vi" ? "Không có dữ liệu lịch xin nghỉ phép phù hợp với bộ lọc hiện tại." : "No break requests match the current filters."}
        />
      ) : (
        <div className="space-y-4">
          {/* Table for desktop */}
          <div className="hidden overflow-hidden rounded-[22px] border border-[#f4e4d7] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#f4e4d7]">
                <thead className="bg-[#fff8f2]">
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-[#b38769]">
                    <th className="px-5 py-4 font-semibold">{language === "vi" ? "Thợ nail" : "Nail Artist"}</th>
                    <th className="px-5 py-4 font-semibold">{language === "vi" ? "Ngày nghỉ" : "Break Date"}</th>
                    <th className="px-5 py-4 font-semibold">{language === "vi" ? "Thời gian" : "Time Window"}</th>
                    <th className="px-5 py-4 font-semibold">{language === "vi" ? "Lý do" : "Reason"}</th>
                    <th className="px-5 py-4 font-semibold">{language === "vi" ? "Trạng thái" : "Status"}</th>
                    <th className="px-5 py-4 font-semibold">{language === "vi" ? "Lý do từ chối" : "Reject Reason"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f7ebdf] bg-white">
                  {breaks.map((item) => (
                    <tr key={item.nailArtistBreakId} className="align-middle text-sm text-[var(--color-ink)]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff2f6] text-[#ea4f93]">
                            <UserRound size={14} />
                          </div>
                          <span className="font-semibold text-[#3f2b3f]">
                            {getArtistName(item.nailArtistId)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
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
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff2f6] text-[#ea4f93]">
                      <UserRound size={12} />
                    </div>
                    <span className="font-bold text-[#3f2b3f]">
                      {getArtistName(item.nailArtistId)}
                    </span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                <div className="text-sm text-slate-600 space-y-1.5 border-t border-[#f7ebdf] pt-2">
                  <div className="flex justify-between">
                    <span className="text-[#a88a9d]">{language === "vi" ? "Ngày nghỉ:" : "Break Date:"}</span>
                    <span className="font-semibold text-slate-800">{dayjs(item.breakDate).format("DD/MM/YYYY")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a88a9d]">{language === "vi" ? "Thời gian:" : "Time Window:"}</span>
                    <span className="font-semibold text-slate-800">{item.startTime?.substring(0, 5)} - {item.endTime?.substring(0, 5)}</span>
                  </div>
                  <p className="text-[var(--color-muted)]"><span className="font-semibold text-slate-700">{language === "vi" ? "Lý do:" : "Reason:"}</span> {item.reason}</p>
                  {item.rejectReason && (
                    <p className="text-xs text-rose-500 italic"><span className="font-semibold">{language === "vi" ? "Từ chối:" : "Rejected:"}</span> {item.rejectReason}</p>
                  )}
                </div>
                <div className="pt-2 border-t border-[#f7ebdf]">
                  <button
                    onClick={() => openDeleteModal(item)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                  >
                    <Trash2 size={12} />
                    {language === "vi" ? "Hủy yêu cầu nghỉ" : "Cancel Request"}
                  </button>
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

      {/* Delete Confirm Modal */}
      <ActionConfirmModal
        open={isDeleteOpen}
        intent="danger"
        title={language === "vi" ? "Hủy yêu cầu xin nghỉ?" : "Cancel Break Request?"}
        description={language === "vi" ? "Hành động này sẽ hủy bỏ yêu cầu xin nghỉ của thợ nail này và xóa vĩnh viễn khỏi cơ sở dữ liệu." : "This action will cancel this staff's break request and remove it from the database."}
        confirmText={language === "vi" ? "Hủy yêu cầu" : "Cancel request"}
        cancelText={language === "vi" ? "Bỏ qua" : "Go back"}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteOpen(false);
          setSelectedBreak(null);
        }}
        loading={isActionLoading}
        details={[
          {
            label: language === "vi" ? "Thợ nail" : "Nail artist",
            value: selectedBreak ? getArtistName(selectedBreak.nailArtistId) : ""
          },
          {
            label: language === "vi" ? "Ngày nghỉ" : "Break Date",
            value: selectedBreak ? dayjs(selectedBreak.breakDate).format("DD/MM/YYYY") : ""
          },
          {
            label: language === "vi" ? "Thời gian" : "Time Window",
            value: selectedBreak ? `${selectedBreak.startTime?.substring(0, 5)} - ${selectedBreak.endTime?.substring(0, 5)}` : ""
          }
        ]}
      />
    </div>
  );
}
