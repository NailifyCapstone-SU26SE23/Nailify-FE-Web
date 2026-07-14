import {
  ChevronLeft,
  ChevronRight,
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
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Spin, Alert, DatePicker, Drawer, Modal } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { ROLES } from "../../../../shared/constants/roles";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { formatDurationLabel } from "../../../../shared/utils/formatDuration";
import { BOOKING_ROLE_CONFIG } from "../services/mockBookings";
import { fetchBookingsBySalonId, fetchBookingById, fetchUserById } from "../services/bookingsService";
import { AssignArtistModal } from "../components/AssignArtistModal";
import { ConfirmBookingModal } from "../components/ConfirmBookingModal";
import { RejectBookingModal } from "../components/RejectBookingModal";
import { CancelBookingModal } from "../components/CancelBookingModal";
import { Pagination } from "../../../../shared/components/common/Pagination";

const roleConfig = BOOKING_ROLE_CONFIG[ROLES.manager];
const DEFAULT_SALON_ID = "484c3aef-3ae1-4ad6-8aba-6b0bc6df586d";
const BOOKING_PAGE_SIZE = 10;

const ACCENT_COLOR = "#ea4f93";
const NEUTRAL_BASE = "#f9fafb";
const BORDER_COLOR = "#f1e7ed";

