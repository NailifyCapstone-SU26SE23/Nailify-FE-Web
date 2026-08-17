import {
  Clock,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  Calendar,
  Filter,
  Sparkles,
  RefreshCw,
  Eye,
  Hourglass,
  ArrowUpDown,
  CalendarClock,
  MapPin,
  Scissors,
  Timer,
  UserRound,
  BellRing,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Drawer, Spin, Input, Select, Button, Alert } from "antd";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { fetchSalonWaitlist } from "../services/bookingsService";
import { loadAuthSession } from "../../../core/auth/model/authStorage";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

dayjs.extend(duration);

const STATUS_META = {
  WAITING: {
    label: "Waiting for slot",
    labelVi: "Đang chờ xếp chỗ",
    className: "border-[#ffd9a8] bg-[#fff7ed] text-[#c76a00]",
  },
  NOTIFIED: {
    label: "Offer sent",
    labelVi: "Đã gửi đề nghị",
    className: "border-[#c7d2fe] bg-[#eef2ff] text-[#4f46e5]",
  },
  CONFIRMED: {
    label: "Converted",
    labelVi: "Đã đặt lịch thành công",
    className: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
  },
  EXPIRED: {
    label: "Offer expired",
    labelVi: "Đề nghị đã hết hạn",
    className: "border-[#fecdd3] bg-[#fff1f2] text-[#be123c]",
  },
  CANCELLED: {
    label: "Cancelled",
    labelVi: "Đã hủy bỏ",
    className: "border-[#e5e7eb] bg-[#f9fafb] text-[#4b5563]",
  },
};

const STATUS_SORT_WEIGHT = {
  NOTIFIED: 0,
  WAITING: 1,
  CONFIRMED: 2,
  EXPIRED: 3,
  CANCELLED: 4,
};

// Get current manager's salonId
const getSalonId = () => {
  const session = loadAuthSession();
  return session?.user?.salonId || session?.salonId;
};

