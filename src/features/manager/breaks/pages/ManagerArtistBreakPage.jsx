import { useEffect, useState, useCallback, useMemo } from "react";
import { DatePicker, Spin, Select, Modal, Input } from "antd";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Clock3,
  Trash2,
  RefreshCw,
  UserRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpRight,
  Coffee,
  MessageSquareText,
  UserCheck,
} from "lucide-react";
import { Pagination } from "../../../../shared/components/common/Pagination";
import { EmptyState } from "../../../../shared/components/common/EmptyState";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import {
  fetchBreaks,
  deleteBreakRequest,
  approveRejectBreakRequest,
  fetchNailArtists,
} from "../../../core/breaks/services/breakService";

export function ManagerArtistBreakPage() {
  const [breaks, setBreaks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArtistsLoading, setIsArtistsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [metaData, setMetaData] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterArtistId, setFilterArtistId] = useState(undefined);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedBreak, setSelectedBreak] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

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
      console.error("Failed to load break requests:", error);
      toast.error(error.message || "Failed to load break request list.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterArtistId, filterDate]);

  useEffect(() => {
    loadArtists();
  }, []);

  useEffect(() => {
    loadBreaks();
  }, [loadBreaks]);

  const getArtistName = useCallback(
    (artistId) => {
      const artist = artists.find((a) => String(a.id) === String(artistId));
      return artist ? artist.name : "Nail Artist";
    },
    [artists]
  );

  // Client-side filtering by status and search query
  const filteredBreaks = useMemo(() => {
    return breaks.filter((b) => {
      const st = String(b.status || "").toLowerCase();

      // Status filter
      let matchesStatus = true;
      if (filterStatus === "pending") matchesStatus = st === "pending" || st === "chờ duyệt";
      else if (filterStatus === "approved") matchesStatus = st === "approved" || st === "đã duyệt";
      else if (filterStatus === "rejected") matchesStatus = st === "rejected" || st === "từ chối";

      if (!matchesStatus) return false;

      // Search query filter (artist name, reason)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const artistName = getArtistName(b.nailArtistId).toLowerCase();
        const reason = String(b.reason || "").toLowerCase();
        const rejectReason = String(b.rejectReason || "").toLowerCase();
        return artistName.includes(q) || reason.includes(q) || rejectReason.includes(q);
      }

      return true;
    });
  }, [breaks, filterStatus, searchQuery, getArtistName]);

  // Stats counters
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    breaks.forEach((b) => {
      const st = String(b.status || "").toLowerCase();
      if (st === "pending" || st === "chờ duyệt") pending++;
      else if (st === "approved" || st === "đã duyệt") approved++;
      else if (st === "rejected" || st === "từ chối") rejected++;
    });
    return { pending, approved, rejected, total: breaks.length };
  }, [breaks]);

  // Handle Approve Break
  const handleApprove = async () => {
    if (!selectedBreak) return;
    try {
      setIsActionLoading(true);
      await approveRejectBreakRequest(selectedBreak.nailArtistBreakId, {
        status: "Approved",
      });
      toast.success("Nail artist break request approved successfully!");
      setIsApproveModalOpen(false);
      setSelectedBreak(null);
      loadBreaks();
    } catch (error) {
      toast.error(error.message || "Failed to approve break request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Reject Break
  const handleRejectConfirm = async () => {
    if (!selectedBreak) return;
    try {
      setIsActionLoading(true);
      await approveRejectBreakRequest(selectedBreak.nailArtistBreakId, {
        status: "Rejected",
        rejectReason: rejectReasonInput.trim() || "Request declined due to shift coverage requirements.",
      });
      toast.success("Break request declined successfully.");
      setIsRejectModalOpen(false);
      setSelectedBreak(null);
      setRejectReasonInput("");
      loadBreaks();
    } catch (error) {
      toast.error(error.message || "Failed to decline break request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!selectedBreak) return;
    try {
      setIsActionLoading(true);
      await deleteBreakRequest(selectedBreak.nailArtistBreakId);
      toast.success("Break request deleted successfully.");
      setIsDeleteOpen(false);
      setSelectedBreak(null);
      loadBreaks();
    } catch (error) {
      toast.error(error.message || "Failed to delete break request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || "Pending").trim().toLowerCase();
    switch (s) {
      case "approved":
      case "đã duyệt":
      case "đồng ý":
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200/90 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Approved
          </span>
        );
      case "rejected":
      case "từ chối":
      case "không đồng ý":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-extrabold text-rose-700 border border-rose-200/90 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        );
      case "pending":
      case "chờ duyệt":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800 border border-amber-200/90 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
            Pending
          </span>
        );
    }
  };

  // Calculate duration in hours/mins
  const getSlotDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "";
    const start = dayjs(`2000-01-01 ${startTime}`);
    const end = dayjs(`2000-01-01 ${endTime}`);
    const diffMins = end.diff(start, "minute");
    if (isNaN(diffMins) || diffMins <= 0) return "";
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m break`;
    if (hrs > 0) return `${hrs}h break`;
    return `${mins}m break`;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#221F26] via-[#332233] to-[#251B27] p-6 text-white shadow-xl border border-white/10">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[#C97A9E]/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-extrabold text-[#F2D6E3] backdrop-blur-md border border-white/15">
              <Sparkles size={14} className="text-[#C97A9E]" /> Manager Portal • Shift Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Coffee size={28} className="text-[#C97A9E]" />
              Artist Break Requests
            </h1>
            <p className="text-xs sm:text-sm font-medium text-gray-300 leading-relaxed">
              Review, approve, or decline shift break requests submitted by salon nail artists in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFilterStatus("pending");
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#C97A9E] to-[#B86B8E] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#C97A9E]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <AlertCircle size={15} />
              <span>Review Pending ({stats.pending})</span>
            </button>

            <button
              onClick={loadBreaks}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
              title="Refresh List"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Luxury KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Card */}
        <div
          onClick={() => setFilterStatus("pending")}
          className={`group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 cursor-pointer border ${filterStatus === "pending"
              ? "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-amber-500/5 border-amber-400 ring-2 ring-amber-400/50 shadow-xl shadow-amber-500/10"
              : "bg-white border-gray-100 hover:border-amber-300 hover:shadow-lg hover:-translate-y-1"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
              Pending Approval
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-800 font-bold text-xs group-hover:scale-110 transition-transform">
              ⏳
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-amber-950 tracking-tight">{stats.pending}</p>
          <div className="mt-2 flex items-center justify-between pt-2 border-t border-amber-100/60">
            <span className="text-[11px] font-semibold text-amber-800">Action required</span>
            <ArrowUpRight size={14} className="text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => setFilterStatus("approved")}
          className={`group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 cursor-pointer border ${filterStatus === "approved"
              ? "bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 border-emerald-400 ring-2 ring-emerald-400/50 shadow-xl shadow-emerald-500/10"
              : "bg-white border-gray-100 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Approved Breaks
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-800 font-bold text-xs group-hover:scale-110 transition-transform">
              🟢
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-950 tracking-tight">{stats.approved}</p>
          <div className="mt-2 flex items-center justify-between pt-2 border-t border-emerald-100/60">
            <span className="text-[11px] font-semibold text-emerald-800">Approved shift breaks</span>
            <ArrowUpRight size={14} className="text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => setFilterStatus("rejected")}
          className={`group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 cursor-pointer border ${filterStatus === "rejected"
              ? "bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-rose-500/5 border-rose-400 ring-2 ring-rose-400/50 shadow-xl shadow-rose-500/10"
              : "bg-white border-gray-100 hover:border-rose-300 hover:shadow-lg hover:-translate-y-1"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <XCircle size={13} className="text-rose-600" />
              Rejected Requests
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-100/80 text-rose-800 font-bold text-xs group-hover:scale-110 transition-transform">
              🔴
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-rose-950 tracking-tight">{stats.rejected}</p>
          <div className="mt-2 flex items-center justify-between pt-2 border-t border-rose-100/60">
            <span className="text-[11px] font-semibold text-rose-800">Declined requests</span>
            <ArrowUpRight size={14} className="text-rose-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Total Card */}
        <div
          onClick={() => setFilterStatus("all")}
          className={`group relative overflow-hidden rounded-3xl p-5 transition-all duration-300 cursor-pointer border ${filterStatus === "all"
              ? "bg-gradient-to-br from-[#C97A9E]/25 via-[#C97A9E]/10 to-[#C97A9E]/5 border-[#C97A9E] ring-2 ring-[#C97A9E]/40 shadow-xl shadow-[#C97A9E]/10"
              : "bg-white border-gray-100 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9E4D76] flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#C97A9E]" />
              Total Requests
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FAF0F5] text-[#C97A9E] font-bold text-xs group-hover:scale-110 transition-transform">
              📋
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[#221F26] tracking-tight">{stats.total}</p>
          <div className="mt-2 flex items-center justify-between pt-2 border-t border-[#F2D6E3]/60">
            <span className="text-[11px] font-semibold text-[#9E4D76]">All submitted requests</span>
            <ArrowUpRight size={14} className="text-[#C97A9E] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Modern Filter Toolbar & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200/90 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          {/* Status Filter Segmented Tabs */}
          <div className="flex items-center gap-1 bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/50">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${filterStatus === "all"
                  ? "bg-white text-[#221F26] shadow-sm scale-102"
                  : "text-gray-500 hover:text-gray-900"
                }`}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("pending")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${filterStatus === "pending"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-102"
                  : "text-amber-800 hover:bg-amber-100/60"
                }`}
            >
              ⏳ Pending ({stats.pending})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("approved")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${filterStatus === "approved"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-102"
                  : "text-emerald-800 hover:bg-emerald-100/60"
                }`}
            >
              🟢 Approved ({stats.approved})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("rejected")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${filterStatus === "rejected"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-102"
                  : "text-rose-800 hover:bg-rose-100/60"
                }`}
            >
              🔴 Rejected ({stats.rejected})
            </button>
          </div>

          {/* Search Query Input */}
          <div className="relative min-w-[200px] flex-1">
            <Input
              prefix={<Search size={14} className="text-gray-400 mr-1" />}
              placeholder="Search artist or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="rounded-2xl border-gray-200 text-xs py-1.5 px-3"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Artist Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Artist:</span>
            <Select
              allowClear
              placeholder="All Nail Artists"
              loading={isArtistsLoading}
              value={filterArtistId}
              onChange={(value) => {
                setFilterArtistId(value);
                setCurrentPage(1);
              }}
              style={{ width: 170 }}
              className="rounded-xl text-xs font-medium"
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
            <span className="text-xs font-bold text-gray-500">Date:</span>
            <DatePicker
              value={filterDate ? dayjs(filterDate) : null}
              onChange={(date, dateString) => {
                setFilterDate(dateString || "");
                setCurrentPage(1);
              }}
              className="rounded-xl border-gray-200 text-xs"
              format="YYYY-MM-DD"
              placeholder="Select date"
            />
          </div>

          {/* Clear Filters */}
          {(filterArtistId || filterDate || filterStatus !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setFilterArtistId(undefined);
                setFilterDate("");
                setFilterStatus("all");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="rounded-2xl bg-gray-100 hover:bg-gray-200 px-3.5 py-1.5 text-xs font-extrabold text-gray-700 transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content List / Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <Spin size="large" />
          <span className="text-xs font-bold text-gray-400">Loading break requests from server...</span>
        </div>
      ) : filteredBreaks.length === 0 ? (
        <EmptyState
          title="No break requests found"
          description={
            searchQuery || filterArtistId || filterDate || filterStatus !== "all"
              ? "No break requests match your current search and filter criteria."
              : "There are no nail artist break requests submitted yet."
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gradient-to-r from-[#FAF0F5] via-[#FAF5F8] to-[#FAF0F5]">
                  <tr className="text-left text-[11px] uppercase tracking-wider font-bold text-[#8C4368]">
                    <th className="px-6 py-4">Nail Artist</th>
                    <th className="px-6 py-4">Break Date</th>
                    <th className="px-6 py-4">Time Slot & Duration</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Rejection Note</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredBreaks.map((item) => {
                    const st = String(item.status || "").toLowerCase();
                    const isPending = st === "pending" || st === "chờ duyệt";
                    const artistName = getArtistName(item.nailArtistId);
                    const slotDuration = getSlotDuration(item.startTime, item.endTime);

                    return (
                      <tr
                        key={item.nailArtistBreakId}
                        className="align-middle text-xs font-medium text-gray-800 hover:bg-[#FAF8FA]/80 transition-colors"
                      >
                        {/* Nail Artist */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C97A9E] to-[#9E4D76] text-white font-bold text-sm shadow-md shadow-[#C97A9E]/20 shrink-0">
                              {artistName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-extrabold text-[#221F26] text-xs truncate">
                                {artistName}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400 truncate">
                                ID: {String(item.nailArtistBreakId).slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Break Date */}
                        <td className="px-6 py-4 font-bold text-gray-800">
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 inline-flex">
                            <CalendarDays size={14} className="text-[#C97A9E]" />
                            <span>{dayjs(item.breakDate).format("DD/MM/YYYY")}</span>
                          </div>
                        </td>

                        {/* Time Slot & Duration */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <div className="flex items-center gap-1.5 font-extrabold text-gray-900 bg-purple-50/70 px-3 py-1 rounded-xl border border-purple-100 inline-flex">
                              <Clock3 size={13} className="text-[#C97A9E]" />
                              <span>
                                {item.startTime?.substring(0, 5)} - {item.endTime?.substring(0, 5)}
                              </span>
                            </div>
                            {slotDuration && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-md">
                                {slotDuration}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex items-start gap-1.5 text-gray-700 font-medium">
                            <MessageSquareText size={13} className="text-gray-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2" title={item.reason}>
                              {item.reason || "Shift break / Personal matter"}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">{getStatusBadge(item.status)}</td>

                        {/* Rejection Note */}
                        <td className="px-6 py-4 max-w-xs">
                          {item.rejectReason ? (
                            <span className="text-xs text-rose-600 font-bold italic line-clamp-2" title={item.rejectReason}>
                              💬 &quot;{item.rejectReason}&quot;
                            </span>
                          ) : (
                            <span className="text-gray-300 font-mono text-xs">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBreak(item);
                                    setIsApproveModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Check size={14} strokeWidth={2.5} /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBreak(item);
                                    setRejectReasonInput("");
                                    setIsRejectModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                >
                                  <X size={14} strokeWidth={2.5} /> Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] font-extrabold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                                Processed
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBreak(item);
                                setIsDeleteOpen(true);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer ml-1 shadow-2xs"
                              title="Delete request record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

      {/* Modal Confirm Approve */}
      <ActionConfirmModal
        open={isApproveModalOpen}
        intent="success"
        title="Approve Break Request?"
        description="Confirm approval for the nail artist break request during this time slot."
        confirmText="Approve Request"
        cancelText="Cancel"
        onConfirm={handleApprove}
        onCancel={() => {
          setIsApproveModalOpen(false);
          setSelectedBreak(null);
        }}
        loading={isActionLoading}
        details={[
          {
            label: "Nail Artist",
            value: selectedBreak ? getArtistName(selectedBreak.nailArtistId) : "",
          },
          {
            label: "Break Date",
            value: selectedBreak ? dayjs(selectedBreak.breakDate).format("DD/MM/YYYY") : "",
          },
          {
            label: "Time Slot",
            value: selectedBreak
              ? `${selectedBreak.startTime?.substring(0, 5)} - ${selectedBreak.endTime?.substring(0, 5)}`
              : "",
          },
        ]}
      />

      {/* Modal Reject Request with Reason Input */}
      <Modal
        open={isRejectModalOpen}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setSelectedBreak(null);
          setRejectReasonInput("");
        }}
        footer={null}
        centered
        width={460}
        className="rounded-3xl overflow-hidden"
      >
        <div className="p-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <XCircle size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#221F26]">Reject Break Request</h3>
              <p className="text-xs text-gray-500 font-medium">
                Please provide a reason for declining this request.
              </p>
            </div>
          </div>

          {selectedBreak && (
            <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200/70 text-xs space-y-1.5">
              <p className="font-extrabold text-rose-950">
                Nail Artist: {getArtistName(selectedBreak.nailArtistId)}
              </p>
              <p className="text-rose-800 font-semibold">
                Slot: {dayjs(selectedBreak.breakDate).format("DD/MM/YYYY")} ({selectedBreak.startTime?.substring(0, 5)} - {selectedBreak.endTime?.substring(0, 5)})
              </p>
              <p className="text-gray-600 italic">Reason: &quot;{selectedBreak.reason || "Shift break"}&quot;</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#221F26]">
              Rejection Reason (Sent to artist):
            </label>
            <Input.TextArea
              rows={3}
              placeholder="Enter rejection reason (e.g., High customer volume during shift...)"
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              className="rounded-2xl border-gray-200 text-xs font-medium py-2 px-3"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setIsRejectModalOpen(false);
                setSelectedBreak(null);
                setRejectReasonInput("");
              }}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRejectConfirm}
              disabled={isActionLoading}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 transition cursor-pointer shadow-md shadow-rose-600/20 inline-flex items-center gap-1.5"
            >
              {isActionLoading && <Spin size="small" />}
              <span>Confirm Rejection</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <ActionConfirmModal
        open={isDeleteOpen}
        intent="danger"
        title="Delete Break Request?"
        description="This action will permanently delete this break request record."
        confirmText="Delete Request"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteOpen(false);
          setSelectedBreak(null);
        }}
        loading={isActionLoading}
        details={[
          {
            label: "Nail Artist",
            value: selectedBreak ? getArtistName(selectedBreak.nailArtistId) : "",
          },
          {
            label: "Break Date",
            value: selectedBreak ? dayjs(selectedBreak.breakDate).format("DD/MM/YYYY") : "",
          },
        ]}
      />
    </div>
  );
}