// --- Motion Presets ---
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// --- Components (Isolated for Performance) ---
function PremiumCard({ className = "", children, noHover = false }) {
  return (
    <article
      className={`relative overflow-hidden rounded-[28px] border border-[${BORDER_COLOR}] bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out ${!noHover ? "hover:-translate-y-1 hover:shadow-[0_30px_50px_-15px_rgba(0,0,0,0.06)]" : ""} ${className}`}
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

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-[#2d1b35] tracking-tight">{title}</h3>
      {subtitle ? <p className="mt-1.5 text-xs text-[#a88a9f] leading-relaxed">{subtitle}</p> : null}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-[#a88a9f] mb-1">{label}</p>
      <div className="text-sm font-medium text-[#2d1b35] break-all">{children}</div>
    </div>
  );
}

InfoItem.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function StatusPill({ status }) {
  const getStyle = () => {
    switch (status) {
      case "Checked In":
      case "CheckedIn":
        return "bg-[#e7ecff] text-[#4755b8] border-transparent";
      case "In Progress":
      case "InProgress":
        return "bg-[#f3ebff] text-[#7e4fe6] border-transparent";
      case "Pending":
        return "bg-[#fff0dd] text-[#c17a1c] border-transparent";
      case "Confirmed":
      case "Approved":
        return "bg-[#eaf9ee] text-[#238a55] border-transparent";
      case "Completed":
      case "ServiceCompleted":
        return "bg-[#eaf9ee] text-[#238a55] border-transparent";
      case "Rejected":
        return "bg-[#ffe5ee] text-[#d6376f] border-transparent";
      case "RescheduleReq":
      case "Reschedule Req":
        return "bg-[#fff0dd] text-[#c17a1c] border-transparent";
      default:
        return "bg-[#f3f4f6] text-[#6b7280] border-transparent";
    }
  };

  const formatDisplay = (s) => {
    if (s === "CheckedIn") return "Checked In";
    if (s === "InProgress") return "In Progress";
    if (s === "RescheduleReq") return "Reschedule req";
    if (s === "ServiceCompleted") return "Completed";
    return s;
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${getStyle()}`}>
      {(status === "InProgress" || status === "In Progress") && (
        <Loader2 size={11} className="animate-spin" />
      )}
      {formatDisplay(status)}
    </span>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="h-4 w-28 bg-[#f5e2ec] rounded-full" />
          <div className="h-4 w-40 bg-[#f5e2ec] rounded-full" />
          <div className="h-4 w-32 bg-[#f5e2ec] rounded-full" />
          <div className="h-4 w-32 bg-[#f5e2ec] rounded-full" />
          <div className="h-8 w-24 bg-[#f5e2ec] rounded-full" />
          <div className="h-8 w-32 bg-[#f5e2ec] rounded-full ml-auto" />
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
  const totalEndMinutes = totalStartMinutes + durationMinutes;
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
    currency: 'VNĐ'
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
  if (filter === "Reschedule") return status === "RescheduleReq" || status === "Reschedule Req";
  if (filter === "Completed") return status === "Completed" || status === "ServiceCompleted";
  return status === filter;
}

// Helper to properly format QR code src
function getQrCodeSrc(qrCode) {
  if (!qrCode) return null;
  const trimmed = String(qrCode).trim();
  
  // If it's already a data URL, use as-is
  if (trimmed.startsWith("data:")) {
    return trimmed;
  }
  
  // If it's a URL (starts with http/https), use as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  
  // If it's a valid base64 string (without prefix), add data URL prefix
  // Try to detect if it's base64 (length > 0, no spaces, valid characters)
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 50) {
    // Try to detect if it's PNG or JPG by checking magic bytes (optional but helpful)
    // For simplicity, default to PNG, which is common for QR codes
    return `data:image/png;base64,${trimmed}`;
  }
  
  // If none of the above, return it as-is (maybe it's a relative URL or other format)
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
    depositTone: rawBooking.depositAmount ? "text-[#2fa25f]" : "text-[#db8520]",
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

function mapApiBookingToUiFormat(apiBooking) {
  console.log("mapApiBookingToUiFormat - apiBooking:", apiBooking); // Log the full booking object
  const customerName = apiBooking.customerName || (apiBooking.customer ? `${apiBooking.customer.firstName} ${apiBooking.customer.lastName}` : "Unknown Customer");
  const customerInitials = customerName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const artistName = getArtistDisplayName(apiBooking);
  const artistId = apiBooking.staffId || apiBooking.nailArtistId || apiBooking.staffArtistId || apiBooking.artistId || null;
  return {
    id: apiBooking.bookingId || apiBooking.id,
    bookingId: apiBooking.bookingId || apiBooking.id,
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
    depositTone: apiBooking.depositAmount ? "text-[#2fa25f]" : "text-[#db8520]",
    status: apiBooking.status || "Pending",
    totalPrice: apiBooking.totalPrice,
    qrCode: apiBooking.qrCode,
    qtCode: apiBooking.qtCode,
    checkInImageUrl: apiBooking.checkInImageUrl,
    bookingItems: apiBooking.bookingItems || [],
    salonId: apiBooking.salonId,
    initials: customerInitials,
    avatarTone: "from-[#ffc5de] to-[#ea4f93]",
    artistTone: "from-[#d8c4ff] to-[#8b5cf6]",
    ...apiBooking,
  };
}

function isFinalStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  return s.includes("cancel") || s.includes("reject") || s.includes("complete") || s.includes("confirmed") || s.includes("approved");
}

const scheduleColorPalette = [
  { dot: "bg-[#8b5cf6]", tone: "border-[#d9c2fb] bg-[#f3ebff] text-[#7e4fe6]" },
  { dot: "bg-[#ea4f93]", tone: "border-[#f8c4d8] bg-[#ffe7ef] text-[#ea4f93]" },
  { dot: "bg-[#3b82f6]", tone: "border-[#c7d7ff] bg-[#e7ecff] text-[#4755b8]" },
  { dot: "bg-[#22c55e]", tone: "border-[#b8e6cc] bg-[#eaf9ee] text-[#2fa25f]" },
  { dot: "bg-[#f97316]", tone: "border-[#f5d0a0] bg-[#fff0dd] text-[#db8520]" },
];

const capacityPeriods = [
  { label: "Morning (9-12)", value: 85, tone: "bg-[#ea4f93]" },
  { label: "Afternoon (12-3)", value: 72, tone: "bg-[#8b5cf6]" },
  { label: "Evening (3-6)", value: 58, tone: "bg-[#ff9800]" },
];

const staffWorkload = [
  { name: "Luna Park", filled: 8, total: 10, tone: "from-[#d8c4ff] to-[#8b5cf6]" },
  { name: "Aria Nguyen", filled: 9, total: 10, tone: "from-[#ffc5de] to-[#ea4f93]" },
  { name: "Chloe Davis", filled: 6, total: 10, tone: "from-[#b8f0d8] to-[#2fc5a9]" },
  { name: "Mel Santos", filled: 7, total: 10, tone: "from-[#ffe0b2] to-[#ff9800]" },
];

const waitlist = [
  { name: "Kim Nguyen", service: "Gel Manicure", time: "ASAP • Morning" },
  { name: "Lisa Hoang", service: "Nail Art", time: "After 2 PM" },
  { name: "Anna Tran", service: "Pedicure", time: "Any slot today" },
];

const bookingConflicts = [
  {
    title: "Double Booking",
    time: "11 AM • Aria Nguyen",
    action: "Resolve Now",
  },
  {
    title: "Unassigned Booking",
    time: "2 PM • No staff assigned",
    action: "Assign staff",
  },
  {
    title: "Deposit Missing",
    time: "10 AM • Jessica Tan",
    action: "Resolve Now",
  },
];

function formatHourLabel(hour) {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

const appointmentFilters = [
  { value: "All", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Approved", label: "Approved" },
  { value: "CheckedIn", label: "Checked In" },
  { value: "InProgress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Rejected", label: "Rejected" },
  { value: "Reschedule", label: "Reschedule" },
];

// --- Main Page Component ---
export function ManagerBookingListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flashMessage] = useState(location.state?.flashMessage ?? "");
  const tableContainerRef = useRef(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBookingForDrawer, setSelectedBookingForDrawer] = useState(null);
  const [selectedCustomerForDrawer, setSelectedCustomerForDrawer] = useState(null);
  const [isLoadingDrawer, setIsLoadingDrawer] = useState(false);

  // Schedule state
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('morning');
  const [scheduleDate, setScheduleDate] = useState(dayjs());
  const timeFilters = [
    { label: "9AM - 3PM", value: "morning", startHour: 9, endHour: 15 },
    { label: "3PM - 8PM", value: "afternoon", startHour: 15, endHour: 20 }
  ];

  // Core state
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(null);
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

  // --- Effects ---
  useEffect(() => {
    if (!location.state?.flashMessage) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await fetchBookingsBySalonId(DEFAULT_SALON_ID, { pageNumber: 1, pageSize: 1000 });
      let apiBookings = [];
      if (result?.items) apiBookings = result.items;
      else if (Array.isArray(result)) apiBookings = result;
      console.log("Raw API bookings:", apiBookings); // Log raw API data
      let uiBookings = apiBookings.map(mapApiBookingToUiFormat);
      console.log("Mapped UI bookings:", uiBookings); // Log mapped data

      // Fetch customer details for each booking to get phone number
      const customerPromises = uiBookings
        .filter(booking => booking.customerId && !booking.phone)
        .map(async (booking) => {
          try {
            const customer = await fetchUserById(booking.customerId);
            return { bookingId: booking.id, customer };
          } catch (err) {
            console.warn(`Failed to fetch customer for booking:`, err);
            return { bookingId: booking.id, customer: null };
          }
        });

      const customerResults = await Promise.all(customerPromises);
      
      // Update bookings with customer phone numbers
      uiBookings = uiBookings.map(booking => {
        const customerResult = customerResults.find(r => r.bookingId === booking.id);
        if (customerResult?.customer?.phone) {
          return { ...booking, phone: customerResult.customer.phone };
        }
        return booking;
      });

      setBookings(uiBookings);
      setHasLoadedOnce(true);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setError(err.message || "Failed to load bookings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedOnce) loadBookings();
  }, [hasLoadedOnce, loadBookings]);

  // --- Derived State ---
  const summaryStats = useMemo(() => {
    const pending = bookings.filter(b => b.status === "Pending").length;
    const confirmed = bookings.filter(b => b.status === "Confirmed").length;
    const checkedIn = bookings.filter(b => b.status === "CheckedIn" || b.status === "Checked In").length;
    const completed = bookings.filter(b => b.status === "Completed" || b.status === "ServiceCompleted").length;
    return [
      {
        label: "Pending",
        value: pending,
        note: "awaiting confirmation",
        icon: Clock3,
        tone: "bg-[#ffe8f2] text-[#ea4f93]",
      },
      {
        label: "Confirmed",
        value: confirmed,
        note: "locked in",
        icon: CheckCircle2,
        tone: "bg-[#eaf9ee] text-[#2fa25f]",
      },
      {
        label: "Checked in",
        value: checkedIn,
        note: "in salon",
        icon: UserCheck,
        tone: "bg-[#e7ecff] text-[#4755b8]",
      },
      {
        label: "Completed",
        value: completed,
        note: "finished today",
        icon: CheckCircle2,
        tone: "bg-[#eaf9ee] text-[#2fa25f]",
      },
    ];
  }, [bookings]);

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return bookings.filter((appointment) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          appointment.customer,
          appointment.phone,
          appointment.artist,
          appointment.time,
          appointment.service,
          appointment.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      let matchesDate = true;
      if (selectedDate) {
        const bookingDate = dayjs(appointment.bookingDate || appointment.createdAt);
        matchesDate = bookingDate.isValid() && bookingDate.isSame(selectedDate, "day");
      }
      return matchesQuery && matchesFilter(appointment.status, activeFilter) && matchesDate;
    });
  }, [activeFilter, query, bookings, selectedDate]);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * BOOKING_PAGE_SIZE;
    return filteredAppointments.slice(startIndex, startIndex + BOOKING_PAGE_SIZE);
  }, [filteredAppointments, currentPage]);

  const filteredTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAppointments.length / BOOKING_PAGE_SIZE));
  }, [filteredAppointments.length]);

  // Filter bookings for the selected schedule date
  const scheduleDateBookings = useMemo(() => {
    return bookings.filter(b => {
      const d = dayjs(b.bookingDate || b.createdAt);
      return d.isValid() && d.isSame(scheduleDate, "day");
    });
  }, [bookings, scheduleDate]);

  // Calculate capacity by time periods
  const capacityData = useMemo(() => {
    // Define time periods
    const periods = [
      { label: "Morning (9-12)", start: 9, end: 12, maxSlots: 10 },
      { label: "Afternoon (12-3)", start: 12, end: 15, maxSlots: 10 },
      { label: "Evening (3-6)", start: 15, end: 18, maxSlots: 10 }
    ];

    return periods.map(period => {
      const bookingsInPeriod = scheduleDateBookings.filter(b => {
        const startHour = parseInt(b.startTime?.split(':')[0] || '0');
        return startHour >= period.start && startHour < period.end;
      });
      const value = Math.min(100, Math.round((bookingsInPeriod.length / period.maxSlots) * 100));
      const tone = value > 80 ? "bg-[#ff9800]" : value > 50 ? "bg-[#8b5cf6]" : "bg-[#ea4f93]";
      return { ...period, value, tone };
    });
  }, [scheduleDateBookings]);

  // Calculate staff workload
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
    // If no staff, add some default
    if (workload.length === 0) {
      return [
        { name: "Luna Park", filled: 0, total: 10, tone: "from-[#d8c4ff] to-[#8b5cf6]" },
        { name: "Aria Nguyen", filled: 0, total: 10, tone: "from-[#ffc5de] to-[#ea4f93]" }
      ];
    }

    const tones = ["from-[#d8c4ff] to-[#8b5cf6]", "from-[#ffc5de] to-[#ea4f93]", "from-[#b8f0d8] to-[#2fc5a9]", "from-[#ffe0b2] to-[#ff9800]"];
    return workload.map((staff, i) => ({
      ...staff,
      tone: tones[i % tones.length]
    }));
  }, [scheduleDateBookings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, activeFilter, selectedDate]);

  // --- Handlers ---
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
    setQuery("");
    setActiveFilter("All");
    setSelectedDate(null);
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
    <section className="flex min-h-[100dvh] flex-col gap-6 bg-[#f9fafb] p-4 lg:p-8">
      {/* Hero Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <PremiumCard className="border-none bg-gradient-to-br from-[#fff3f8] via-[#fffafb] to-[#fff5fb] p-0 shadow-[0_20px_40px_-15px_rgba(234,79,147,0.12)]">
          <div className="flex flex-col gap-8 p-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4">
                <motion.div
                  className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_10px_24px_rgba(234,79,147,0.35)]"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Calendar size={26} />
                </motion.div>
                <div>
                  <span className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold text-[#ea4f93] shadow-[0_6px_14px_rgba(234,79,147,0.08)] backdrop-blur">
                    Manager dashboard
                  </span>
                  <h1 className="text-3xl font-bold text-[#2d1b35] mt-2 tracking-tight">Branch Bookings</h1>
                  <p className="mt-1 text-sm text-[#a88a9f]">Track appointments, assign artists, and keep operations smooth</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
              {[
                { label: "Today", value: bookings.filter(b => { const d = dayjs(b.bookingDate || b.createdAt); return d.isValid() && d.isSame(dayjs(), "day"); }).length, sub: "appointments" },
                { label: "In view", value: filteredAppointments.length, sub: "bookings" },
                { label: "Needs action", value: bookings.filter(b => b.status === "Pending" || !(b.nailArtistId || b.staffId || b.staffArtistId || b.artistId)).length, sub: "pending" }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-[0_10px_30px_rgba(236,72,153,0.08)] backdrop-blur"
                >
                  <p className="text-[11px] font-medium text-[#b28ca2]">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-[#2d1b35]">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-[#8b7382]">{stat.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </PremiumCard>
      </motion.div>

      {flashMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f]">
          {flashMessage}
        </motion.div>
      )}

      {error && (
        <Alert message="Error Loading Bookings" description={error} type="error" showIcon />
      )}

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spin size="large" />
        </div>
      ) : hasLoadedOnce ? (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_300px]">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Stats Row */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {summaryStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <PremiumCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${stat.tone}`}>
                        <stat.icon size={18} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#2d1b35]">{stat.value}</p>
                        <p className="text-[11px] text-[#8b7382]">{stat.label}</p>
                      </div>
                    </div>
                  </PremiumCard>
                </motion.div>
              ))}
            </motion.div>

            {/* Booking Board */}
            <motion.div variants={fadeInUp}>
              <PremiumCard className="p-0 overflow-hidden">
                {/* Filter Header */}
                <div className="border-b border-[#f5e2ec] bg-gradient-to-b from-[#fff9fb] to-white p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <SectionHeading
                      title="Booking board"
                      subtitle="Filter, scan, and act on appointments quickly"
                    />
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-[#f5d6e4] bg-white px-3 py-1.5 text-[11px] font-medium text-[#7f6478]">
                        {filteredAppointments.length} in view
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-[#f7dce8] bg-white p-5">
                    <div className="flex flex-col gap-4">
                      {/* Status Pills */}
                      <div className="flex flex-wrap gap-2">
                        {appointmentFilters.map((filter) => {
                          const count = filter.value === "All"
                            ? bookings.length
                            : bookings.filter(b => matchesFilter(b.status, filter.value)).length;
                          const isActive = activeFilter === filter.value;
                          return (
                            <motion.button
                              key={filter.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setActiveFilter(filter.value)}
                              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-300 ${
                                isActive
                                  ? "border-[#ea4f93] bg-[#ea4f93] text-white shadow-[0_10px_20px_rgba(234,79,147,0.22)]"
                                  : "border-[#f3d7e4] bg-white text-[#7f6478] hover:border-[#f0b7cf] hover:bg-[#fff7fb] hover:text-[#ea4f93]"
                              }`}
                            >
                              <span>{filter.label}</span>
                              <span className={isActive ? "rounded-full bg-white/20 px-2 py-0.5 text-[11px]" : "rounded-full bg-[#fff0f6] px-2 py-0.5 text-[11px] text-[#c86d98]"}>
                                {count}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Search & Date */}
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
                        <label className="group relative block">
                          <span className="mb-2 block text-[11px] font-semibold text-[#b28ca2]">Search</span>
                          <Search size={15} className="pointer-events-none absolute left-3 top-[calc(50%+11px)] -translate-y-1/2 text-[#a88a9f] transition-colors group-focus-within:text-[#ea4f93]" />
                          <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Customer, phone, artist, service..."
                            className="h-11 w-full rounded-2xl border border-[#f3d7e4] bg-white pl-10 pr-4 text-sm text-[#5c4559] outline-none transition-all duration-300 ease-out placeholder:text-[#c8b0bf] hover:border-[#f0b7cf] focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-[11px] font-semibold text-[#b28ca2]">Date</span>
                          <DatePicker
                            value={selectedDate}
                            onChange={(d) => setSelectedDate(d)}
                            placeholder="Select date"
                            className="h-11 w-full rounded-2xl border border-[#f3d7e4] bg-white px-3 text-sm text-[#5c4559] outline-none transition-all duration-300 ease-out placeholder:text-[#c8b0bf] hover:border-[#f0b7cf] focus:border-[#ea4f93] focus:ring-4 focus:ring-[#ea4f93]/10"
                            suffixIcon={<Calendar size={14} className="text-[#a88a9f]" />}
                          />
                        </label>

                        <div className="flex items-end">
                          <motion.button
                            whileHover={query.trim() || selectedDate || activeFilter !== "All" ? { scale: 1.02 } : {}}
                            whileTap={query.trim() || selectedDate || activeFilter !== "All" ? { scale: 0.98 } : {}}
                            onClick={handleResetFilters}
                            disabled={!query.trim() && !selectedDate && activeFilter === "All"}
                            className={`h-11 rounded-2xl border px-4 text-sm font-semibold transition-all duration-300 ${
                              query.trim() || selectedDate || activeFilter !== "All"
                                ? "border-[#f3d7e4] bg-white text-[#ea4f93] hover:border-[#ea4f93] hover:bg-[#fff5fa]"
                                : "border-[#f5e8ef] bg-[#fffafb] text-[#d6b9c8] cursor-not-allowed"
                            }`}
                          >
                            Reset
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div ref={tableContainerRef} className="overflow-x-auto bg-white">
                  {isLoading ? (
                    <div className="p-6">
                      <SkeletonLoader />
                    </div>
                  ) : paginatedAppointments.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0f8] text-[#ea4f93] mb-4">
                        <Search size={24} />
                      </div>
                      <p className="text-base font-semibold text-[#5b4256]">No bookings found</p>
                      <p className="mt-1 text-xs text-[#a88a9f] max-w-xs">
                        Try adjusting your filters or search term
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleResetFilters}
                        className="mt-4 rounded-full bg-[#ea4f93] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Clear filters
                      </motion.button>
                    </motion.div>
                  ) : (
                    <table className="w-full min-w-[740px] table-fixed text-left">
                      <colgroup>
                        <col className="w-[130px]" />
                        <col className="w-[160px]" />
                        <col className="w-[140px]" />
                        <col className="w-[140px]" />
                        <col className="w-[120px]" />
                        <col className="w-[130px]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-[#f5e2ec] bg-[#fff8fb] text-[11px] font-semibold text-[#a88a9f]">
                          <th className="px-3 py-2.5 font-semibold text-left">Time</th>
                          <th className="px-3 py-2.5 font-semibold text-left">Customer</th>
                          <th className="px-3 py-2.5 font-semibold text-left">Service</th>
                          <th className="px-3 py-2.5 font-semibold text-left">Artist</th>
                          <th className="px-3 py-2.5 font-semibold text-left">Status</th>
                          <th className="px-3 py-2.5 font-semibold text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {paginatedAppointments.map((row) => (
                            <motion.tr
                              key={row.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="group relative cursor-pointer border-b border-[#f7e7ee] transition-colors duration-300 ease-out hover:bg-[#fff9fb] last:border-b-0"
                              onClick={() => handleOpenDrawer(row.id)}
                            >
                              <td className="px-3 py-2.5 align-middle">
                                <p className="text-xs font-semibold text-[#2d1b35] truncate">{row.time}</p>
                                <p className="mt-0.5 text-[10px] text-[#a88a9f]">{row.duration}</p>
                              </td>
                              <td className="px-3 py-2.5 align-middle">
                                <div className="flex min-w-0 items-center gap-2">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ffc5de] to-[#ea4f93] text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(234,79,147,0.28)]">
                                    {row.initials}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-[#2d1b35]">{row.customer}</p>
                                    <p className="mt-0.5 truncate text-[10px] text-[#a88a9f]">{row.phone || "No phone"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 align-middle">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-[#2d1b35]">{row.service}</p>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 align-middle">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d8c4ff] to-[#8b5cf6] text-[8px] font-bold text-white shadow-[0_2px_6px_rgba(139,92,246,0.28)]">
                                    {row.artist === "Unassigned" ? "--" : row.artist.split(" ").map(p => p[0]).join("")}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-[#5b4256]">{row.artist}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 align-middle">
                                <StatusPill status={row.status} />
                              </td>
                              <td className="px-3 py-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleViewBooking(row.id)}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#fff0f8] text-[#ea4f93] transition-all duration-300 ease-out hover:bg-[#ea4f93] hover:text-white"
                                    title="View"
                                  >
                                    <Eye size={13} />
                                  </motion.button>
                                  {!(
                                    (row.nailArtistId || row.staffId || row.staffArtistId || row.artistId) &&
                                    (row.status === "CheckedIn" || row.status === "Checked In")
                                  ) && (!isFinalStatus(row.status) || row.status === "Approved") && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => { setSelectedBookingForAssign(row); setIsAssignArtistModalOpen(true); }}
                                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e7ecff] text-[#4755b8] transition-all duration-300 ease-out hover:bg-[#4755b8] hover:text-white"
                                      title="Assign"
                                    >
                                      <UserCheck size={13} />
                                    </motion.button>
                                  )}
                                  {!isFinalStatus(row.status) && !(row.status === "CheckedIn" || row.status === "Checked In" || row.status === "InProgress" || row.status === "In Progress") && (
                                    <>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { setSelectedBookingForAction(row); setIsConfirmModalOpen(true); }}
                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eaf9ee] text-[#2fa25f] transition-all duration-300 ease-out hover:bg-[#2fa25f] hover:text-white"
                                        title="Confirm"
                                      >
                                        <CheckCircle2 size={13} />
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { setSelectedBookingForAction(row); setIsCancelModalOpen(true); }}
                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#fff0dd] text-[#db8520] transition-all duration-300 ease-out hover:bg-[#db8520] hover:text-white"
                                        title="Cancel"
                                      >
                                        <XCircle size={13} />
                                      </motion.button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination */}
                {paginatedAppointments.length > 0 && (
                  <div className="flex justify-end p-4 border-t border-[#f5e2ec] bg-gradient-to-b from-white to-[#fffafb]">
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

          {/* Right Column - Today Schedule */}
          <motion.div variants={fadeInUp} className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            {/* Today's Capacity */}
            <PremiumCard className="p-5">
              <SectionHeading title="Today's capacity" subtitle="Traffic by shift" />
              <div className="mt-5 space-y-4">
                {capacityData.map((period, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs text-[#8b7382]">
                      <span className="font-semibold text-[#5b4256]">{period.label}</span>
                      <span className="font-bold text-[#2d1b35]">{period.value}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#f5e2ec]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${period.value}%` }}
                        transition={{ delay: 0.4 + i * 0.08, duration: 1.2, ease: "easeOut" }}
                        className={`h-full rounded-full ${period.tone}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </PremiumCard>

            {/* Today Schedule Board */}
            <PremiumCard className="p-5">
              <div className="flex items-center justify-between">
                <SectionHeading title="Today's schedule" subtitle="Time slots (9 AM - 8 PM)" />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-[16px] bg-[#fff9fb] p-1.5">
                {timeFilters.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setSelectedTimeFilter(tf.value)}
                    className={`flex-1 rounded-[12px] px-3 py-2 text-[11px] font-semibold transition-all ${
                      selectedTimeFilter === tf.value
                        ? "bg-white text-[#ea4f93] shadow-sm"
                        : "text-[#8b7382] hover:text-[#5b4256]"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-[#8b7382] mb-2">
                  <span className="font-semibold">Date</span>
                  <span className="font-semibold">{scheduleDate.format("ddd, MMM D")}</span>
                </div>
                <div className="relative mt-1">
                  <div className="mt-2 rounded-[14px] border border-[#f7dce8] bg-white p-3">
                    <div className="space-y-3">
                      {(() => {
                        const currentFilter = timeFilters.find((tf) => tf.value === selectedTimeFilter) || timeFilters[0];
                        
                        // Get bookings for this time filter
                        const filteredBookings = scheduleDateBookings.filter(b => {
                          const startHour = parseInt(b.startTime?.split(':')[0] || '0');
                          return startHour >= currentFilter.startHour && startHour < currentFilter.endHour;
                        });
                        
                        // Group bookings by hour
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
                        
                        return hours.map((hour, idx) => {
                          const bookingsAtHour = bookingsByHour[hour] || [];
                          
                          if (bookingsAtHour.length === 0) {
                            return (
                              <div key={hour} className="group flex items-start gap-3">
                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#e2ccd9]" />
                                <div className="min-w-[60px] pt-[2px] text-[11px] font-semibold text-[#8b7382]">
                                  {formatHourLabel(hour)}
                                </div>
                                <div className="flex-1 border-l border-dashed border-[#f0d7e4] pl-3">
                                  <div className="text-[11px] text-[#c8b0bf] italic py-2">
                                    No bookings
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          const isExpanded = expandedHours.has(hour);
                          const MAX_BOOKINGS = 3;
                          const hasMoreBookings = bookingsAtHour.length > MAX_BOOKINGS;
                          const visibleBookings = isExpanded ? bookingsAtHour : bookingsAtHour.slice(0, MAX_BOOKINGS);
                          
                          return (
                            <div key={hour} className="group flex items-start gap-3">
                              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#e2ccd9]" />
                              <div className="min-w-[60px] pt-[2px] text-[11px] font-semibold text-[#8b7382]">
                                {formatHourLabel(hour)}
                              </div>
                              <div className="flex-1 border-l border-dashed border-[#f0d7e4] pl-3 space-y-2">
                                {visibleBookings.map((b, bIdx) => {
                                  const colorIndex = bIdx % scheduleColorPalette.length;
                                  const palette = scheduleColorPalette[colorIndex];
                                  const artistName = getArtistDisplayName(b);
                                  const artistInitials = artistName === "Unassigned" ? "--" : artistName.split(" ").map(p => p[0]).join("");
                                  
                                  return (
                                    <div
                                      key={b.id}
                                      className={`relative overflow-hidden rounded-[14px] border ${palette.tone} px-3.5 py-2.5 cursor-pointer hover:shadow-md transition-shadow`}
                                      onClick={() => handleOpenDrawer(b.id)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-[11px] font-bold truncate">{artistName}</p>
                                          <p className="mt-1 text-[10px]">• {formatDuration(b.totalDuration || 60)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${palette.tone.includes("d8c4ff") ? "from-[#d8c4ff] to-[#8b5cf6]" : "from-[#ffc5de] to-[#ea4f93]"} text-[9px] font-bold text-white`}>
                                            {artistInitials}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {hasMoreBookings && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleHourExpanded(hour); }}
                                    className="w-full text-center rounded-[14px] border border-[#f0d7e4] bg-[#fff9fb] px-3.5 py-2 text-[11px] font-semibold text-[#ea4f93] hover:border-[#ea4f93] hover:bg-[#fff3f8] transition-all"
                                  >
                                    {isExpanded ? `Show less` : `+${bookingsAtHour.length - MAX_BOOKINGS} more`}
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </PremiumCard>

            {/* Staff Workload */}
            <PremiumCard className="p-5">
              <SectionHeading title="Staff workload" subtitle="Bookings per nail tech" />
              <div className="mt-4 space-y-4">
                {staffWorkloadData.map((staff, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-[18px] bg-gradient-to-br ${staff.tone} text-xs font-bold text-white shadow-[0_6px_14px_rgba(234,79,147,0.12)]`}>
                      {staff.name.split(" ").map((p) => p[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#2d1b35] truncate">{staff.name}</p>
                        <p className="text-[11px] font-bold text-[#ea4f93]">
                          {staff.filled}/{staff.total}
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#f5e2ec]">
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
      ) : null}

      {/* --- Modals & Drawer --- */}
      {selectedBookingForAssign && (
        <AssignArtistModal
          open={isAssignArtistModalOpen}
          onClose={() => { setIsAssignArtistModalOpen(false); setSelectedBookingForAssign(null); }}
          bookingId={String(selectedBookingForAssign.id)}
          salonId={selectedBookingForAssign.salonId ? String(selectedBookingForAssign.salonId) : DEFAULT_SALON_ID}
          booking={selectedBookingForAssign}
          onSuccess={() => loadBookings()}
        />
      )}
      <ConfirmBookingModal
        open={isConfirmModalOpen}
        onClose={() => { setIsConfirmModalOpen(false); setSelectedBookingForAction(null); }}
        bookingId={selectedBookingForAction?.id ? String(selectedBookingForAction.id) : ""}
        onSuccess={() => loadBookings()}
      />
      <CancelBookingModal
        open={isCancelModalOpen}
        onClose={() => { setIsCancelModalOpen(false); setSelectedBookingForAction(null); }}
        bookingId={selectedBookingForAction?.id ? String(selectedBookingForAction.id) : ""}
        onSuccess={() => loadBookings()}
      />
      <RejectBookingModal
        open={isRejectModalOpen}
        onClose={() => { setIsRejectModalOpen(false); setSelectedBookingForAction(null); }}
        bookingId={selectedBookingForAction?.id ? String(selectedBookingForAction.id) : ""}
        onSuccess={() => loadBookings()}
      />

      {/* Drawer */}
      <Drawer
        title={null}
        open={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedBookingForDrawer(null); }}
        width={480}
        styles={{
          body: { padding: 0 },
          content: { background: "#f9fafb" }
        }}
        placement="right"
        mask={true}
        maskClosable={true}
        destroyOnClose
        closable={false}
      >
        {isLoadingDrawer ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : selectedBookingForDrawer ? (
          <div className="bg-[#f9fafb] h-full flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#ea4f93] via-[#ff7ba4] to-[#ffaab6] shadow-md p-6 rounded-b-[28px]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/85">Booking details</p>
                  <h2 className="text-xl font-bold text-white mt-1">#{String(selectedBookingForDrawer.bookingId || selectedBookingForDrawer.id).slice(0, 8)}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsDrawerOpen(false); setSelectedBookingForDrawer(null); }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-3">
                <StatusPill status={selectedBookingForDrawer.status} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Customer */}
              <PremiumCard className="p-5">
                <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Customer</h3>
                <div className="space-y-3">
                  <InfoItem label="Name">
                    {selectedCustomerForDrawer
                      ? `${selectedCustomerForDrawer.firstName || ''} ${selectedCustomerForDrawer.lastName || ''}`.trim()
                      : selectedBookingForDrawer.customerName}
                  </InfoItem>
                  {(selectedBookingForDrawer.phone || selectedCustomerForDrawer?.phone) && (
                    <InfoItem label="Phone">
                      {selectedCustomerForDrawer?.phone || selectedBookingForDrawer.phone}
                    </InfoItem>
                  )}
                  {(selectedBookingForDrawer.email || selectedCustomerForDrawer?.email) && (
                    <InfoItem label="Email">
                      {selectedCustomerForDrawer?.email || selectedBookingForDrawer.email}
                    </InfoItem>
                  )}
                </div>
              </PremiumCard>

              {/* Service */}
              <PremiumCard className="p-5">
                <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Service</h3>
                <div className="space-y-3">
                  <InfoItem label="Service">{selectedBookingForDrawer.serviceName}</InfoItem>
                  <InfoItem label="Artist">{selectedBookingForDrawer.artistName}</InfoItem>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem label="Date">{selectedBookingForDrawer.date}</InfoItem>
                    <InfoItem label="Time">{selectedBookingForDrawer.time}</InfoItem>
                  </div>
                  {selectedBookingForDrawer.totalDuration && (
                    <InfoItem label="Duration">{formatDuration(selectedBookingForDrawer.totalDuration)}</InfoItem>
                  )}
                </div>
              </PremiumCard>

              {/* Payment */}
              <PremiumCard className="p-5">
                <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Payment & codes</h3>
                <div className="space-y-3">
                  <InfoItem label="Deposit status">
                    <span className={selectedBookingForDrawer.depositTone}>{selectedBookingForDrawer.deposit}</span>
                  </InfoItem>
                  <InfoItem label="Total">{formatVND(selectedBookingForDrawer.totalPrice)}</InfoItem>
                  {(selectedBookingForDrawer.qrCode || selectedBookingForDrawer.qtCode) && (
                    <div className="pt-3 mt-3 border-t border-[#f5e2ec]">
                      <p className="text-[11px] font-semibold text-[#a88a9f] mb-3">Confirmation codes</p>
                      {selectedBookingForDrawer.qrCode && (
                        <div
                          className="rounded-[16px] border border-[#f5d6e4] bg-white p-4 mb-3 cursor-pointer hover:border-[#ea4f93] hover:shadow-md transition-all"
                          onClick={() => setIsQrExpanded(true)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-semibold text-[#a88a9f]">QR code</p>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setIsQrExpanded(true); }}
                              className="text-[#ea4f93] hover:text-[#c9366b] transition"
                            >
                              <Maximize2 size={16} />
                            </button>
                          </div>
                          <img
                            crossOrigin="anonymous"
                            src={getQrCodeSrc(selectedBookingForDrawer.qrCode)}
                            alt="QR Code"
                            className="max-w-[120px] mx-auto rounded-xl"
                            referrerPolicy="no-referrer"
                            onError={(e) => { console.error("QR Code failed to load"); e.target.style.display = "none"; }}
                          />
                        </div>
                      )}
                      {selectedBookingForDrawer.qtCode && (
                        <div className="rounded-[16px] border border-[#f5d6e4] bg-white p-4">
                          <p className="mb-2 text-[11px] font-semibold text-[#a88a9f]">QT code</p>
                          <p className="break-all text-sm font-medium text-[#2d1b35]">{selectedBookingForDrawer.qtCode}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </PremiumCard>

              {/* Check-in image */}
              {selectedBookingForDrawer.checkInImageUrl && (
                <PremiumCard className="p-5">
                  <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Check-in photo</h3>
                  <div className="overflow-hidden rounded-[16px] border border-[#f5d6e4] bg-white p-2">
                    <img
                      crossOrigin="anonymous"
                      src={selectedBookingForDrawer.checkInImageUrl}
                      alt="Check-in"
                      className="max-w-full rounded-lg w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </PremiumCard>
              )}
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
        width={400}
        styles={{ content: { padding: 0, borderRadius: 28, overflow: "hidden" }, mask: { backdropFilter: "blur(4px)" } }}
      >
        <div className="bg-white p-6 text-center">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-[#402542]">QR Code</p>
            <button type="button" onClick={() => setIsQrExpanded(false)} className="text-[#a88a9f] hover:text-[#ea4f93] transition">
              <X size={18} />
            </button>
          </div>
          {selectedBookingForDrawer && (
            <img
              crossOrigin="anonymous"
              src={getQrCodeSrc(selectedBookingForDrawer.qrCode)}
              alt="QR Code"
              className="max-w-[280px] mx-auto rounded-xl"
              referrerPolicy="no-referrer"
              onError={(e) => { console.error("QR Code failed to load"); e.target.style.display = "none"; }}
            />
          )}
        </div>
      </Modal>
    </section>
  );
}