// Sub-component to render live countdown timers for Notified status
function NotifiedCountdown({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(100);
  const { language } = useLanguage();

  useEffect(() => {
    if (!expiresAt) return;

    const target = dayjs(expiresAt);
    const totalWindowSeconds = 15 * 60; // 15 minutes hold window

    const updateTimer = () => {
      const now = dayjs();
      const diffSeconds = target.diff(now, "second");

      if (diffSeconds <= 0) {
        setTimeLeft(language === "vi" ? "Hết hạn giữ chỗ" : "Hold Expired");
        setProgress(0);
        if (onExpire) onExpire();
        return;
      }

      // Format time left
      const mins = Math.floor(diffSeconds / 60);
      const secs = diffSeconds % 60;
      setTimeLeft(language === "vi" ? `${mins}phút ${secs.toString().padStart(2, "0")}giây` : `${mins}m ${secs.toString().padStart(2, "0")}s`);

      // Progress bar percentage
      const pct = Math.min(100, Math.max(0, (diffSeconds / totalWindowSeconds) * 100));
      setProgress(pct);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire, language]);

  if (timeLeft === (language === "vi" ? "Hết hạn giữ chỗ" : "Hold Expired")) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-[#e1447f]">
        <XCircle size={13} />
        <span>{language === "vi" ? "Hết hạn giữ chỗ" : "Hold Expired"}</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[180px] space-y-1">
      <div className="flex items-center justify-between text-[11px] font-bold text-[#ea4f93]">
        <span className="flex items-center gap-1">
          <Clock size={11} className="animate-spin" style={{ animationDuration: "3s" }} />
          {language === "vi" ? "Thời gian giữ chỗ:" : "Confirm hold:"}
        </span>
        <span>{timeLeft}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#fbe1ec]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ea4f93] to-[#ff75b5] transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Card Wrapper for stats
function StatCard({ title, value, icon: Icon, gradient, textColor, shadowColor, description }) {
  const { language } = useLanguage();
  return (
    <div className={`relative overflow-hidden rounded-[24px] bg-white p-5 border border-[#fbe7ef] shadow-sm transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#a88a9f]">{title}</p>
          <h3 className={`mt-2 text-3xl font-bold ${textColor}`}>{value}</h3>
          <p className="mt-1.5 text-[11px] font-medium text-[#7f6478]">{description}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${gradient} ${shadowColor} text-white shadow-lg`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

// Helper formats
function formatTimeSpan(timespanStr) {
  if (!timespanStr) return "N/A";
  // timespanStr looks like "14:30:00"
  const parts = timespanStr.split(":");
  if (parts.length < 2) return timespanStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function getStatusKey(status) {
  return String(status || "").toUpperCase();
}

function getWaitlistPosition(item, fallback = 999999) {
  const value = Number(item?.position);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getRequestedSlotValue(item) {
  if (!item?.requestedDate) return Number.MAX_SAFE_INTEGER;
  const datePart = dayjs(item.requestedDate).format("YYYY-MM-DD");
  const timePart = item.requestedStartTime || "00:00:00";
  const slot = dayjs(`${datePart}T${timePart}`);
  return slot.isValid() ? slot.valueOf() : dayjs(item.requestedDate).valueOf();
}

function getCreatedValue(item) {
  const created = dayjs(item?.createdAt);
  return created.isValid() ? created.valueOf() : Number.MAX_SAFE_INTEGER;
}

function getCustomerInitials(name) {
  return String(name || "Guest")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function QueueEntryCard({ item, fallbackPosition, isNext, onOpen, getStatusBadge, renderActionWindow }) {
  const statusKey = getStatusKey(item.status);
  const isActive = statusKey === "WAITING" || statusKey === "NOTIFIED";
  const position = getWaitlistPosition(item, fallbackPosition);
  const { language } = useLanguage();

  return (
    <article
      className={`group relative overflow-hidden rounded-[24px] border bg-gradient-to-tr from-[#ffffff] to-[#fffbfc] p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#ea4f93] ${isNext ? "border-[#f5a9ca] ring-4 ring-[#fff0f6]" : "border-[#edd8e5]"
        }`}
    >
      <div className={`absolute inset-y-0 left-0 w-[5px] bg-gradient-to-b ${isNext ? "from-[#ea4f93] to-[#7e4fe6]" : "from-[#ecd4e0] to-[#fceae6]"
        }`} />

      <div className="grid gap-4 pl-2 lg:grid-cols-[96px_minmax(220px,1.2fr)_minmax(150px,0.8fr)_minmax(210px,1fr)_minmax(190px,0.9fr)_50px] lg:items-center">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border text-center ${isActive ? "border-[#f7c7da] bg-[#fff4f8] text-[#d83f86]" : "border-[#e5e7eb] bg-[#f9fafb] text-[#64748b]"
              }`}
          >
            <span className="text-[9px] font-bold uppercase leading-none opacity-60">STT</span>
            <span className="mt-1 text-xl font-bold leading-none">{position}</span>
          </div>
          {isNext && (
            <span className="hidden rounded-full bg-[#402542] px-2.5 py-1 text-[9px] font-bold uppercase text-white lg:inline-flex animate-pulse">
              {language === "vi" ? "Lượt tiếp theo" : "Next to notify"}
            </span>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff9ac6] to-[#d83f86] text-sm font-bold text-white shadow-sm">
            {getCustomerInitials(item.customerName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-[#321735]">{item.customerName || "Guest"}</h3>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#9b7f92]">
              <UserRound size={13} className="text-[#a88a9f]" />
              {language === "vi" ? "Tham gia lúc" : "Joined at"}: {dayjs(item.createdAt).format("DD MMM, HH:mm")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#fff8fb] p-3 text-xs sm:grid-cols-3 lg:grid-cols-1 lg:bg-transparent lg:p-0">
          <div>
            <p className="font-bold uppercase text-[10px] tracking-wider text-[#b38da4]">{language === "vi" ? "Giờ yêu cầu" : "Requested Time"}</p>
            <p className="mt-1 flex items-center gap-1.5 font-bold text-[#321735]">
              <Calendar size={13} className="text-[#ea4f93]" />
              {dayjs(item.requestedDate).format("DD MMM")}
            </p>
            <p className="mt-1 font-bold text-[#7e4fe6]">{formatTimeSpan(item.requestedStartTime)}</p>
          </div>
          <div className="lg:hidden">
            <p className="font-bold uppercase text-[10px] tracking-wider text-[#b38da4]">{language === "vi" ? "Thời lượng" : "Duration"}</p>
            <p className="mt-1 font-bold text-[#321735]">{item.estimatedDuration ? `${item.estimatedDuration}m` : "--"}</p>
          </div>
          <div className="lg:hidden">
            <p className="font-bold uppercase text-[10px] tracking-wider text-[#b38da4]">{language === "vi" ? "Thợ yêu cầu" : "Requested Artist"}</p>
            <p className="mt-1 truncate font-bold text-[#321735]">{item.preferredNailArtistName || (language === "vi" ? "Không chỉ định" : "Unassigned")}</p>
          </div>
        </div>

        <div className="hidden min-w-0 text-sm lg:block">
          <p className="flex items-center gap-1.5 font-bold text-[#321735]">
            <Scissors size={15} className="text-[#ea4f93]" />
            <span className="truncate">{item.preferredNailArtistName || (language === "vi" ? "Không chỉ định" : "Unassigned")}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#9b7f92]">
            <MapPin size={13} className="text-[#a88a9f]" />
            <span className="truncate">{item.salonName || "Salon branch"}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#7e4fe6]">
            <Timer size={13} />
            {item.estimatedDuration ? `${item.estimatedDuration} ${language === "vi" ? "phút" : "mins"}` : (language === "vi" ? "Không ước tính" : "Not estimated")}
          </p>
        </div>

        <div className="rounded-xl border border-[#f5d0e3] bg-[#fffafd] p-3 text-sm">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#b38da4] tracking-wider">
            <BellRing size={13} className="text-[#ea4f93]" />
            {language === "vi" ? "Nhận thông báo" : "Slot Notification"}
          </p>
          <div>{getStatusBadge(item.status)}</div>
          <div className="mt-2">{renderActionWindow(item)}</div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={() => onOpen(item)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#f0d9e8] bg-white text-[#ea4f93] shadow-sm transition hover:border-[#ea4f93]/40 hover:bg-[#fff5f9] active:scale-95 cursor-pointer"
            title="Waitlist Details"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ManagerWaitlistPage() {
  const [waitlistData, setWaitlistData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState("queue");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const salonId = getSalonId();

  const loadWaitlist = useCallback(async () => {
    if (!salonId) {
      setError("Salon ID is not configured in your profile.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const result = await fetchSalonWaitlist(salonId, {
        pageNumber: 1,
        pageSize: 100, // Load all to handle client filtering & live state
      });

      if (result && Array.isArray(result.items)) {
        setWaitlistData(result.items);
        setTotalCount(result.totalCount || result.items.length);
      } else {
        setWaitlistData([]);
      }
    } catch (err) {
      console.error("Failed to fetch waitlist:", err);
      setError(err.message || "An error occurred while loading waitlist entries.");
    } finally {
      setIsLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadWaitlist();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadWaitlist]);

  const stats = useMemo(() => {
    let waiting = 0;
    let notified = 0;
    let expired = 0;
    let confirmed = 0;

    waitlistData.forEach((item) => {
      const status = String(item.status || "").toUpperCase();
      if (status === "WAITING") waiting++;
      else if (status === "NOTIFIED") notified++;
      else if (status === "EXPIRED") expired++;
      else if (status === "CONFIRMED") confirmed++;
    });

    return { waiting, notified, expired, confirmed };
  }, [waitlistData]);

  const filteredList = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return waitlistData.filter((item) => {
      const matchesSearch =
        !normalizedQuery ||
        String(item.customerName || "")
          .toLowerCase()
          .includes(normalizedQuery) ||
        String(item.preferredNailArtistName || "")
          .toLowerCase()
          .includes(normalizedQuery) ||
        String(item.salonName || "")
          .toLowerCase()
          .includes(normalizedQuery);

      const itemStatus = getStatusKey(item.status);
      const matchesStatus = statusFilter === "ALL" || itemStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [waitlistData, searchQuery, statusFilter]);

  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      const statusDelta =
        (STATUS_SORT_WEIGHT[getStatusKey(a.status)] ?? 9) -
        (STATUS_SORT_WEIGHT[getStatusKey(b.status)] ?? 9);
      const positionDelta = getWaitlistPosition(a) - getWaitlistPosition(b);
      const slotDelta = getRequestedSlotValue(a) - getRequestedSlotValue(b);
      const createdDelta = getCreatedValue(a) - getCreatedValue(b);

      if (sortMode === "requestAsc") {
        return slotDelta || positionDelta || createdDelta;
      }

      if (sortMode === "requestDesc") {
        return -slotDelta || positionDelta || createdDelta;
      }

      if (sortMode === "newest") {
        return -createdDelta || positionDelta || slotDelta;
      }

      return statusDelta || positionDelta || slotDelta || createdDelta;
    });
  }, [filteredList, sortMode]);

  const queuePriorityList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      const statusDelta =
        (STATUS_SORT_WEIGHT[getStatusKey(a.status)] ?? 9) -
        (STATUS_SORT_WEIGHT[getStatusKey(b.status)] ?? 9);
      const positionDelta = getWaitlistPosition(a) - getWaitlistPosition(b);
      const slotDelta = getRequestedSlotValue(a) - getRequestedSlotValue(b);
      const createdDelta = getCreatedValue(a) - getCreatedValue(b);

      return statusDelta || positionDelta || slotDelta || createdDelta;
    });
  }, [filteredList]);

  const nextGuest = useMemo(() => {
    return queuePriorityList.find((item) => {
      const status = getStatusKey(item.status);
      return status === "WAITING" || status === "NOTIFIED";
    });
  }, [queuePriorityList]);

  const totalPages = Math.max(1, Math.ceil(sortedList.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);

  const paginatedList = useMemo(() => {
    const start = (visiblePage - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, visiblePage, pageSize]);

  const handleOpenDrawer = (item) => {
    setSelectedEntry(item);
    setIsDrawerOpen(true);
  };

  const getStatusBadge = (status) => {
    const key = getStatusKey(status);
    const meta = STATUS_META[key] || {
      label: status || "Unknown",
      className: "border-[#e5e7eb] bg-white text-[#4b5563]",
    };

    return (
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${meta.className}`}>
        {meta.label}
      </span>
    );
  };

  const renderActionWindow = (item) => {
    const statusKey = getStatusKey(item.status);

    if (statusKey === "NOTIFIED" && item.expiresAt) {
      return <NotifiedCountdown expiresAt={item.expiresAt} onExpire={loadWaitlist} />;
    }

    if (item.convertedBookingId) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2fa25f]">
          <CheckCircle2 size={13} />
          Booked
        </span>
      );
    }

    return <span className="text-xs font-semibold text-[#9b7f92]">Waiting for a cancelled/open slot</span>;
  };

  return (
    <div className="space-y-5 pb-12 bg-gradient-to-br from-[#fff6fb] via-[#fffbfd] to-[#fcfcfd] min-h-full">
      {/* Header and sync status banner */}
      <div className="overflow-hidden rounded-[28px] border border-[#f5e3ed] bg-white shadow-md">
        <div className="grid gap-0 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="bg-[#321735] bg-gradient-to-br from-[#3b1c3e] via-[#4d2551] to-[#311734] p-6 text-white relative overflow-hidden">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-pink-500/10 blur-xl" />
            <div className="relative z-10 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                {language === "vi" ? "Giám Sát Hàng Chờ Tự Động" : "Automated Waitlist Monitor"}
              </span>
              <span className="text-xs font-semibold text-white/60">{language === "vi" ? `Đã tải ${totalCount || waitlistData.length} lượt` : `Loaded ${totalCount || waitlistData.length} entries`}</span>
            </div>

            <div className="relative z-10 mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-pink-100">{language === "vi" ? "Danh Sách Chờ Nhận Lượt" : "Slot Recovery Waitlist"}</h1>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-white/70">
                  {language === "vi" ? "Khi một khách hàng hủy cuộc hẹn đã đặt, hệ thống sẽ tự động gửi thông báo ưu tiên nhận slot trống cho khách hàng đủ điều kiện đầu tiên trong danh sách chờ dưới đây." : "When a customer cancels a booked appointment, the system will automatically send a priority slot offer to the first eligible customer in the waitlist below."}
                </p>
              </div>
              <button
                onClick={loadWaitlist}
                disabled={isLoading}
                className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#402542] shadow-md transition hover:bg-pink-50 hover:shadow active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                {language === "vi" ? "Tải Lại Danh Sách" : "Refresh Waitlist"}
              </button>
            </div>
          </div>

          <div className="bg-[#fff8fb] p-6 border-l border-[#f5e3ed] flex flex-col justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a77f98]">{language === "vi" ? "Khách Hàng Tiếp Theo Được Nhận Lượt" : "Next Customer to Receive Slot"}</p>
            {nextGuest ? (
              <div className="mt-3 flex items-center gap-4 bg-white p-3 rounded-2xl border border-[#fcd5e6] shadow-sm">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#402542] text-white shadow-sm">
                  <span className="text-[8px] font-bold uppercase leading-none opacity-60">STT</span>
                  <span className="mt-0.5 text-xl font-bold leading-none">{getWaitlistPosition(nextGuest, 1)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold text-[#321735]">{nextGuest.customerName || "Guest"}</h2>
                  <p className="mt-0.5 text-xs font-bold text-[#ea4f93]">
                    {dayjs(nextGuest.requestedDate).format("DD MMM")} - {formatTimeSpan(nextGuest.requestedStartTime)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-[#a77f98]">
                    {language === "vi" ? "Yêu cầu" : "Requested"}: {nextGuest.preferredNailArtistName || (language === "vi" ? "Bất kỳ thợ nào" : "Any Artist")} · {nextGuest.estimatedDuration}m
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-[#fcd5e6] bg-white p-4 text-xs font-bold text-[#a77f98] text-center">
                {language === "vi" ? "Hiện tại không có khách nào đang chờ." : "No customers are currently waiting."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Queue stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={language === "vi" ? "Đang Chờ Xếp Chỗ" : "Waiting For Slot"}
          value={stats.waiting}
          icon={Hourglass}
          gradient="from-[#ffafcc] to-[#ea4f93]"
          textColor="text-[#ea4f93]"
          shadowColor="shadow-[#ea4f93]/15"
          description={language === "vi" ? "Khách hàng đang xếp hàng chờ có lịch trống" : "Guests queued for a cancelled/open slot"}
        />
        <StatCard
          title={language === "vi" ? "Đã Gửi Đề Nghị" : "Offer Sent"}
          value={stats.notified}
          icon={Clock}
          gradient="from-[#c4b5fd] to-[#7e4fe6]"
          textColor="text-[#7e4fe6]"
          shadowColor="shadow-[#7e4fe6]/15"
          description={language === "vi" ? "Khách được thông báo xác nhận slot trống" : "Guests notified to confirm the slot"}
        />
        <StatCard
          title={language === "vi" ? "Đề Nghị Đã Hết Hạn" : "Expired Offers"}
          value={stats.expired}
          icon={XCircle}
          gradient="from-[#fda4af] to-[#e1447f]"
          textColor="text-[#e1447f]"
          shadowColor="shadow-[#e1447f]/15"
          description={language === "vi" ? "Hết thời gian xác nhận lịch đặt giữ" : "Confirmation window ended"}
        />
        <StatCard
          title={language === "vi" ? "Đã Chuyển Đặt Lịch" : "Converted Bookings"}
          value={stats.confirmed}
          icon={UserCheck}
          gradient="from-[#6ee7b7] to-[#2fa25f]"
          textColor="text-[#2fa25f]"
          shadowColor="shadow-[#2fa25f]/15"
          description={language === "vi" ? "Khách hàng trong danh sách đã đặt thành công" : "Waitlist guests booked successfully"}
        />
      </div>

      {/* Search and filters */}
      <div className="rounded-2xl border border-[#fbe7ef] bg-white p-5 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_220px_240px]">
          <Input
            placeholder={language === "vi" ? "Tìm kiếm tên khách, thợ nail hoặc chi nhánh..." : "Search guest, artist, or salon branch..."}
            prefix={<Search size={16} className="text-[#c08aa4]" />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 rounded-xl border-[#f0d9e8] focus:border-[#ea4f93] hover:border-[#ea4f93]/60 focus:shadow-[0_0_0_2px_rgba(234,79,147,0.1)]"
          />

          <div className="flex items-center gap-2 rounded-xl border border-[#f0d9e8] px-3">
            <span className="text-xs font-bold text-[#7f6478] flex items-center gap-1.5 shrink-0">
              <Filter size={14} /> Trạng thái:
            </span>
            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              options={[
                { value: "ALL", label: language === "vi" ? "Tất cả trạng thái" : "All Statuses" },
                { value: "WAITING", label: language === "vi" ? "Đang chờ xếp chỗ" : "Waiting for slot" },
                { value: "NOTIFIED", label: language === "vi" ? "Đã gửi đề nghị" : "Offer sent" },
                { value: "CONFIRMED", label: language === "vi" ? "Đã đặt lịch" : "Converted" },
                { value: "EXPIRED", label: language === "vi" ? "Đã hết hạn" : "Offer expired" },
                { value: "CANCELLED", label: language === "vi" ? "Đã hủy" : "Cancelled" },
              ]}
              variant="borderless"
              className="h-11 flex-1"
              dropdownClassName="rounded-xl border-[#f0d9e8]"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#f0d9e8] px-3">
            <span className="text-xs font-bold text-[#7f6478] flex items-center gap-1.5 shrink-0">
              <ArrowUpDown size={14} /> Sắp xếp:
            </span>
            <Select
              value={sortMode}
              onChange={(value) => {
                setSortMode(value);
                setCurrentPage(1);
              }}
              options={[
                { value: "queue", label: language === "vi" ? "Thứ tự ưu tiên" : "Notify priority" },
                { value: "requestAsc", label: language === "vi" ? "Giờ đặt sớm nhất" : "Earliest requested slot" },
                { value: "requestDesc", label: language === "vi" ? "Giờ đặt trễ nhất" : "Latest requested slot" },
                { value: "newest", label: language === "vi" ? "Mới đăng ký nhất" : "Newest waitlist entry" },
              ]}
              variant="borderless"
              className="h-11 flex-1"
              dropdownClassName="rounded-xl border-[#f0d9e8]"
            />
          </div>
        </div>

        {error && (
          <Alert message={error} type="error" showIcon className="rounded-xl border-[#fca5a5] bg-[#fff5f5]" />
        )}
      </div>

      {/* Live queue board */}
      <div className="rounded-2xl border border-[#fbe7ef] bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#fbe7ef] pb-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-bold text-[#402542]">{language === "vi" ? "Hàng chờ phục hồi slot trống" : "Slot release queue"}</h2>
            <p className="mt-1 text-xs font-semibold text-[#9b7f92]">
              {language === "vi" ? `Hiển thị ${sortedList.length} khách đang đợi khung giờ yêu cầu được trống.` : `Showing ${sortedList.length} guests waiting for their requested slot to become available.`}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-[#fff4f8] px-3 py-2 text-xs font-bold text-[#d83f86]">
            <CalendarClock size={14} />
            {sortMode === "queue" ? (language === "vi" ? "Thứ tự ưu tiên gửi tin" : "Notify order: priority first") : (language === "vi" ? "Đang áp dụng bộ lọc xếp" : "Custom sort active")}
          </div>
        </div>
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <Spin size="large" className="pink-spin" />
            <p className="text-sm font-semibold text-[#a88a9f]">{language === "vi" ? "Đang đồng bộ dữ liệu..." : "Syncing queue data..."}</p>
          </div>
        ) : sortedList.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center border-2 border-dashed border-[#f8deea] rounded-2xl">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0f5] text-[#ea4f93]">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-[#402542]">{language === "vi" ? "Không tìm thấy khách hàng nào" : "No Waitlist Guests Found"}</h3>
            <p className="text-xs text-[#a88a9f] max-w-xs">
              {language === "vi" ? "Không có khách nào đang chờ có lịch trống khớp với bộ lọc của bạn." : "No guests are currently waiting for a cancelled/open slot matching your filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {paginatedList.map((item, idx) => {
                const priorityIndex = (visiblePage - 1) * pageSize + idx + 1;
                const isNext = nextGuest?.wailistId === item.wailistId;

                return (
                  <QueueEntryCard
                    key={item.wailistId}
                    item={item}
                    fallbackPosition={priorityIndex}
                    isNext={isNext}
                    onOpen={handleOpenDrawer}
                    getStatusBadge={getStatusBadge}
                    renderActionWindow={renderActionWindow}
                  />
                );
              })}
            </div>

            {/* Pagination component */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-[#fbe7ef] pt-4">
                <p className="text-xs font-semibold text-[#a88a9f]">
                  {language === "vi" ? `Hiển thị Trang ${visiblePage} / ${totalPages} (Tổng cộng ${sortedList.length} mục)` : `Showing Page {visiblePage} of {totalPages} ({sortedList.length} items total)`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={visiblePage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                    className="rounded-xl border border-[#f0d9e8] bg-white px-3.5 py-2 text-xs font-bold text-[#402542] hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                  >
                    {language === "vi" ? "Trang trước" : "Previous"}
                  </button>
                  <button
                    disabled={visiblePage === totalPages}
                    onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                    className="rounded-xl border border-[#f0d9e8] bg-white px-3.5 py-2 text-xs font-bold text-[#402542] hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                  >
                    {language === "vi" ? "Trang sau" : "Next"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Waitlist entry details drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2.5">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#ffe7ef] text-[#ea4f93]">
              <Sparkles size={16} />
            </div>
            <span className="font-extrabold text-[#402542]">{language === "vi" ? "Chi Tiết Đề Nghị Slot Trống" : "Slot Offer Details"}</span>
          </div>
        }
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        width={420}
        headerStyle={{ borderBottom: "1px solid #fbe7ef", padding: "16px 24px" }}
        bodyStyle={{ padding: "24px" }}
        className="manager-drawer"
      >
        {selectedEntry && (
          <div className="space-y-6">
            <div className="rounded-[20px] bg-gradient-to-br from-[#fff7fb] to-[#fffbfc] p-5 border border-[#fcd5e6]/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ffc5de] to-[#ea4f93] text-sm font-extrabold text-white">
                  {(selectedEntry.customerName || "??")
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-[#402542]">{selectedEntry.customerName}</h4>
                  <div className="mt-1 flex items-center gap-1.5">
                    {getStatusBadge(selectedEntry.status)}
                    <span className="text-[11px] font-bold text-[#ea4f93] bg-[#fff0f5] border border-[#fbe1ec] rounded-full px-2">
                      {language === "vi" ? `Ưu tiên báo: #${selectedEntry.position}` : `Notify Priority: #${selectedEntry.position}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#a88a9f]">{language === "vi" ? "Khung Giờ Mong Muốn" : "Wanted Slot"}</h5>
              <div className="rounded-xl border border-[#fbe7ef] bg-[#fffcfd] p-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#8b7382]">{language === "vi" ? "Ngày yêu cầu:" : "Requested Date:"}</span>
                  <span className="font-bold text-[#402542]">{dayjs(selectedEntry.requestedDate).format("dddd, DD MMMM YYYY")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#8b7382]">{language === "vi" ? "Giờ yêu cầu:" : "Requested Time:"}</span>
                  <span className="font-bold text-[#7e4fe6]">{formatTimeSpan(selectedEntry.requestedStartTime)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#8b7382]">{language === "vi" ? "Thời lượng dự kiến:" : "Estimated Duration:"}</span>
                  <span className="font-bold text-[#ea4f93]">{selectedEntry.estimatedDuration} {language === "vi" ? "phút" : "minutes"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#a88a9f]">{language === "vi" ? "Nhân Viên & Chi Nhánh" : "Staff & Branch"}</h5>
              <div className="rounded-xl border border-[#fbe7ef] bg-[#fffcfd] p-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#8b7382]">{language === "vi" ? "Thợ yêu cầu:" : "Preferred Nail Artist:"}</span>
                  <span className="font-bold text-[#402542]">{selectedEntry.preferredNailArtistName || (language === "vi" ? "Không chỉ định" : "Unassigned")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#8b7382]">{language === "vi" ? "Chi nhánh Salon:" : "Salon Branch:"}</span>
                  <span className="font-bold text-[#402542]">{selectedEntry.salonName || "Salon Branch"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#a88a9f]">{language === "vi" ? "Lịch Sử Thời Gian" : "Audit Timestamps"}</h5>
              <div className="rounded-xl border border-[#fbe7ef] bg-[#fffcfd] p-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#8b7382]">{language === "vi" ? "Vào hàng chờ lúc:" : "Entered Waitlist:"}</span>
                  <span className="font-bold text-[#402542]">{dayjs(selectedEntry.createdAt).format("DD MMM YYYY, HH:mm:ss")}</span>
                </div>
                {selectedEntry.notifiedAt && (
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#8b7382]">{language === "vi" ? "Gửi đề nghị lúc:" : "Offer Sent:"}</span>
                    <span className="font-bold text-[#7e4fe6]">{dayjs(selectedEntry.notifiedAt).format("DD MMM YYYY, HH:mm:ss")}</span>
                  </div>
                )}
                {selectedEntry.expiresAt && (
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#8b7382]">{language === "vi" ? "Hết hạn đề nghị lúc:" : "Offer Expires:"}</span>
                    <span className="font-bold text-[#e1447f]">{dayjs(selectedEntry.expiresAt).format("DD MMM YYYY, HH:mm:ss")}</span>
                  </div>
                )}
                {selectedEntry.convertedBookingId && (
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#8b7382]">{language === "vi" ? "Đặt lịch thành công:" : "Booking Created:"}</span>
                    <span className="font-bold text-[#2fa25f]">ID: {selectedEntry.convertedBookingId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="default"
                onClick={() => setIsDrawerOpen(false)}
                className="w-full h-11 rounded-xl font-bold border-[#f0d9e8] text-[#402542] hover:text-[#ea4f93] hover:border-[#ea4f93] cursor-pointer"
              >
                {language === "vi" ? "Đóng Bảng" : "Close Panel"}
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
