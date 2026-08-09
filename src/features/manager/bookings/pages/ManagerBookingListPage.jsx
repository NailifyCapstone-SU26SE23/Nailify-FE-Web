import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock3,
  Eye,
  Search,
  Sparkles,
  UserCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Maximize2,
  Phone,
  User,
  ShieldCheck,
  TrendingUp,
  Filter,
  Sparkle,
  LayoutGrid,
  CalendarDays,
  Grid as GridIcon,
  Table as TableIcon,
  GripVertical,
  Plus,
  Image as ImageIcon,
  Edit3,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Spin, Alert, DatePicker, Drawer, Modal, Tooltip } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ROLES } from "../../../../shared/constants/roles";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { BOOKING_ROLE_CONFIG } from "../services/mockBookings";
import { fetchBookingsBySalonId, fetchBookingById, fetchUserById, fetchSalonStaff, assignArtistToBookingOld } from "../services/bookingsService";
import { AssignArtistModal } from "../components/AssignArtistModal";
import { ConfirmBookingModal } from "../components/ConfirmBookingModal";
import { RejectBookingModal } from "../components/RejectBookingModal";
import { CancelBookingModal } from "../components/CancelBookingModal";
import { Pagination } from "../../../../shared/components/common/Pagination";
import { getSalonId, getSalonIdAsync } from "../../staff-artist-management/services/nailArtistsService";

import { loadAuthSession } from "../../../core/auth/model/authStorage";

const roleConfig = BOOKING_ROLE_CONFIG[ROLES.manager];
const BOOKING_PAGE_SIZE = 10;
const getManagerSalonId = () => {
  const session = loadAuthSession();
  return session?.user?.salonId || session?.salonId;
};

// --- Sample Luxury Nail Art Try-On Thumbnails for Demo ---
const SAMPLE_NAIL_THUMBNAILS = [
  "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80",
];

// --- Motion Presets ---
const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

// --- Custom Components ---
function PremiumCard({ className = "", children, noHover = false }) {
  return (
    <article
      className={`relative overflow-hidden rounded-[24px] border border-[#F3E2EC] bg-white p-6 shadow-[0_12px_32px_-8px_rgba(219,70,117,0.05)] transition-all duration-300 ease-out ${!noHover ? "hover:-translate-y-1 hover:shadow-[0_20px_40px_-8px_rgba(219,70,117,0.12)] hover:border-[#E8C5D8]" : ""
        } ${className}`}
    >
      {children}
    </article>
  );
}

PremiumCard.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  noHover: PropTypes.bool,
};

function SectionHeading({ title, subtitle, icon: Icon, actionButton }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-2.5">
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFF0F5] to-[#FFE4EE] text-[#E84F93] shadow-xs">
            <Icon size={16} />
          </div>
        )}
        <div>
          <h3 className="text-base font-bold text-[#2B182B] tracking-tight flex items-center gap-2">
            {title}
          </h3>
          {subtitle ? <p className="mt-0.5 text-xs text-[#9E8497] leading-relaxed">{subtitle}</p> : null}
        </div>
      </div>
      {actionButton}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  actionButton: PropTypes.node,
};

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9E8497] mb-1">{label}</p>
      <div className="text-sm font-medium text-[#2B182B] break-all">{children}</div>
    </div>
  );
}

InfoItem.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function StatusPill({ status, compact = false }) {
  const { t, language } = useLanguage();
  const getStyle = () => {
    switch (status) {
      case "Checked In":
      case "CheckedIn":
        return "bg-[#EEF2FF] text-[#4338CA] border-[#A5B4FC] shadow-2xs";
      case "In Progress":
      case "InProgress":
        return "bg-[#F5F3FF] text-[#6D28D9] border-[#C4B5FD] shadow-2xs";
      case "Pending":
        return "bg-[#FFFBEB] text-[#B45309] border-[#FCD34D] shadow-2xs";
      case "Confirmed":
      case "Approved":
        return "bg-[#ECFDF5] text-[#047857] border-[#6EE7B7] shadow-2xs";
      case "Completed":
      case "ServiceCompleted":
        return "bg-[#ECFDF5] text-[#065F46] border-[#34D399] shadow-2xs";
      case "Rejected":
        return "bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5] shadow-2xs";
      case "RescheduleReq":
      case "Reschedule Req":
      case "ReschedulePending":
        return "bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74] shadow-2xs";
      case "RescheduleSuggested":
        return "bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD] shadow-2xs";
      default:
        return "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]";
    }
  };

  const formatDisplay = (s) => {
    switch (s) {
      case "Checked In":
      case "CheckedIn":
        return t("manager.dashboard.statusCalled") || "At Counter";
      case "In Progress":
      case "InProgress":
        return t("manager.dashboard.statusInService") || "In Progress";
      case "Pending":
        return t("manager.dashboard.statusWaiting") || "Pending";
      case "Confirmed":
      case "Approved":
        return t("manager.bookings.ready") || "Confirmed";
      case "Completed":
      case "ServiceCompleted":
        return t("manager.dashboard.statusDone") || "Completed";
      case "Rejected":
        return t("manager.breaks.statusRejected") || "Rejected";
      case "Cancelled":
      case "Canceled":
        return t("manager.bookings.cancelBooking") || "Cancelled";
      case "RescheduleReq":
      case "Reschedule Req":
      case "ReschedulePending":
        return t("manager.bookings.rescheduleTime") || "Reschedule Req";
      case "RescheduleSuggested":
        return t("manager.bookings.moveSchedule") || "Reschedule Proposed";
      default:
        return s;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${compact ? "px-2 py-0.5 text-[9px]" : "px-3 py-1 text-xs"} font-bold transition-all max-w-full truncate ${getStyle()}`}>
      {(status === "InProgress" || status === "In Progress") && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7C3AED]"></span>
        </span>
      )}
      <span className="truncate">{formatDisplay(status)}</span>
    </span>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-[#FAF0F5]/50">
          <div className="h-4 w-28 bg-[#F3D6E5] rounded-full" />
          <div className="h-4 w-40 bg-[#F3D6E5] rounded-full" />
          <div className="h-4 w-32 bg-[#F3D6E5] rounded-full" />
          <div className="h-4 w-32 bg-[#F3D6E5] rounded-full" />
          <div className="h-7 w-24 bg-[#F3D6E5] rounded-full" />
          <div className="h-8 w-28 bg-[#F3D6E5] rounded-full ml-auto" />
        </div>
      ))}
    </div>
  );
}

// --- Utility Functions ---
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const normalized = String(dateString).trim();
  const datePart = normalized.includes("T") ? normalized.split("T")[0] : normalized;
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return "N/A";
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(startTime, fallbackDateTime) {
  const normalizedTime = String(startTime || "").trim();
  const rawTime = normalizedTime
    || String(fallbackDateTime || "")
      .trim()
      .split("T")[1]
      ?.replace("Z", "")
      ?.split(".")[0];
  if (!rawTime) return "N/A";
  const [hours, minutes = 0, seconds = 0] = rawTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) return "N/A";
  return new Date(2000, 0, 1, hours, minutes, seconds).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimeRange(startTime, durationMinutes, fallbackDateTime) {
  const formattedStart = formatTime(startTime, fallbackDateTime);
  if (!durationMinutes || formattedStart === "N/A") return formattedStart;

  const normalizedTime = String(startTime || "").trim();
  let rawTime = normalizedTime
    || String(fallbackDateTime || "")
      .trim()
      .split("T")[1]
      ?.replace("Z", "")
      ?.split(".")[0];
  if (!rawTime) return formattedStart;

  let [hours, minutes = 0] = rawTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return formattedStart;

  const totalStartMinutes = hours * 60 + minutes;
  const totalEndMinutes = totalStartMinutes + (durationMinutes || 60);
  const endHours = Math.floor(totalEndMinutes / 60) % 24;
  const endMinutes = totalEndMinutes % 60;

  const formattedEnd = new Date(2000, 0, 1, endHours, endMinutes).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${formattedStart} - ${formattedEnd}`;
}

function formatVND(amount) {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

function formatDuration(totalMinutes) {
  if (!totalMinutes) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function getArtistDisplayName(artist) {
  const name = artist?.nailArtistName || artist?.artistName || artist?.fullName || artist?.name;
  return name === "Chưa chỉ định" ? "Unassigned" : name || "Unassigned";
}

function matchesFilter(status, filter) {
  if (filter === "All") return true;
  if (filter === "Reschedule") return status === "RescheduleReq" || status === "Reschedule Req" || status === "ReschedulePending" || status === "RescheduleSuggested";
  if (filter === "Completed") return status === "Completed" || status === "ServiceCompleted";
  return status === filter;
}

function getQrCodeSrc(qrCode) {
  if (!qrCode) return null;
  const trimmed = String(qrCode).trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 50) {
    return `data:image/png;base64,${trimmed}`;
  }
  return trimmed;
}

function mapBookingForDrawer(rawBooking) {
  const artistName = getArtistDisplayName(rawBooking);
  const artistId = rawBooking.staffId || rawBooking.nailArtistId || rawBooking.staffArtistId || rawBooking.artistId || null;
  return {
    ...rawBooking,
    id: rawBooking.bookingId || rawBooking.id,
    bookingId: rawBooking.bookingId || rawBooking.id,
    date: formatDate(rawBooking.bookingDate || rawBooking.createdAt),
    time: formatTime(rawBooking.startTime, rawBooking.bookingDate || rawBooking.createdAt),
    customerName: rawBooking.customerName || (rawBooking.customer ? `${rawBooking.customer.firstName} ${rawBooking.customer.lastName}` : "Unknown Customer"),
    customerId: rawBooking.customerId,
    phone: rawBooking.customerPhone || rawBooking.phone || (rawBooking.customer ? rawBooking.customer.phone : "") || rawBooking.customer?.phoneNumber || rawBooking.phoneNumber,
    email: rawBooking.email || (rawBooking.customer ? rawBooking.customer.email : ""),
    serviceName: rawBooking.serviceName || "Nail Service",
    artistName,
    artistId,
    deposit: rawBooking.depositAmount ? formatVND(rawBooking.depositAmount) : "Pending",
    depositAmount: rawBooking.depositAmount,
    depositTone: rawBooking.depositAmount ? "text-[#059669] font-bold" : "text-[#D97706] font-bold",
    status: rawBooking.status || "Pending",
    totalPrice: rawBooking.totalPrice,
    qrCode: rawBooking.qrCode,
    qtCode: rawBooking.qtCode,
    checkInImageUrl: rawBooking.checkInImageUrl,
    bookingItems: rawBooking.bookingItems || [],
    totalDuration: rawBooking.totalDuration,
    startTime: rawBooking.startTime,
    salonId: rawBooking.salonId,
  };
}

function mapApiBookingToUiFormat(apiBooking, index) {
  const customerName = apiBooking.customerName || (apiBooking.customer ? `${apiBooking.customer.firstName} ${apiBooking.customer.lastName}` : "Unknown Customer");
  const customerInitials = customerName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const artistName = getArtistDisplayName(apiBooking);
  const artistId = apiBooking.staffId || apiBooking.nailArtistId || apiBooking.staffArtistId || apiBooking.artistId || null;

  // Extract or assign thumbnail URL
  let thumbnail = null;
  if (apiBooking.bookingItems && apiBooking.bookingItems.length > 0) {
    const item = apiBooking.bookingItems[0];
    thumbnail = item.nailVariantImageUrl || item.customerNailImageUrl;
  }
  if (!thumbnail) {
    thumbnail = SAMPLE_NAIL_THUMBNAILS[index % SAMPLE_NAIL_THUMBNAILS.length];
  }

  // Precompute expensive fields for filtering
  const phoneVal = apiBooking.customerPhone || apiBooking.phone || apiBooking.customer?.phone || apiBooking.customer?.phoneNumber || apiBooking.phoneNumber || "";
  const serviceVal = apiBooking.serviceName || "Nail Service";
  const statusVal = apiBooking.status || "Pending";
  const searchString = [customerName, phoneVal, artistName, serviceVal, statusVal].join(" ").toLowerCase();

  let parsedDateStr = "";
  if (apiBooking.bookingDate || apiBooking.createdAt) {
    const d = dayjs(apiBooking.bookingDate || apiBooking.createdAt);
    if (d.isValid()) {
      parsedDateStr = d.format("YYYY-MM-DD");
    }
  }

  return {
    id: apiBooking.bookingId || apiBooking.id,
    bookingId: apiBooking.bookingId || apiBooking.id,
    searchString,
    parsedDateStr,
    bookingDate: apiBooking.bookingDate,
    date: formatDate(apiBooking.bookingDate || apiBooking.createdAt),
    time: formatTimeRange(apiBooking.startTime, apiBooking.totalDuration, apiBooking.bookingDate || apiBooking.createdAt),
    startTime: apiBooking.startTime,
    duration: formatDuration(apiBooking.totalDuration || 60),
    totalDuration: apiBooking.totalDuration,
    customer: customerName,
    customerName: customerName,
    customerId: apiBooking.customerId,
    phone: apiBooking.customerPhone || apiBooking.phone || (apiBooking.customer ? apiBooking.customer.phone : "") || apiBooking.customer?.phoneNumber || apiBooking.phoneNumber,
    email: apiBooking.email || (apiBooking.customer ? apiBooking.customer.email : ""),
    service: apiBooking.serviceName || "Nail Service",
    serviceName: apiBooking.serviceName,
    artist: artistName,
    nailArtistName: artistName,
    nailArtistId: artistId,
    deposit: apiBooking.depositAmount ? formatVND(apiBooking.depositAmount) : "Pending",
    depositAmount: apiBooking.depositAmount,
    depositTone: apiBooking.depositAmount ? "text-[#059669]" : "text-[#D97706]",
    status: apiBooking.status || "Pending",
    totalPrice: apiBooking.totalPrice,
    qrCode: apiBooking.qrCode,
    qtCode: apiBooking.qtCode,
    checkInImageUrl: apiBooking.checkInImageUrl,
    bookingItems: apiBooking.bookingItems || [],
    salonId: apiBooking.salonId,
    initials: customerInitials,
    thumbnailUrl: thumbnail,
    ...apiBooking,
  };
}

function isFinalStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  return s.includes("cancel") || s.includes("reject") || s.includes("complete") || s.includes("confirmed") || s.includes("approved");
}

const scheduleColorPalette = [
  { dot: "bg-[#8B5CF6]", tone: "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]" },
  { dot: "bg-[#E84F93]", tone: "border-[#FBCFE8] bg-[#FFF0F5] text-[#DB2777]" },
  { dot: "bg-[#3B82F6]", tone: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]" },
  { dot: "bg-[#10B981]", tone: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]" },
  { dot: "bg-[#F59E0B]", tone: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]" },
];

function formatHourLabel(hour) {
  if (hour === 12) return "12:00 PM";
  if (hour > 12) return `${hour - 12}:00 PM`;
  return `${hour}:00 AM`;
}

const appointmentFilters = [
  { value: "All", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "CheckedIn", label: "Checked In" },
  { value: "InProgress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Rejected", label: "Rejected" },
  { value: "Reschedule", label: "Reschedule" },
];

const KNOWN_STAFF_LIST = ["Luna Park", "Aria Nguyen", "Chloe Davis", "Mel Santos", "Unassigned"];

function getCalendarCardStyle(status) {
  switch (status) {
    case "CheckedIn":
    case "Checked In":
      return "border-[#A5B4FC] bg-[#EEF2FF] text-[#4338CA]";
    case "InProgress":
    case "In Progress":
      return "border-[#C4B5FD] bg-[#F5F3FF] text-[#6D28D9]";
    case "Pending":
      return "border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]";
    case "Confirmed":
    case "Approved":
      return "border-[#6EE7B7] bg-[#ECFDF5] text-[#047857]";
    case "Completed":
    case "ServiceCompleted":
      return "border-[#34D399] bg-[#ECFDF5] text-[#065F46]";
    case "Rejected":
      return "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]";
    case "RescheduleReq":
    case "Reschedule Req":
    case "ReschedulePending":
      return "border-[#FDBA74] bg-[#FFF7ED] text-[#C2410C]";
    case "RescheduleSuggested":
      return "border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]";
    default:
      return "border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563]";
  }
}


function getBookingStatusLabel(status, t) {
  switch (status) {
    case "Pending":
      return t("manager.dashboard.statusWaiting") || "Pending";

    case "Confirmed":
    case "Approved":
      return t("manager.bookings.ready") || "Confirmed";

    case "CheckedIn":
    case "Checked In":
      return t("manager.dashboard.statusCalled") || "Checked In";

    case "InProgress":
    case "In Progress":
      return t("manager.dashboard.statusInService") || "In Progress";

    case "Completed":
    case "ServiceCompleted":
      return t("manager.dashboard.statusDone") || "Completed";

    case "Rejected":
      return t("manager.breaks.statusRejected") || "Rejected";

    case "Cancelled":
    case "Canceled":
      return t("manager.bookings.cancelBooking") || "Cancelled";

    case "Reschedule":
    case "RescheduleReq":
    case "Reschedule Req":
    case "ReschedulePending":
      return t("manager.bookings.rescheduleTime") || "Reschedule";

    case "RescheduleSuggested":
      return (
        t("manager.bookings.moveSchedule") ||
        "Reschedule Proposed"
      );

    default:
      return status;
  }
}

// --- Main Page Component ---
export function ManagerBookingListPage() {
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [flashMessage] = useState(location.state?.flashMessage ?? "");
  const tableContainerRef = useRef(null);

  // View Mode: 'table' | 'day' | 'week' | 'month'
  const [viewMode, setViewMode] = useState("table");

  // Drag & Drop State
  const [draggedBooking, setDraggedBooking] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  // Thumbnail preview modal state
  const [activeImageModalUrl, setActiveImageModalUrl] = useState(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBookingForDrawer, setSelectedBookingForDrawer] = useState(null);
  const [selectedCustomerForDrawer, setSelectedCustomerForDrawer] = useState(null);
  const [isLoadingDrawer, setIsLoadingDrawer] = useState(false);

  // Schedule state
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('morning');
  const [scheduleDate, setScheduleDate] = useState(() => dayjs());
  const timeFilters = [
    { label: "9 AM - 3 PM", value: "morning", startHour: 9, endHour: 15 },
    { label: "3 PM - 8 PM", value: "afternoon", startHour: 15, endHour: 20 }
  ];

  // Core state
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState(() => dayjs());
  const [dateTo, setDateTo] = useState(() => dayjs());
  const [anchorDate, setAnchorDate] = useState(() => dayjs());
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Modal states
  const [isAssignArtistModalOpen, setIsAssignArtistModalOpen] = useState(false);
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedBookingForAction, setSelectedBookingForAction] = useState(null);
  const [isQrExpanded, setIsQrExpanded] = useState(false);
  const [expandedHours, setExpandedHours] = useState(new Set());
  const [selectedDateForModal, setSelectedDateForModal] = useState(null);
  const [isDayBookingsModalOpen, setIsDayBookingsModalOpen] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (!location.state?.flashMessage) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const [salonStaffList, setSalonStaffList] = useState([]);

  // Fetch salon staff once on mount or when salonId changes
  useEffect(() => {
    let active = true;
    const loadStaff = async () => {
      const salonId = (await getSalonIdAsync()) || getSalonId();
      if (!salonId) return;
      try {
        const staffMembers = await fetchSalonStaff(salonId);
        if (active) {
          setSalonStaffList(Array.isArray(staffMembers) ? staffMembers : staffMembers?.items || []);
        }
      } catch (staffErr) {
        console.warn("Failed to fetch salon staff:", staffErr);
      }
    };
    loadStaff();
    return () => {
      active = false;
    };
  }, []);

  const dayViewStaffList = useMemo(() => {
    if (!salonStaffList || salonStaffList.length === 0) {
      return [
        { id: "unassigned", name: "Unassigned", isUnassigned: true }
      ];
    }

    const artists = salonStaffList.map((member) => {
      const name = [member?.firstName, member?.lastName].filter(Boolean).join(" ").trim() || member?.fullName || member?.name || member?.email || "Thợ Nail";
      const staffArtistId = member?.staffArtistId || member?.staffId || member?.userId || member?.id;
      return {
        id: staffArtistId,
        staffArtistId,
        name,
        member,
        isUnassigned: false,
      };
    });

    return [
      ...artists,
      { id: "unassigned", name: "Unassigned", isUnassigned: true }
    ];
  }, [salonStaffList]);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const salonId = (await getSalonIdAsync()) || getSalonId();
      if (!salonId) {
        setError("No salon ID found in session. Please log in as a salon manager.");
        setIsLoading(false);
        return;
      }

      const startParam = dateFrom ? dateFrom.format("YYYY-MM-DD") : undefined;
      const endParam = dateTo ? dateTo.format("YYYY-MM-DD") : undefined;
      const result = await fetchBookingsBySalonId(salonId, {
        pageNumber: 1,
        pageSize: 1000,
        startDate: startParam,
        endDate: endParam
      });
      let apiBookings = [];
      if (result?.items) apiBookings = result.items;
      else if (Array.isArray(result)) apiBookings = result;
      let uiBookings = apiBookings.map((b, idx) => mapApiBookingToUiFormat(b, idx));

      setBookings(uiBookings);
      setHasLoadedOnce(true);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setError(err.message || "Failed to load bookings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e, booking) => {
    setDraggedBooking(booking);
    e.dataTransfer.setData("text/plain", booking.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTarget !== targetId) {
      setDragOverTarget(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDropSlot = async (e, targetHour, artistItem) => {
    e.preventDefault();
    setDragOverTarget(null);
    if (!draggedBooking) return;

    const formattedTime = `${String(targetHour).padStart(2, "0")}:00:00`;
    const formattedRange = formatTimeRange(formattedTime, draggedBooking.totalDuration || 60);
    const bookingIdToAssign = draggedBooking.id || draggedBooking.bookingId;

    const targetArtistName = typeof artistItem === "object" ? artistItem.name : artistItem;
    const staffArtistId = typeof artistItem === "object" ? artistItem.staffArtistId : null;
    const isUnassigned = typeof artistItem === "object" ? artistItem.isUnassigned : (artistItem === "Unassigned");

    // Optimistically update UI
    setBookings((prevBookings) =>
      prevBookings.map((b) => {
        if (b.id === draggedBooking.id) {
          return {
            ...b,
            startTime: formattedTime,
            time: formattedRange,
            artist: targetArtistName || b.artist,
            nailArtistName: targetArtistName || b.nailArtistName,
            artistId: staffArtistId || b.artistId,
            nailArtistId: staffArtistId || b.nailArtistId,
          };
        }
        return b;
      })
    );

    const activeDragged = draggedBooking;
    setDraggedBooking(null);

    // Call API POST /api/Bookings/{id}/receptionist-assign-artist
    if (!isUnassigned && staffArtistId && bookingIdToAssign) {
      try {
        await assignArtistToBookingOld(bookingIdToAssign, staffArtistId);
        toast.success(`Đã phân công Thợ ${targetArtistName} cho lịch hẹn!`, { icon: "✨" });
        loadBookings();
      } catch (err) {
        console.error("Failed to assign artist via drag & drop:", err);
        toast.error(err.message || "Không thể phân công thợ cho lịch hẹn này.");
        loadBookings();
      }
    } else {
      toast.success(
        `Reassigned ${activeDragged.customer}'s booking to ${formatHourLabel(targetHour)} (${targetArtistName || activeDragged.artist})`,
        { icon: "✨" }
      );
    }
  };

  const handleDropDate = (e, targetDate) => {
    e.preventDefault();
    setDragOverTarget(null);
    if (!draggedBooking) return;

    const formattedDate = targetDate.format("YYYY-MM-DD");
    const displayDate = targetDate.format("MMM D, YYYY");

    setBookings((prevBookings) =>
      prevBookings.map((b) => {
        if (b.id === draggedBooking.id) {
          return {
            ...b,
            bookingDate: formattedDate,
            date: displayDate,
          };
        }
        return b;
      })
    );

    toast.success(
      `Rescheduled ${draggedBooking.customer}'s booking to ${displayDate}`,
      { icon: "📅" }
    );
    setDraggedBooking(null);
  };

  // --- Derived State ---
  const quickStats = useMemo(() => {
    const todayStr = dayjs().format("YYYY-MM-DD");
    let todayCount = 0;
    let actionRequiredCount = 0;

    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      if (b.parsedDateStr === todayStr) {
        todayCount++;
      }
      if (b.status === "Pending" || !(b.nailArtistId || b.staffId || b.staffArtistId || b.artistId)) {
        actionRequiredCount++;
      }
    }
    return { todayCount, actionRequiredCount };
  }, [bookings]);

  const summaryStats = useMemo(() => {
    const pending = bookings.filter(b => b.status === "Pending").length;
    const confirmed = bookings.filter(b => b.status === "Confirmed" || b.status === "Approved").length;
    const checkedIn = bookings.filter(b => b.status === "CheckedIn" || b.status === "Checked In").length;
    const completed = bookings.filter(b => b.status === "Completed" || b.status === "ServiceCompleted").length;
    return [
      {
        label: t("manager.dashboard.statusWaiting"),
        value: pending,
        subtext: t("manager.bookings.awaitingConfirm") || "Awaiting confirmation",
        icon: Clock3,
        accentBg: "bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]",
        accentText: "text-[#D97706]",
        badgeBorder: "border-[#FCD34D]",
      },
      {
        label: t("manager.bookings.ready") || "Confirmed",
        value: confirmed,
        subtext: t("manager.bookings.lockedReady") || "Locked & ready",
        icon: CheckCircle2,
        accentBg: "bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5]",
        accentText: "text-[#059669]",
        badgeBorder: "border-[#6EE7B7]",
      },
      {
        label: t("manager.dashboard.statusCalled") || "Checked In",
        value: checkedIn,
        subtext: t("manager.bookings.inSalon") || "In salon",
        icon: UserCheck,
        accentBg: "bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF]",
        accentText: "text-[#4F46E5]",
        badgeBorder: "border-[#A5B4FC]",
      },
      {
        label: t("manager.dashboard.statusDone") || "Completed",
        value: completed,
        subtext: t("manager.bookings.finishedToday") || "Finished today",
        icon: Sparkles,
        accentBg: "bg-gradient-to-br from-[#FFF0F5] to-[#FFE4EE]",
        accentText: "text-[#E84F93]",
        badgeBorder: "border-[#FBCFE8]",
      },
    ];
  }, [bookings, t]);

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let fromStr = null;
    let toStr = null;
    if (dateFrom && dateFrom.isValid()) fromStr = dateFrom.format("YYYY-MM-DD");
    if (dateTo && dateTo.isValid()) toStr = dateTo.format("YYYY-MM-DD");

    return bookings.filter((appointment) => {
      const matchesQuery = normalizedQuery.length === 0 || appointment.searchString.includes(normalizedQuery);

      let matchesDate = true;
      if (fromStr || toStr) {
        const dStr = appointment.parsedDateStr;
        if (dStr) {
          if (fromStr && dStr < fromStr) matchesDate = false;
          if (toStr && dStr > toStr) matchesDate = false;
        } else {
          matchesDate = false;
        }
      }
      return matchesQuery && matchesFilter(appointment.status, activeFilter) && matchesDate;
    });
  }, [activeFilter, query, bookings, dateFrom, dateTo]);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * BOOKING_PAGE_SIZE;
    return filteredAppointments.slice(startIndex, startIndex + BOOKING_PAGE_SIZE);
  }, [filteredAppointments, currentPage]);

  const filteredTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAppointments.length / BOOKING_PAGE_SIZE));
  }, [filteredAppointments.length]);

  const scheduleDateBookings = useMemo(() => {
    const targetDateStr = scheduleDate ? scheduleDate.format("YYYY-MM-DD") : null;
    return bookings.filter(b => b.parsedDateStr && b.parsedDateStr === targetDateStr);
  }, [bookings, scheduleDate]);

  const capacityData = useMemo(() => {
    const periods = [
      { label: "Morning (9 AM - 12 PM)", start: 9, end: 12, maxSlots: 10 },
      { label: "Afternoon (12 PM - 3 PM)", start: 12, end: 15, maxSlots: 10 },
      { label: "Evening (3 PM - 6 PM)", start: 15, end: 18, maxSlots: 10 }
    ];

    return periods.map(period => {
      const bookingsInPeriod = scheduleDateBookings.filter(b => {
        const startHour = parseInt(b.startTime?.split(':')[0] || '0');
        return startHour >= period.start && startHour < period.end;
      });
      const value = Math.min(100, Math.round((bookingsInPeriod.length / period.maxSlots) * 100));
      const tone = value > 80 ? "from-[#F59E0B] to-[#D97706]" : value > 50 ? "from-[#8B5CF6] to-[#7C3AED]" : "from-[#FF75A8] to-[#E84F93]";
      return { ...period, value, tone };
    });
  }, [scheduleDateBookings]);

  const staffWorkloadData = useMemo(() => {
    const staffMap = new Map();

    scheduleDateBookings.forEach(b => {
      const artistName = getArtistDisplayName(b);
      if (artistName !== "Unassigned") {
        const current = staffMap.get(artistName) || { name: artistName, filled: 0, total: 10 };
        staffMap.set(artistName, { ...current, filled: current.filled + 1 });
      }
    });

    const workload = Array.from(staffMap.values());
    if (workload.length === 0) {
      return [
        { name: "Luna Park", filled: 0, total: 10, tone: "from-[#8B5CF6] to-[#6D28D9]" },
        { name: "Aria Nguyen", filled: 0, total: 10, tone: "from-[#FF75A8] to-[#E84F93]" }
      ];
    }

    const tones = [
      "from-[#8B5CF6] to-[#6D28D9]",
      "from-[#FF75A8] to-[#E84F93]",
      "from-[#10B981] to-[#047857]",
      "from-[#F59E0B] to-[#D97706]"
    ];
    return workload.map((staff, i) => ({
      ...staff,
      tone: tones[i % tones.length]
    }));
  }, [scheduleDateBookings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, activeFilter, dateFrom, dateTo]);

  // --- Handlers ---
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === "day") {
      setDateFrom(anchorDate);
      setDateTo(anchorDate);
    } else if (mode === "week") {
      setDateFrom(anchorDate.startOf("week"));
      setDateTo(anchorDate.endOf("week"));
    } else if (mode === "month") {
      setDateFrom(anchorDate.startOf("month"));
      setDateTo(anchorDate.endOf("month"));
    } else if (mode === "table") {
      setDateFrom(anchorDate);
      setDateTo(anchorDate);
    }
  };

  const handleDateFromChange = (newDate) => {
    if (!newDate) {
      setDateFrom(null);
      if (viewMode !== "table") setDateTo(null);
      return;
    }
    setAnchorDate(newDate);
    if (viewMode === "table") {
      setDateFrom(newDate);
    } else if (viewMode === "day") {
      setDateFrom(newDate);
      setDateTo(newDate);
    } else if (viewMode === "week") {
      setDateFrom(newDate.startOf("week"));
      setDateTo(newDate.endOf("week"));
    } else if (viewMode === "month") {
      setDateFrom(newDate.startOf("month"));
      setDateTo(newDate.endOf("month"));
    }
  };
  const handleOpenDrawer = useCallback(async (bookingId) => {
    setIsDrawerOpen(true);
    setIsLoadingDrawer(true);
    try {
      const rawBooking = await fetchBookingById(bookingId);
      const mappedBooking = mapBookingForDrawer(rawBooking);
      setSelectedBookingForDrawer(mappedBooking);
      if (mappedBooking.customerId) {
        try {
          const rawCustomer = await fetchUserById(mappedBooking.customerId);
          setSelectedCustomerForDrawer(rawCustomer);
        } catch (err) {
          console.warn("Failed to load customer details:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load booking:", err);
    } finally {
      setIsLoadingDrawer(false);
    }
  }, []);

  const handleViewBooking = (bookingId) => {
    navigate(roleConfig.getDetailRoute(bookingId));
  };

  const handleResetFilters = () => {
    const today = dayjs();
    setQuery("");
    setActiveFilter("All");
    setDateFrom(today);
    setDateTo(today);
    setAnchorDate(today);
  };

  const handlePageChange = (newPage) => setCurrentPage(newPage);

  const toggleHourExpanded = (hour) => {
    const newExpanded = new Set(expandedHours);
    if (newExpanded.has(hour)) {
      newExpanded.delete(hour);
    } else {
      newExpanded.add(hour);
    }
    setExpandedHours(newExpanded);
  };

  return (
    <section className="flex min-h-[100dvh] flex-col gap-6 bg-[#FAF6F8] p-4 lg:p-8 font-sans">
      {/* Luxury Hero Banner */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="relative overflow-hidden rounded-[28px] border border-[#F3D6E5]/80 bg-gradient-to-r from-[#FFF0F5] via-[#FFF6FA] to-[#FFF0F5] p-6 lg:p-8 shadow-[0_16px_36px_-10px_rgba(234,79,147,0.12)]">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-[#FFD6E8]/40 to-[#E84F93]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-gradient-to-tr from-[#F7E7CE]/40 to-[#C99635]/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4">
                <motion.div
                  className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#F7E7CE] via-[#E5C158] to-[#C99635] text-white shadow-[0_8px_20px_rgba(201,150,53,0.3)] border border-white/60 shrink-0"
                  whileHover={{ scale: 1.06, rotate: 3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12 }}
                >
                  <Calendar size={28} className="drop-shadow-sm text-white" />
                </motion.div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E5C687]/50 bg-gradient-to-r from-[#FFF9EE] to-[#FFF3DC] px-3 py-1 text-[11px] font-bold text-[#9E731A] shadow-xs">
                    <Sparkles size={12} className="text-[#C99635]" />
                    <span>{language === "vi" ? "Cổng Quản Lý Nailify" : "Nailify Salon Manager Portal"} </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-[#2B182B] mt-1.5 tracking-tight">
                    {language === "vi" ? "Lịch trình tiệm nails" : "Salon Bookings"}
                  </h1>
                  <p className="mt-1 text-xs lg:text-sm text-[#9E8497] font-medium leading-relaxed">
                    {language === "vi" ? "Tổng quan và quản lý các hành động cho tất cả các đặt lịch của khách hàng." : "Overview and action manager for all customer bookings."}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Hero Highlights */}
            <div className="grid grid-cols-3 gap-2.5 w-full lg:w-[380px]">
              <div className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-2xs backdrop-blur-md text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">{t("manager.dashboard.today")}</p>
                <p className="mt-0.5 text-xl font-bold text-[#2B182B]">
                  {quickStats.todayCount}
                </p>
                <p className="text-[9px] text-[#E84F93] font-semibold">{t("manager.dashboard.appointmentsLeft") || "Appointments"}</p>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-2xs backdrop-blur-md text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">{t("manager.common.view")}</p>
                <p className="mt-0.5 text-xl font-bold text-[#2B182B]">{filteredAppointments.length}</p>
                <p className="text-[9px] text-[#4F46E5] font-semibold">{t("manager.payments.services") || "Bookings"}</p>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-2xs backdrop-blur-md text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">{t("manager.common.actions")}</p>
                <p className="mt-0.5 text-xl font-bold text-[#D97706]">
                  {quickStats.actionRequiredCount}
                </p>
                <p className="text-[9px] text-[#D97706] font-semibold">{t("manager.dashboard.statusWaiting")}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {
        flashMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-3 text-sm font-semibold text-[#047857] shadow-sm flex items-center gap-2">
            <CheckCircle2 size={18} />
            {flashMessage}
          </motion.div>
        )
      }

      {
        error && (
          <Alert message="Error Loading Data" description={error} type="error" showIcon className="rounded-2xl border-rose-200" />
        )
      }

      {
        isLoading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <Spin size="large" tip="Loading booking list..." />
          </div>
        ) : hasLoadedOnce ? (
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_320px]">
            {/* Main Content Area */}
            <div className="space-y-6">
              {/* KPI Summary Stats Grid */}
              <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryStats.map((stat) => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 350, damping: 15 }}
                  >
                    <div className="relative overflow-hidden rounded-[22px] border border-[#F3E2EC] bg-white p-4 shadow-[0_10px_28px_-6px_rgba(219,70,117,0.06)] hover:border-[#E8C5D8] transition-all">
                      <div className="flex items-center justify-between">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.accentBg} ${stat.accentText} border ${stat.badgeBorder} shadow-xs`}>
                          <stat.icon size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497] px-2 py-0.5 rounded-full bg-[#FAF0F5]">
                          {stat.subtext}
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold text-[#2B182B] tracking-tight">{stat.value}</p>
                        <p className="text-xs font-semibold text-[#9E8497] mt-0.5">{stat.label}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Booking Board Card */}
              <motion.div variants={fadeInUp}>
                <PremiumCard className="p-0 overflow-hidden border-[#F3E2EC]">
                  {/* Header, View Switcher & Filter Controls */}
                  <div className="border-b border-[#F3E2EC] bg-gradient-to-b from-[#FFF7FA] to-white p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <SectionHeading
                        title={t("manager.bookings.title")}
                        subtitle={t("manager.bookings.desc")}
                        icon={Filter}
                      />

                    </div>
                    <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-2 lg:pb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {/* Status Dropdown */}
                      <div className="shrink-0 flex items-center gap-2.5 rounded-2xl border border-[#F3D6E5] bg-gradient-to-r from-[#FFF0F5] to-[#FFF9FB] px-3.5 py-1.5 shadow-[0_4px_12px_rgba(219,70,117,0.06)] transition-all duration-300 hover:border-[#E84F93]/50 hover:shadow-[0_4px_16px_rgba(219,70,117,0.12)] cursor-pointer group">
                        <div className="flex items-center gap-1.5 border-r border-[#F3D6E5] pr-3 py-0.5">
                          <Filter size={14} className="text-[#E84F93]" />
                          <span className="text-[11px] font-bold text-[#9E8497] uppercase tracking-wider group-hover:text-[#E84F93] transition-colors">{t("manager.common.status")}</span>
                        </div>
                        <div className="relative">
                          <select
                            value={activeFilter}
                            onChange={(e) => setActiveFilter(e.target.value)}
                            className="appearance-none text-xs font-bold text-[#2B182B] bg-transparent outline-none cursor-pointer pr-6 pl-1 w-full hover:text-[#E84F93] transition-colors focus:text-[#E84F93]"
                          >
                            {appointmentFilters.map((filter) => {
                              const count = filter.value === "All"
                                ? bookings.length
                                : bookings.filter(b => matchesFilter(b.status, filter.value)).length;
                              const displayLabel = filter.value === "All" ? t("manager.common.all") : getBookingStatusLabel(filter.value, t);
                              return (
                                <option key={filter.value} value={filter.value} className="text-sm font-medium text-[#2B182B]">
                                  {displayLabel} ({count})
                                </option>
                              );
                            })}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-[#9E8497] group-hover:text-[#E84F93] transition-colors">
                            <ChevronDown size={14} />
                          </div>
                        </div>
                      </div>

                      {/* View Switcher Controls */}
                      <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-[#F3D6E5] bg-[#FFF0F5] p-1 shadow-2xs">
                        {[
                          { mode: "table", label: t("manager.common.table") || "Table", icon: TableIcon },
                          { mode: "day", label: t("adminDashboard.day"), icon: LayoutGrid },
                          { mode: "week", label: t("adminDashboard.week"), icon: CalendarDays },
                          { mode: "month", label: t("adminDashboard.month"), icon: GridIcon },
                        ].map((btn) => (
                          <button
                            key={btn.mode}
                            type="button"
                            onClick={() => handleViewModeChange(btn.mode)}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${viewMode === btn.mode
                              ? "bg-gradient-to-r from-[#E84F93] to-[#F43F5E] text-white shadow-md"
                              : "text-[#9E8497] hover:bg-white hover:text-[#2B182B]"
                              }`}
                          >
                            <btn.icon size={13} />
                            <span>{btn.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">

                      {/* Search & Date Controls */}
                      <div className="grid gap-3 pt-1 lg:grid-cols-[minmax(0,1fr)_150px_150px_auto]">
                        <div className="relative">
                          <span className="mb-1.5 block text-[11px] font-bold text-[#9E8497] uppercase tracking-wider">{t("manager.common.search")}</span>
                          <div className="relative">
                            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E8497]" />
                            <input
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder={t("manager.bookings.searchPlaceholder")}
                              className="h-11 w-full rounded-2xl border border-[#F3D7E4] bg-white pl-10 pr-4 text-xs font-medium text-[#2B182B] outline-none transition-all duration-200 placeholder:text-[#C8B0BF] hover:border-[#F0B7CF] focus:border-[#E84F93] focus:ring-4 focus:ring-[#E84F93]/10 shadow-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <span className="mb-1.5 block text-[11px] font-bold text-[#9E8497] uppercase tracking-wider">{t("manager.bookings.dateFrom")}</span>
                          <DatePicker
                            value={dateFrom}
                            onChange={handleDateFromChange}
                            placeholder={t("manager.bookings.dateFrom")}
                            format="DD/MM/YYYY"
                            className="h-11 w-full rounded-2xl border border-[#F3D7E4] bg-white px-3 text-xs text-[#2B182B] outline-none transition-all duration-200 hover:border-[#F0B7CF] focus:border-[#E84F93]"
                            suffixIcon={<Calendar size={15} className="text-[#9E8497]" />}
                          />
                        </div>
                        <div>
                          <span className="mb-1.5 block text-[11px] font-bold text-[#9E8497] uppercase tracking-wider">{t("manager.bookings.dateTo")}</span>
                          <DatePicker
                            value={dateTo}
                            onChange={(d) => setDateTo(d)}
                            disabled={viewMode !== "table"}
                            placeholder={t("manager.bookings.dateTo")}
                            format="DD/MM/YYYY"
                            className="h-11 w-full rounded-2xl border border-[#F3D7E4] bg-white px-3 text-xs text-[#2B182B] outline-none transition-all duration-200 hover:border-[#F0B7CF] focus:border-[#E84F93]"
                            suffixIcon={<Calendar size={15} className="text-[#9E8497]" />}
                          />
                        </div>

                        <div className="flex items-end">
                          <motion.button
                            whileHover={query.trim() || dateFrom || dateTo || activeFilter !== "All" ? { scale: 1.02 } : {}}
                            whileTap={query.trim() || dateFrom || dateTo || activeFilter !== "All" ? { scale: 0.98 } : {}}
                            onClick={handleResetFilters}
                            disabled={!query.trim() && !dateFrom && !dateTo && activeFilter === "All"}
                            className={`h-11 rounded-2xl border px-4 text-xs font-bold transition-all duration-200 ${query.trim() || dateFrom || dateTo || activeFilter !== "All"
                              ? "border-[#E84F93] bg-white text-[#E84F93] hover:bg-[#FFF5FA] shadow-xs"
                              : "border-[#F5E8EF] bg-[#FAFAFA] text-[#D6B9C8] cursor-not-allowed"
                              }`}
                          >
                            {t("manager.common.reset")}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main View Renderer (Table / Day / Week / Month) */}
                  <div ref={tableContainerRef} className="overflow-x-auto bg-white">
                    {isLoading ? (
                      <SkeletonLoader />
                    ) : filteredAppointments.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FFF0F8] text-[#E84F93] mb-3 shadow-inner">
                          <Search size={28} />
                        </div>
                        <p className="text-base font-bold text-[#2B182B]">{t("manager.bookings.noBookings") || "No bookings found"}</p>
                        <p className="mt-1 text-xs text-[#9E8497] max-w-xs leading-relaxed">
                          {t("manager.bookings.noBookingsDesc") || "Try adjusting your search terms or filter selection"}
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleResetFilters}
                          className="mt-4 rounded-full bg-[#E84F93] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#D93D82]"
                        >
                          {t("manager.common.reset")}
                        </motion.button>
                      </motion.div>
                    ) : viewMode === "table" ? (
                      /* --- 1. TABLE BOARD VIEW (WITH TRY-ON NAIL THUMBNAILS & TOOLTIPS) --- */
                      <table className="w-full min-w-[700px] table-fixed text-left">
                        <colgroup>
                          <col className="w-[140px]" />
                          <col className="w-[170px]" />
                          <col className="w-[150px]" />
                          <col className="w-[110px]" />
                          <col className="w-[130px]" />
                        </colgroup>
                        <thead>
                          <tr className="border-b border-[#F3E2EC] bg-[#FFF5F8] text-[11px] font-bold uppercase tracking-wider text-[#9E8497]">
                            <th className="px-3.5 py-3.5 text-left">{t("manager.bookings.time")}</th>
                            <th className="px-3.5 py-3.5 text-left">{t("manager.bookings.customer")}</th>
                            {/* <th className="px-3.5 py-3.5 text-left">{t("manager.bookings.serviceDesign") || "Service & Nail Design"}</th> */}
                            <th className="px-3.5 py-3.5 text-left">{t("manager.bookings.artist")}</th>
                            <th className="px-3.5 py-3.5 text-left">{t("manager.common.status")}</th>
                            <th className="px-3.5 py-3.5 text-center">{t("manager.common.actions")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {paginatedAppointments.map((row) => (
                              <motion.tr
                                key={row.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="group relative cursor-pointer border-b border-[#F7E7EE] transition-colors duration-200 hover:bg-[#FFF9FB] last:border-b-0"
                                onClick={() => handleOpenDrawer(row.id)}
                              >
                                <td className="px-4 py-3.5 align-middle">
                                  <p className="text-xs font-bold text-[#2B182B] truncate" title={row.time}>{row.time}</p>
                                  <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#9E8497]">
                                    <Clock3 size={11} className="text-[#E84F93]" />
                                    <span>{row.duration}</span>
                                  </div>
                                </td>

                                <td className="px-4 py-3.5 align-middle">
                                  <div className="flex min-w-0 items-center gap-2.5">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF9EBF] to-[#E84F93] text-xs font-bold text-white shadow-sm border border-white">
                                      {row.initials}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-bold text-[#2B182B] group-hover:text-[#E84F93] transition-colors">
                                        {row.customer}
                                      </p>
                                      {/* <p className="mt-0.5 truncate text-[11px] text-[#9E8497] font-medium flex items-center gap-1">
                                        <Phone size={10} className="shrink-0 text-[#C8B0BF]" />
                                        {row.phone || "No phone"}
                                      </p> */}
                                    </div>
                                  </div>
                                </td>

                                {/* Service & Try-On Nail Design Thumbnail Preview */}
                                {/* <td className="px-4 py-3.5 align-middle">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {row.thumbnailUrl && (
                                      <Tooltip title={t("manager.bookings.zoomThumbnail") || "Click to enlarge Nail Design"}>
                                        <div
                                          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#F3D6E5] bg-[#FFF0F5] cursor-pointer hover:border-[#E84F93] transition group/img"
                                          onClick={(e) => { e.stopPropagation(); setActiveImageModalUrl(row.thumbnailUrl); }}
                                        >
                                          <img src={row.thumbnailUrl} alt="Try-On Design" className="h-full w-full object-cover group-hover/img:scale-110 transition duration-200" />
                                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition">
                                            <Maximize2 size={12} />
                                          </div>
                                        </div>
                                      </Tooltip>
                                    )}
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-bold text-[#2B182B]">{row.service}</p>
                                      {row.totalPrice && (
                                        <p className="mt-0.5 text-[11px] font-bold text-[#E84F93]">
                                          {formatVND(row.totalPrice)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td> */}

                                <td className="px-4 py-3.5 align-middle">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[9px] font-bold text-white shadow-xs ${row.artist === "Unassigned" ? "bg-[#D97706]" : "bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]"}`}>
                                      {row.artist === "Unassigned" ? "!" : row.artist.split(" ").map(p => p[0]).join("")}
                                    </div>
                                    <div className="min-w-0">
                                      <p className={`truncate text-xs font-semibold ${row.artist === "Unassigned" ? "text-[#D97706] italic" : "text-[#2B182B]"}`}>
                                        {row.artist === "Unassigned" ? t("manager.bookings.unassigned") : row.artist}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-3 py-3.5 align-middle">
                                  <StatusPill status={row.status} />
                                </td>

                                <td className="px-3 py-3.5 align-middle text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Tooltip title={t("manager.common.view")}>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleViewBooking(row.id)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF0F8] text-[#E84F93] hover:bg-[#E84F93] hover:text-white transition-all shadow-2xs"
                                      >
                                        <Eye size={14} />
                                      </motion.button>
                                    </Tooltip>

                                    {!(
                                      (row.nailArtistId || row.staffId || row.staffArtistId || row.artistId) &&
                                      (row.status === "CheckedIn" || row.status === "Checked In")
                                    ) && (!isFinalStatus(row.status) || row.status === "Approved") && (
                                        <Tooltip title={t("manager.bookings.assignArtistTitle") || "Assign staff artist"}>
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => { setSelectedBookingForAssign(row); setIsAssignArtistModalOpen(true); }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white transition-all shadow-2xs"
                                          >
                                            <UserCheck size={14} />
                                          </motion.button>
                                        </Tooltip>
                                      )}

                                    {!isFinalStatus(row.status) && !(row.status === "CheckedIn" || row.status === "Checked In" || row.status === "InProgress" || row.status === "In Progress") && (
                                      <>
                                        <Tooltip title={t("manager.bookings.confirmBooking") || "Confirm booking"}>
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => { setSelectedBookingForAction(row); setIsConfirmModalOpen(true); }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#059669] hover:bg-[#059669] hover:text-white transition-all shadow-2xs"
                                          >
                                            <CheckCircle2 size={14} />
                                          </motion.button>
                                        </Tooltip>

                                        <Tooltip title={t("manager.bookings.cancelBooking") || "Cancel booking"}>
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => { setSelectedBookingForAction(row); setIsCancelModalOpen(true); }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#E11D48] hover:bg-[#E11D48] hover:text-white transition-all shadow-2xs"
                                          >
                                            <XCircle size={14} />
                                          </motion.button>
                                        </Tooltip>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    ) : viewMode === "day" ? (
                      /* --- 2. DAY VIEW SCHEDULER (ARTISTS x HOURS MATRIX WITH DRAG & DROP) --- */
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between bg-[#FFF5F8] p-3 rounded-2xl border border-[#F3D6E5]/60 text-xs">
                          <span className="font-bold text-[#E84F93] flex items-center gap-1.5">
                            <GripVertical size={16} /> {t("manager.bookings.dragDropTip") || "Drag & drop booking cards onto another hour or artist column to reschedule!"}
                          </span>
                          <span className="font-bold text-[#2B182B]">
                            {dateFrom ? dateFrom.format("dddd, MMM D, YYYY") : dayjs().format("dddd, MMM D, YYYY")}
                          </span>
                        </div>

                        <div className="overflow-x-auto border border-[#F3E2EC] rounded-2xl scrollbar-thin scrollbar-thumb-[#E84F93]/20">
                          <table className="w-full border-collapse min-w-full">
                            <thead>
                              <tr className="bg-[#FFF5F8] text-xs font-bold text-[#2B182B] border-b border-[#F3E2EC]">
                                <th className="w-24 min-w-[90px] p-3 text-center border-r border-[#F3E2EC] bg-[#FFF5F8] sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                  Time
                                </th>
                                {dayViewStaffList.map((artistItem) => {
                                  const isUnassigned = artistItem.isUnassigned;
                                  const displayName = artistItem.name;
                                  const initials = isUnassigned
                                    ? "!"
                                    : displayName.split(" ").filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase();

                                  return (
                                    <th key={artistItem.id || displayName} className="min-w-[175px] p-3 text-center border-r border-[#F3E2EC] last:border-r-0">
                                      <div className="flex items-center justify-center gap-1.5 min-w-0">
                                        <div className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[10px] text-white font-bold ${isUnassigned ? "bg-[#D97706]" : "bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]"}`}>
                                          {initials}
                                        </div>
                                        <span className="truncate" title={displayName}>{displayName}</span>
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hour) => (
                                <tr key={hour} className="border-b border-[#F7E7EE] last:border-b-0 text-xs">
                                  <td className="w-24 min-w-[90px] p-3 font-bold text-[#9E8497] bg-[#FFF9FB] text-center border-r border-[#F3E2EC] sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                    {formatHourLabel(hour)}
                                  </td>
                                  {dayViewStaffList.map((artistItem) => {
                                    const cellTargetId = `day-${hour}-${artistItem.id || artistItem.name}`;
                                    const isOver = dragOverTarget === cellTargetId;
                                    const slotBookings = filteredAppointments.filter((b) => {
                                      const bHour = parseInt(b.startTime?.split(":")[0] || "0");
                                      if (bHour !== hour) return false;
                                      if (artistItem.isUnassigned) {
                                        return !b.artistId && (!b.nailArtistName || b.nailArtistName === "Chưa chỉ định" || b.artist === "Unassigned");
                                      }
                                      return (
                                        (b.artistId && String(b.artistId).toLowerCase() === String(artistItem.staffArtistId).toLowerCase()) ||
                                        (b.nailArtistName && b.nailArtistName.toLowerCase() === artistItem.name.toLowerCase()) ||
                                        (b.artist && b.artist.toLowerCase() === artistItem.name.toLowerCase())
                                      );
                                    });

                                    return (
                                      <td
                                        key={cellTargetId}
                                        onDragOver={(e) => handleDragOver(e, cellTargetId)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDropSlot(e, hour, artistItem)}
                                        className={`min-w-[175px] p-2 border-r border-[#F3E2EC] last:border-r-0 align-top transition-all min-h-[70px] ${isOver
                                          ? "bg-[#FFF0F5] border-2 border-dashed border-[#E84F93] shadow-inner"
                                          : "hover:bg-[#FFFDFE]"
                                          }`}
                                      >
                                        <div className="space-y-2 min-h-[50px] w-full">
                                          {slotBookings.map((b) => (
                                            <div
                                              key={b.id}
                                              draggable
                                              onDragStart={(e) => handleDragStart(e, b)}
                                              onClick={() => handleOpenDrawer(b.id)}
                                              className={`group relative rounded-xl border p-2.5 cursor-grab active:cursor-grabbing shadow-2xs hover:shadow-md transition-all w-full overflow-hidden ${getCalendarCardStyle(b.status)}`}
                                            >
                                              <div className="flex items-center justify-between mb-1 min-w-0">
                                                <span className="font-bold text-xs truncate" title={b.customer}>{b.customer}</span>
                                                <GripVertical size={14} className="opacity-40 group-hover:opacity-100 transition shrink-0 ml-1" />
                                              </div>
                                              <p className="text-[10px] opacity-80 truncate mb-1" title={b.service}>{b.service}</p>
                                              <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[9px] font-bold">
                                                <span className="shrink-0">{b.time}</span>
                                                <StatusPill status={b.status} />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : viewMode === "week" ? (
                      /* --- 3. WEEK VIEW CALENDAR (7 DAYS GRID WITH DRAG & DROP) --- */
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between bg-[#FFF5F8] p-3 rounded-2xl border border-[#F3D6E5]/60 text-xs">
                          <span className="font-bold text-[#E84F93] flex items-center gap-1.5">
                            <GripVertical size={16} /> Drag & drop booking cards to another day to reschedule!
                          </span>
                          <span className="font-bold text-[#2B182B]">
                            Week of {scheduleDate.startOf("week").format("MMM D")} - {scheduleDate.endOf("week").format("MMM D, YYYY")}
                          </span>
                        </div>

                        <div className="overflow-x-auto border border-[#F3E2EC] rounded-2xl p-2 scrollbar-thin scrollbar-thumb-[#E84F93]/20">
                          <div className="grid grid-cols-7 gap-2 min-w-[950px]">
                            {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                              const currentDay = (dateFrom || dayjs()).startOf("week").add(dayOffset, "day");
                              const dayKey = currentDay.format("YYYY-MM-DD");
                              const isOver = dragOverTarget === `week-${dayKey}`;
                              const dayBookings = filteredAppointments.filter((b) => {
                                const bDate = dayjs(b.bookingDate || b.createdAt);
                                return bDate.isValid() && bDate.isSame(currentDay, "day");
                              });

                              return (
                                <div
                                  key={dayKey}
                                  onDragOver={(e) => handleDragOver(e, `week-${dayKey}`)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDropDate(e, currentDay)}
                                  className={`rounded-2xl border border-[#F3E2EC] p-2.5 min-h-[360px] flex flex-col transition-all min-w-[130px] ${isOver
                                    ? "bg-[#FFF0F5] border-2 border-dashed border-[#E84F93] shadow-md"
                                    : currentDay.isSame(dayjs(), "day")
                                      ? "bg-gradient-to-b from-[#FFF0F5] to-white border-[#E84F93]/40"
                                      : "bg-white"
                                    }`}
                                >
                                  <div className="text-center border-b border-[#F3E2EC] pb-2 mb-2">
                                    <p className="text-[10px] font-bold text-[#9E8497] uppercase">{currentDay.format("ddd")}</p>
                                    <p className={`text-sm font-bold ${currentDay.isSame(dayjs(), "day") ? "text-[#E84F93]" : "text-[#2B182B]"}`}>
                                      {currentDay.format("D")}
                                    </p>
                                  </div>

                                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[320px] pr-1">
                                    {dayBookings.length === 0 ? (
                                      <p className="text-[10px] text-[#C8B0BF] italic text-center py-4">No bookings</p>
                                    ) : (
                                      dayBookings.map((b) => (
                                        <div
                                          key={b.id}
                                          draggable
                                          onDragStart={(e) => handleDragStart(e, b)}
                                          onClick={() => handleOpenDrawer(b.id)}
                                          className={`group relative rounded-xl border p-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all w-full overflow-hidden ${getCalendarCardStyle(b.status)}`}
                                        >
                                          <div className="flex items-center justify-between min-w-0">
                                            <p className="text-xs font-bold truncate" title={b.customer}>{b.customer}</p>
                                            <GripVertical size={12} className="opacity-40 group-hover:opacity-100 shrink-0 ml-1" />
                                          </div>
                                          <p className="text-[10px] opacity-80 truncate mt-0.5" title={b.service}>{b.service}</p>
                                          <div className="mt-1.5 flex flex-col gap-1 text-[9px] font-bold min-w-0">
                                            <span className="text-[#86687D] truncate" title={b.time}>{b.time}</span>
                                            <div className="self-start max-w-full overflow-hidden">
                                              <StatusPill status={b.status} compact />
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* --- 4. MONTH VIEW CALENDAR GRID (35 DAYS WITH DRAG & DROP) --- */
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between bg-[#FFF5F8] p-3 rounded-2xl border border-[#F3D6E5]/60 text-xs">
                          <span className="font-bold text-[#E84F93] flex items-center gap-1.5">
                            <GripVertical size={16} /> Drag & drop booking cards to another calendar date cell!
                          </span>
                          <span className="font-bold text-[#2B182B]">
                            {(dateFrom || dayjs()).format("MMMM YYYY")}
                          </span>
                        </div>

                        <div className="grid grid-cols-7 gap-1.5">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                            <div key={dayName} className="text-center text-[11px] font-bold text-[#9E8497] uppercase py-2 bg-[#FFF5F8] rounded-xl">
                              {dayName}
                            </div>
                          ))}

                          {(() => {
                            const baseMonth = dateFrom || dayjs();
                            const startOfMonth = baseMonth.startOf("month");
                            const startDayOfWeek = startOfMonth.day();
                            const startDate = startOfMonth.subtract(startDayOfWeek, "day");

                            const monthDays = [];
                            for (let i = 0; i < 35; i++) {
                              monthDays.push(startDate.add(i, "day"));
                            }

                            return monthDays.map((cellDay) => {
                              const dateKey = cellDay.format("YYYY-MM-DD");
                              const isOver = dragOverTarget === `month-${dateKey}`;
                              const isCurrentMonth = cellDay.isSame(baseMonth, "month");
                              const isToday = cellDay.isSame(dayjs(), "day");

                              const dayBookings = filteredAppointments.filter((b) => {
                                const bDate = dayjs(b.bookingDate || b.createdAt);
                                return bDate.isValid() && bDate.isSame(cellDay, "day");
                              });

                              return (
                                <div
                                  key={dateKey}
                                  onDragOver={(e) => handleDragOver(e, `month-${dateKey}`)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDropDate(e, cellDay)}
                                  className={`rounded-xl border border-[#F3E2EC] p-2 min-h-[95px] flex flex-col justify-between transition-all ${isOver
                                    ? "bg-[#FFF0F5] border-2 border-dashed border-[#E84F93] shadow-md"
                                    : !isCurrentMonth
                                      ? "bg-[#FAFAFA] opacity-50"
                                      : isToday
                                        ? "bg-gradient-to-b from-[#FFF0F5] to-white border-[#E84F93]"
                                        : "bg-white hover:bg-[#FFF9FB]"
                                    }`}
                                >
                                  <div
                                    className="flex items-center justify-between text-[11px] cursor-pointer hover:opacity-80 transition"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (dayBookings.length > 0) {
                                        setSelectedDateForModal(cellDay);
                                        setIsDayBookingsModalOpen(true);
                                      }
                                    }}
                                  >
                                    <span className={`font-bold ${isToday ? "text-[#E84F93]" : "text-[#2B182B]"}`}>
                                      {cellDay.format("D")}
                                    </span>
                                    {dayBookings.length > 0 && (
                                      <span className="rounded-full bg-[#FFF0F6] px-1.5 py-0.5 text-[9px] font-bold text-[#E84F93] hover:bg-[#FCE2EE] transition">
                                        {dayBookings.length}
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-1 my-1 overflow-hidden">
                                    {dayBookings.slice(0, 2).map((b) => (
                                      <div
                                        key={b.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, b)}
                                        onClick={() => handleOpenDrawer(b.id)}
                                        className={`rounded-lg border px-1.5 py-1 text-[9px] font-bold cursor-grab active:cursor-grabbing truncate ${getCalendarCardStyle(b.status)}`}
                                      >
                                        {b.customer} ({b.time.split("-")[0].trim()})
                                      </div>
                                    ))}
                                    {dayBookings.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedDateForModal(cellDay);
                                          setIsDayBookingsModalOpen(true);
                                        }}
                                        className="w-full text-[9px] font-bold text-[#E84F93] hover:text-[#D93B7D] text-center py-0.5 rounded bg-[#FFF0F6] hover:bg-[#FCE2EE] transition cursor-pointer"
                                      >
                                        +{dayBookings.length - 2} more
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {viewMode === "table" && paginatedAppointments.length > 0 && (
                    <div className="flex justify-end p-4 border-t border-[#F3E2EC] bg-gradient-to-b from-white to-[#FFF9FB]">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={filteredTotalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </PremiumCard>
              </motion.div>
            </div>

            {/* Right Operations Column */}
            <motion.div variants={fadeInUp} className="space-y-5 lg:sticky lg:top-8 lg:self-start">
              {/* Today Capacity Progress */}
              <PremiumCard className="p-5 border-[#F3E2EC]">
                <SectionHeading title="Capacity Overview" subtitle="Slot distribution by shift" icon={TrendingUp} />
                <div className="mt-4 space-y-4">
                  {capacityData.map((period, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs text-[#9E8497]">
                        <span className="font-bold text-[#2B182B]">{period.label}</span>
                        <span className="font-bold text-[#E84F93]">{period.value}%</span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#FAF0F5]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${period.value}%` }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full bg-gradient-to-r ${period.tone}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </PremiumCard>

              {/* Today Schedule Timeline */}
              <PremiumCard className="p-5 border-[#F3E2EC]">
                <SectionHeading title="Today's Schedule" subtitle="Time slots timeline" icon={Clock3} />

                <div className="mt-3 flex items-center justify-between rounded-xl bg-[#FFF5F8] p-1 border border-[#F3D6E5]/60">
                  {timeFilters.map((tf) => (
                    <button
                      key={tf.value}
                      onClick={() => setSelectedTimeFilter(tf.value)}
                      className={`flex-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${selectedTimeFilter === tf.value
                        ? "bg-white text-[#E84F93] shadow-xs"
                        : "text-[#9E8497] hover:text-[#2B182B]"
                        }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#9E8497] border-b border-[#F3E2EC] pb-2">
                    <span className="font-bold">Date</span>
                    <span className="font-bold text-[#2B182B]">{scheduleDate.format("MMM D, YYYY")}</span>
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {(() => {
                      const currentFilter = timeFilters.find((tf) => tf.value === selectedTimeFilter) || timeFilters[0];
                      const filteredBookings = scheduleDateBookings.filter(b => {
                        const startHour = parseInt(b.startTime?.split(':')[0] || '0');
                        return startHour >= currentFilter.startHour && startHour < currentFilter.endHour;
                      });

                      const bookingsByHour = {};
                      filteredBookings.forEach(b => {
                        const startHour = parseInt(b.startTime?.split(':')[0] || '0');
                        if (!bookingsByHour[startHour]) bookingsByHour[startHour] = [];
                        bookingsByHour[startHour].push(b);
                      });

                      const hours = [];
                      for (let h = currentFilter.startHour; h < currentFilter.endHour; h++) {
                        hours.push(h);
                      }

                      return hours.map((hour) => {
                        const bookingsAtHour = bookingsByHour[hour] || [];

                        if (bookingsAtHour.length === 0) {
                          return (
                            <div key={hour} className="flex items-start gap-2.5">
                              <div className="mt-1 h-2 w-2 rounded-full bg-[#E5CCD8]" />
                              <div className="min-w-[65px] text-[11px] font-bold text-[#9E8497]">
                                {formatHourLabel(hour)}
                              </div>
                              <div className="flex-1 border-l border-dashed border-[#F3D6E5] pl-3 py-1">
                                <p className="text-[11px] text-[#C8B0BF] italic">No bookings</p>
                              </div>
                            </div>
                          );
                        }

                        const isExpanded = expandedHours.has(hour);
                        const MAX_BOOKINGS = 2;
                        const hasMoreBookings = bookingsAtHour.length > MAX_BOOKINGS;
                        const visibleBookings = isExpanded ? bookingsAtHour : bookingsAtHour.slice(0, MAX_BOOKINGS);

                        return (
                          <div key={hour} className="flex items-start gap-2.5">
                            <div className="mt-1 h-2 w-2 rounded-full bg-[#E84F93]" />
                            <div className="min-w-[65px] text-[11px] font-bold text-[#2B182B]">
                              {formatHourLabel(hour)}
                            </div>
                            <div className="flex-1 border-l-2 border-[#E84F93]/30 pl-3 space-y-2">
                              {visibleBookings.map((b, bIdx) => {
                                const palette = scheduleColorPalette[bIdx % scheduleColorPalette.length];
                                const artistName = getArtistDisplayName(b);
                                return (
                                  <div
                                    key={b.id}
                                    className={`rounded-xl border ${palette.tone} p-2.5 cursor-pointer hover:shadow-sm transition-all`}
                                    onClick={() => handleOpenDrawer(b.id)}
                                  >
                                    <p className="text-xs font-bold truncate">{b.customerName || b.customer}</p>
                                    <div className="mt-1 flex items-center justify-between text-[10px] font-bold">
                                      <span>{artistName === "Unassigned" ? "Unassigned" : artistName}</span>
                                      <span>{formatDuration(b.totalDuration || 60)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                              {hasMoreBookings && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleHourExpanded(hour); }}
                                  className="w-full text-center rounded-lg border border-[#F3D6E5] bg-[#FFF0F5] py-1 text-[10px] font-bold text-[#E84F93] hover:bg-[#FFE4EE]"
                                >
                                  {isExpanded ? "Show less" : `+${bookingsAtHour.length - MAX_BOOKINGS} more bookings`}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </PremiumCard>

              {/* Staff Workload */}
              <PremiumCard className="p-5 border-[#F3E2EC]">
                <SectionHeading title="Staff Workload" subtitle="Bookings per nail tech" icon={UserCheck} />
                <div className="mt-4 space-y-3.5">
                  {staffWorkloadData.map((staff, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${staff.tone} text-xs font-bold text-white shadow-xs`}>
                        {staff.name.split(" ").map((p) => p[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <p className="font-bold text-[#2B182B] truncate">{staff.name}</p>
                          <p className="font-bold text-[#E84F93]">
                            {staff.filled}/{staff.total} slots
                          </p>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#FAF0F5]">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${staff.tone}`}
                            style={{ width: `${(staff.filled / staff.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </PremiumCard>
            </motion.div>
          </motion.div>
        ) : null
      }

      {/* --- Image Zoom Modal --- */}
      <Modal
        open={!!activeImageModalUrl}
        onCancel={() => setActiveImageModalUrl(null)}
        footer={null}
        closable={false}
        centered
        width={480}
        styles={{ content: { padding: 0, borderRadius: 24, overflow: "hidden" } }}
      >
        <div className="bg-white p-6 text-center">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-bold text-[#2B182B]">Customer Selected Nail Design</p>
            <button type="button" onClick={() => setActiveImageModalUrl(null)} className="text-[#9E8497] hover:text-[#E84F93]">
              <X size={18} />
            </button>
          </div>
          {activeImageModalUrl && (
            <img src={activeImageModalUrl} alt="Try-On Design" className="w-[400px] max-h-auto mx-auto rounded-xl shadow-md border border-[#F3E2EC]" />
          )}
        </div>
      </Modal>

      {/* --- Modals --- */}
      {
        selectedBookingForAssign && (
          <AssignArtistModal
            open={isAssignArtistModalOpen}
            onClose={() => { setIsAssignArtistModalOpen(false); setSelectedBookingForAssign(null); }}
            bookingId={String(selectedBookingForAssign.id)}
            salonId={selectedBookingForAssign.salonId ? String(selectedBookingForAssign.salonId) : (getSalonId() || "")}
            booking={selectedBookingForAssign}
            onSuccess={() => loadBookings()}
          />
        )
      }

      <ConfirmBookingModal
        open={isConfirmModalOpen}
        onClose={() => { setIsConfirmModalOpen(false); setSelectedBookingForAction(null); }}
        bookingId={selectedBookingForAction?.id ? String(selectedBookingForAction.id) : ""}
        booking={selectedBookingForAction || {}}
        onSuccess={() => loadBookings()}
      />

      <CancelBookingModal
        open={isCancelModalOpen}
        onClose={() => { setIsCancelModalOpen(false); setSelectedBookingForAction(null); }}
        bookingId={selectedBookingForAction?.id ? String(selectedBookingForAction.id) : ""}
        booking={selectedBookingForAction || {}}
        onSuccess={() => loadBookings()}
      />

      <RejectBookingModal
        open={isRejectModalOpen}
        onClose={() => { setIsRejectModalOpen(false); setSelectedBookingForAction(null); }}
        bookingId={selectedBookingForAction?.id ? String(selectedBookingForAction.id) : ""}
        booking={selectedBookingForAction || {}}
        onSuccess={() => loadBookings()}
      />

      {/* Quick View Drawer */}
      <Drawer
        title={null}
        open={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedBookingForDrawer(null); }}
        width={460}
        styles={{
          body: { padding: 0 },
          content: { background: "#FAF6F8" }
        }}
        placement="right"
        mask={true}
        maskClosable={true}
        destroyOnClose
        closable={false}
      >
        {isLoadingDrawer ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Spin size="large" tip="Loading booking details..." />
          </div>
        ) : selectedBookingForDrawer ? (
          <div className="bg-[#FAF6F8] h-full flex flex-col font-sans">
            {/* Header Card */}
            <div className="sticky top-0 z-10 bg-gradient-to-br from-[#E84F93] via-[#EC4899] to-[#F43F5E] shadow-md p-6 text-white rounded-b-[24px]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Booking ID</p>
                  <h2 className="text-xl font-bold text-white mt-0.5 tracking-tight">
                    #{String(selectedBookingForDrawer.bookingId || selectedBookingForDrawer.id).slice(0, 8).toUpperCase()}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsDrawerOpen(false); setSelectedBookingForDrawer(null); }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <StatusPill status={selectedBookingForDrawer.status} />
                <button
                  type="button"
                  onClick={() => handleViewBooking(selectedBookingForDrawer.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold text-white hover:bg-white hover:text-[#E84F93] transition"
                >
                  <Eye size={12} />
                  <span>Full Details Page</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Customer Info */}
              <PremiumCard className="p-4 border-[#F3E2EC]">
                <h3 className="text-xs font-bold text-[#9E8497] uppercase tracking-wider mb-3">Customer Info</h3>
                <div className="space-y-2.5">
                  <InfoItem label="Full Name">
                    {selectedCustomerForDrawer
                      ? `${selectedCustomerForDrawer.firstName || ''} ${selectedCustomerForDrawer.lastName || ''}`.trim()
                      : selectedBookingForDrawer.customerName}
                  </InfoItem>
                  {(selectedBookingForDrawer.phone || selectedCustomerForDrawer?.phone) && (
                    <InfoItem label="Phone Number">
                      <span className="font-bold text-[#E84F93]">
                        {selectedCustomerForDrawer?.phone || selectedBookingForDrawer.phone}
                      </span>
                    </InfoItem>
                  )}
                  {(selectedBookingForDrawer.email || selectedCustomerForDrawer?.email) && (
                    <InfoItem label="Email Address">
                      {selectedCustomerForDrawer?.email || selectedBookingForDrawer.email}
                    </InfoItem>
                  )}
                </div>
              </PremiumCard>

              {/* Service Info */}
              <PremiumCard className="p-4 border-[#F3E2EC]">
                <h3 className="text-xs font-bold text-[#9E8497] uppercase tracking-wider mb-3">Service & Schedule</h3>
                <div className="space-y-2.5">
                  <InfoItem label="Service Name">{selectedBookingForDrawer.serviceName}</InfoItem>
                  <InfoItem label="Assigned Artist">{selectedBookingForDrawer.artistName}</InfoItem>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <InfoItem label="Date">{selectedBookingForDrawer.date}</InfoItem>
                    <InfoItem label="Time Slot">{selectedBookingForDrawer.time}</InfoItem>
                  </div>
                </div>
              </PremiumCard>

              {/* Payment & QR */}
              <PremiumCard className="p-4 border-[#F3E2EC]">
                <h3 className="text-xs font-bold text-[#9E8497] uppercase tracking-wider mb-3">Payment & Check-in Codes</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#F3E2EC] pb-2">
                    <span className="text-xs font-semibold text-[#9E8497]">Deposit Status:</span>
                    <span className={`text-xs font-bold ${selectedBookingForDrawer.depositTone}`}>{selectedBookingForDrawer.deposit}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-[#2B182B]">Total Amount:</span>
                    <span className="text-base font-bold text-[#E84F93]">{formatVND(selectedBookingForDrawer.totalPrice)}</span>
                  </div>

                  {(selectedBookingForDrawer.qrCode || selectedBookingForDrawer.qtCode) && (
                    <div className="pt-3 mt-2 border-t border-[#F3E2EC]">
                      <p className="text-[11px] font-bold text-[#9E8497] uppercase tracking-wider mb-2">Check-in QR Code</p>
                      {selectedBookingForDrawer.qrCode && (
                        <div
                          className="rounded-2xl border border-[#F3D6E5] bg-white p-3 text-center cursor-pointer hover:border-[#E84F93] transition"
                          onClick={() => setIsQrExpanded(true)}
                        >
                          <img
                            crossOrigin="anonymous"
                            src={getQrCodeSrc(selectedBookingForDrawer.qrCode)}
                            alt="QR Code"
                            className="max-w-[120px] mx-auto rounded-xl"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                          <p className="mt-2 text-[10px] font-bold text-[#E84F93] flex items-center justify-center gap-1">
                            <Maximize2 size={12} /> Click to enlarge
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </PremiumCard>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={isQrExpanded}
        onCancel={() => setIsQrExpanded(false)}
        footer={null}
        closable={false}
        centered
        width={380}
        styles={{ content: { padding: 0, borderRadius: 24, overflow: "hidden" } }}
      >
        <div className="bg-white p-6 text-center">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-[#2B182B]">Customer QR Code</p>
            <button type="button" onClick={() => setIsQrExpanded(false)} className="text-[#9E8497] hover:text-[#E84F93]">
              <X size={18} />
            </button>
          </div>
          {selectedBookingForDrawer && (
            <img
              crossOrigin="anonymous"
              src={getQrCodeSrc(selectedBookingForDrawer.qrCode)}
              alt="QR Code"
              className="max-w-[260px] mx-auto rounded-xl shadow-md border border-[#F3E2EC]"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
        </div>
      </Modal>

      {/* Modal chi tiết danh sách tất cả lịch hẹn trong ngày khi bấm +N more */}
      <Modal
        open={isDayBookingsModalOpen}
        onCancel={() => setIsDayBookingsModalOpen(false)}
        footer={null}
        width={640}
        centered
        destroyOnClose
        styles={{
          content: { padding: 0, borderRadius: 24, overflow: "hidden" },
          mask: { backdropFilter: "blur(6px)" },
        }}
      >
        {selectedDateForModal && (() => {
          const modalDayBookings = filteredAppointments.filter((b) => {
            const bDate = dayjs(b.bookingDate || b.createdAt);
            return bDate.isValid() && bDate.isSame(selectedDateForModal, "day");
          });

          return (
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#F3E2EC] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#2B182B] flex items-center gap-2">
                    <Calendar className="text-[#E84F93]" size={20} />
                    Lịch hẹn ngày {selectedDateForModal.format("DD/MM/YYYY")}
                  </h3>
                  <p className="text-xs text-[#9E8497] mt-0.5 font-medium">
                    Tổng cộng {modalDayBookings.length} đơn đặt lịch trong ngày này
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDayBookingsModalOpen(false);
                    setSelectedDate(selectedDateForModal);
                    setViewMode("day");
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#E84F93] to-[#D93B7D] rounded-full shadow-xs hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarDays size={14} /> Xem ma trận giờ & thợ
                </button>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {modalDayBookings.length === 0 ? (
                  <p className="text-xs text-[#9E8497] italic text-center py-8">
                    Không có lịch hẹn nào trong ngày này.
                  </p>
                ) : (
                  modalDayBookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setIsDayBookingsModalOpen(false);
                        handleOpenDrawer(b.id);
                      }}
                      className="group p-3.5 rounded-2xl border border-[#F3E2EC] bg-[#FFFBFD] hover:bg-[#FFF0F6]/60 hover:border-[#E84F93]/40 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-2xs w-full text-left"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2B182B] truncate">{b.customer}</span>
                          <StatusPill status={b.status} compact />
                        </div>
                        <p className="text-xs text-[#6B5B68] truncate">{b.service}</p>
                        <div className="flex items-center gap-4 text-[11px] text-[#9E8497] font-semibold pt-0.5">
                          <span className="flex items-center gap-1 text-[#E84F93] font-bold">
                            <Clock3 size={12} /> {b.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} /> Thợ: {b.nailArtistName || b.artist || "Chưa chỉ định"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <span className="text-xs font-bold text-[#E84F93]">{formatVND(b.totalPrice)}</span>
                        <span className="text-[10px] font-bold text-[#8B5CF6] group-hover:underline flex items-center gap-0.5">
                          Chi tiết <ChevronRight size={12} />
                        </span>
                      </div>

                    </button>

                  ))
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </section>
  );
}
