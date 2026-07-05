import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
  Calendar,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Maximize2,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Spin, Alert, DatePicker, Dropdown, Drawer, Modal } from "antd";
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
import { loadAuthSession } from "../../../core/auth/model/authStorage";

const roleConfig = BOOKING_ROLE_CONFIG[ROLES.manager];
const getSalonId = () => {
  const session = loadAuthSession();
  const salonId = session?.user?.salonId || session?.salonId;
  if (!salonId) {
    throw new Error("Salon ID is not available in the current account profile.");
  }
  return salonId;
};
const BOOKING_PAGE_SIZE = 10;
const API_BOOKING_PAGE_SIZE = 10;

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-2xl border border-[#f0d9e8] bg-white p-6 shadow-[0_4px_16px_rgba(236,72,153,0.08)] transition-shadow duration-200 hover:shadow-[0_6px_24px_rgba(236,72,153,0.12)] md:p-7 ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-[#2d1b35]">{children}</h2>
      {subtitle ? <p className="mt-2 text-sm text-[#a88a9f]">{subtitle}</p> : null}
    </div>
  );
}

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
  subtitle: PropTypes.string,
};

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#a88a9f]">{label}</p>
      <div className="mt-2 text-sm font-medium text-[#2d1b35] break-all">{children}</div>
    </div>
  );
}

InfoItem.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

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
  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return "N/A";
  }

  return new Date(2000, 0, 1, hours, minutes, seconds).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimeRange(startTime, durationMinutes, fallbackDateTime) {
  const formattedStart = formatTime(startTime, fallbackDateTime);
  if (!durationMinutes || formattedStart === "N/A") {
    return formattedStart;
  }

  // Parse start time
  const normalizedTime = String(startTime || "").trim();
  let rawTime = normalizedTime
    || String(fallbackDateTime || "")
      .trim()
      .split("T")[1]
      ?.replace("Z", "")
      ?.split(".")[0];

  if (!rawTime) {
    return formattedStart;
  }

  let [hours, minutes = 0] = rawTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return formattedStart;
  }

  // Calculate end time
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
    currency: 'VND'
  }).format(amount);
}

function formatDuration(totalMinutes) {
  if (!totalMinutes) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

function getDrawerStatusTone(status) {
  switch (status) {
    case "Checked In":
    case "CheckedIn":
      return "bg-[#e7ecff] text-[#4755b8]";
    case "In Progress":
    case "InProgress":
      return "bg-[#f3ebff] text-[#7e4fe6]";
    case "Pending":
      return "bg-[#fff0dd] text-[#db8520]";
    case "Confirmed":
    case "Approved":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Reschedule Req":
    case "RescheduleReq":
      return "bg-[#fff0dd] text-[#db8520]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
  }
}

function getStatusTone(status) {
  switch (status) {
    case "CheckedIn":
    case "Checked In":
      return "bg-[#4755b8] text-white border-[#4755b8]";
    case "InProgress":
    case "In Progress":
      return "bg-[#7e4fe6] text-white border-[#7e4fe6]";
    case "Pending":
      return "bg-[#db8520] text-white border-[#db8520]";
    case "Confirmed":
    case "Approved":
      return "bg-[#2fa25f] text-white border-[#2fa25f]";
    case "Completed":
    case "ServiceCompleted":
      return "bg-[#2fa25f] text-white border-[#2fa25f]";
    case "Rejected":
      return "bg-[#e1447f] text-white border-[#e1447f]";
    case "RescheduleReq":
    case "Reschedule Req":
      return "bg-[#db8520] text-white border-[#db8520]";
    default:
      return "bg-[#6b7280] text-white border-[#6b7280]";
  }
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

const scheduleStaff = [
  {
    name: "Luna Park",
    tone: "bg-[#e7ecff] border-[#c7d7ff] text-[#4755b8]",
    blocks: [{ start: 9, end: 10.5, label: "Sarah Chen", service: "Gel Full Set" }],
  },
  {
    name: "Aria Nguyen",
    tone: "bg-[#ffe7ef] border-[#f8c4d8] text-[#ea4f93]",
    blocks: [
      { start: 9.5, end: 11, label: "Emily Wong", service: "Nail Art" },
      { start: 11.5, end: 12.5, label: "Priya Nair", service: "Gel Pedicure", alert: true },
    ],
  },
  {
    name: "Chloe Davis",
    tone: "bg-[#eaf9ee] border-[#b8e6cc] text-[#2fa25f]",
    blocks: [{ start: 10, end: 10.75, label: "Jessica Tan", service: "Gel Manicure" }],
  },
  {
    name: "Mel Santos",
    tone: "bg-[#fff0dd] border-[#f5d0a0] text-[#db8520]",
    blocks: [{ start: 10.5, end: 11.75, label: "Grace Teo", service: "Acrylic Set" }],
  },
];

const smartSlots = [
  {
    time: "12:00 PM",
    date: "Sat, Jul 12",
    tag: "Easy",
    tagTone: "bg-[#eaf9ee] text-[#2fa25f]",
    artist: "Luna Park",
    duration: "60 min",
    service: "Gel Manicure",
    complexity: "Standard service",
    avatarTone: "from-[#d8c4ff] to-[#8b5cf6]",
  },
  {
    time: "1:30 PM",
    date: "Sat, Jul 12",
    tag: "Medium",
    tagTone: "bg-[#fff0dd] text-[#db8520]",
    artist: "Aria Nguyen",
    duration: "90 min",
    service: "Nail Art Design",
    complexity: "Custom design",
    avatarTone: "from-[#ffc5de] to-[#ea4f93]",
  },
  {
    time: "3:00 PM",
    date: "Sat, Jul 12",
    tag: "Complex",
    tagTone: "bg-[#ffe7ef] text-[#ea4f93]",
    artist: "Chloe Davis",
    duration: "120 min",
    service: "Acrylic Full Set",
    complexity: "Full set + art",
    avatarTone: "from-[#b8f0d8] to-[#2fc5a9]",
  },
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
  { name: "Kim Nguyen", service: "Gel Manicure", time: "ASAP · Morning" },
  { name: "Lisa Hoang", service: "Nail Art", time: "After 2 PM" },
  { name: "Anna Tran", service: "Pedicure", time: "Any slot today" },
];

const bookingConflicts = [
  {
    title: "Double Booking",
    time: "11 AM · Aria Nguyen",
    action: "Resolve Now",
  },
  {
    title: "Unassigned Booking",
    time: "2 PM · No staff assigned",
    action: "Assign staff",
  },
  {
    title: "Deposit Missing",
    time: "10 AM · Jessica Tan",
    action: "Resolve Now",
  },
];

const scheduleHours = [9, 10, 11, 12, 13, 14, 15, 16, 17];

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-base font-bold text-[#2d1b35]">{title}</h3>
      {subtitle ? <p className="mt-1.5 text-xs text-[#a88a9f]">{subtitle}</p> : null}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.iconClassName} shadow-lg`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold leading-none text-[#2d1b35]">{item.value}</p>
      <p className="mt-2 text-sm font-medium text-[#8b7382]">{item.label}</p>
      <p className={`mt-2 text-xs font-medium ${item.noteClassName}`}>{item.note}</p>
    </Card>
  );
}

MetricCard.propTypes = {
  item: PropTypes.shape({
    icon: PropTypes.func.isRequired,
    iconClassName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    note: PropTypes.string.isRequired,
    noteClassName: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }).isRequired,
};

function formatStatusDisplay(status) {
  if (status === "CheckedIn") return "Checked In";
  if (status === "InProgress") return "In Progress";
  if (status === "RescheduleReq") return "Reschedule Req";
  if (status === "ServiceCompleted") return "Completed";
  return status;
}

function matchesFilter(status, filter) {
  if (filter === "All") return true;
  if (filter === "Reschedule") return status === "RescheduleReq" || status === "Reschedule Req";
  if (filter === "Completed") return status === "Completed" || status === "ServiceCompleted";
  return status === filter;
}

function formatHourLabel(hour) {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

function parseDatePart(dateString) {
  const normalized = String(dateString || "").trim();
  if (!normalized) return null;

  const datePart = normalized.includes("T") ? normalized.split("T")[0] : normalized;
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function parseTimePart(timeString) {
  const normalized = String(timeString || "").trim();
  if (!normalized) return null;

  const rawTime = normalized.includes("T")
    ? normalized.split("T")[1]?.replace("Z", "")
    : normalized;
  const [hours, minutes = 0, seconds = 0] = String(rawTime || "")
    .split(".")[0]
    .split(":")
    .map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return null;
  }

  return new Date(2000, 0, 1, hours, minutes, seconds);
}

function getArtistDisplayName(artist) {
  const name = artist?.nailArtistName || artist?.artistName || artist?.fullName || artist?.name;
  return name === "Chưa chỉ định" ? "Unassigned" : name || "Unassigned";
}

function mapBookingForDrawer(rawBooking) {
  const artistName = getArtistDisplayName(rawBooking);
  const artistId =
    rawBooking.staffId ||
    rawBooking.nailArtistId ||
    rawBooking.staffArtistId ||
    rawBooking.artistId ||
    null;

  return {
    ...rawBooking,
    id: rawBooking.bookingId || rawBooking.id,
    bookingId: rawBooking.bookingId || rawBooking.id,
    date: formatDate(rawBooking.bookingDate || rawBooking.createdAt),
    time: formatTime(rawBooking.startTime, rawBooking.bookingDate || rawBooking.createdAt),
    customerName: rawBooking.customerName || (rawBooking.customer ? `${rawBooking.customer.firstName} ${rawBooking.customer.lastName}` : "Unknown Customer"),
    customerId: rawBooking.customerId,
    phone: rawBooking.customerPhone || rawBooking.phone || (rawBooking.customer ? rawBooking.customer.phone : ""),
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

function normalizeStatusKey(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "");
}

function isFinalStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  return s.includes("cancel") || s.includes("reject") || s.includes("complete") || s.includes("confirmed") || s.includes("approved");
}

function mapApiBookingToUiFormat(apiBooking) {
  console.log("Mapping API booking:", apiBooking);

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
    phone: apiBooking.customerPhone || apiBooking.phone || (apiBooking.customer ? apiBooking.customer.phone : ""),
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

const SESSION_STORAGE_KEY = "managerBookingListPageState";
const SCROLL_POSITION_KEY = "managerBookingListScrollPos";

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

  const getStoredState = () => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          query: parsed.query || "",
          activeFilter: parsed.activeFilter || "All",
          selectedDate: parsed.selectedDate ? dayjs(parsed.selectedDate).isValid() ? dayjs(parsed.selectedDate) : null : null,
          currentPage: parsed.currentPage || 1
        };
      }
    } catch (e) {
      console.error("Failed to parse stored state:", e);
    }
    return { query: "", activeFilter: "All", selectedDate: null, currentPage: 1 };
  };

  const initialState = getStoredState();

  const [query, setQuery] = useState(initialState.query);
  const [activeFilter, setActiveFilter] = useState(initialState.activeFilter);
  const [selectedDate, setSelectedDate] = useState(initialState.selectedDate);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(initialState.currentPage);
  const [filteredPageSize] = useState(10);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        query,
        activeFilter,
        selectedDate: selectedDate ? selectedDate.toISOString() : null,
        currentPage
      }));
    } catch (e) {
      console.error("Failed to save state to sessionStorage:", e);
    }
  }, [query, activeFilter, selectedDate, currentPage]);

  // Assign Artist modal
  const [isAssignArtistModalOpen, setIsAssignArtistModalOpen] = useState(false);
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState(null);

  // Confirm / Cancel / Reject modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedBookingForAction, setSelectedBookingForAction] = useState(null);
  const [isQrExpanded, setIsQrExpanded] = useState(false);

  // Function to open drawer and load booking details
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
          console.warn("Failed to load customer details for drawer:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load booking for drawer:", err);
    } finally {
      setIsLoadingDrawer(false);
    }
  }, []);

  const handleViewBooking = useCallback((bookingId) => {
    handleOpenDrawer(bookingId);
  }, [handleOpenDrawer]);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const salonId = getSalonId();
      const firstPageResult = await fetchBookingsBySalonId(salonId, {
        pageNumber: 1,
        pageSize: API_BOOKING_PAGE_SIZE,
      });
      console.log("loadBookings first page result:", firstPageResult);

      let apiBookings = Array.isArray(firstPageResult?.items) ? [...firstPageResult.items] : [];
      const totalPages = Math.max(1, Number(firstPageResult?.totalPages || 1));

      if (totalPages > 1) {
        const remainingPageRequests = [];

        for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
          remainingPageRequests.push(
            fetchBookingsBySalonId(salonId, {
              pageNumber,
              pageSize: API_BOOKING_PAGE_SIZE,
            }),
          );
        }

        const remainingResults = await Promise.all(remainingPageRequests);
        remainingResults.forEach((pageResult) => {
          if (Array.isArray(pageResult?.items)) {
            apiBookings = apiBookings.concat(pageResult.items);
          }
        });
      }

      const uiBookings = apiBookings.map(mapApiBookingToUiFormat);
      console.log("loadBookings all uiBookings loaded:", uiBookings.length, "bookings");
      setBookings(uiBookings);
      setHasLoadedOnce(true);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setError(err.message || "Failed to load bookings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bookings.filter((appointment) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [appointment.customer, appointment.phone, appointment.artist, appointment.time]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      let matchesDate = true;
      if (selectedDate) {
        const bookingDate = dayjs(appointment.bookingDate || appointment.createdAt);
        matchesDate = bookingDate.isSame(selectedDate, "day");
      }

      const matchesFilterResult = matchesFilter(appointment.status, activeFilter);
      console.log("Filter check for appointment:", {
        appointment,
        matchesQuery,
        matchesDate,
        matchesFilterResult,
        activeFilter
      });

      return matchesQuery && matchesFilterResult && matchesDate;
    });
  }, [activeFilter, query, bookings, selectedDate]);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * filteredPageSize;
    const endIndex = startIndex + filteredPageSize;
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, currentPage, filteredPageSize]);

  const filteredTotalPages = useMemo(() => {
    const pages = Math.max(1, Math.ceil(filteredAppointments.length / filteredPageSize));
    return pages;
  }, [filteredAppointments.length, filteredPageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, activeFilter, selectedDate]);

  const handlePageChange = useCallback((newPage) => {
    console.log("handlePageChange called with:", newPage);
    setCurrentPage(newPage);
  }, []);

  // Log current pagination state
  console.log("ManagerBookingListPage pagination state:", {
    currentPage,
    filteredTotalPages,
    filteredAppointmentsLength: filteredAppointments.length,
    paginatedAppointmentsLength: paginatedAppointments.length,
    filteredPageSize
  });

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const computedConflicts = useMemo(() => {
    const list = [];

    // Group bookings by date
    const bookingsByDate = {};
    bookings.forEach(b => {
      if (!b.bookingDate) return;
      const dateKey = b.bookingDate.split("T")[0];
      if (!bookingsByDate[dateKey]) bookingsByDate[dateKey] = [];
      bookingsByDate[dateKey].push(b);
    });

    Object.keys(bookingsByDate).forEach(dateKey => {
      const dayBookings = bookingsByDate[dateKey];

      // 1. Check for excessive bookings per customer (more than 2 bookings on the same day)
      const customerCounts = {};
      dayBookings.forEach(b => {
        const key = b.customerId || b.customer;
        if (!key) return;
        customerCounts[key] = (customerCounts[key] || 0) + 1;
      });

      // 2. Check for staff double booking overlap
      const withTimes = dayBookings.map(b => {
        const parsedTime = parseTimePart(b.startTime) || parseTimePart(b.bookingDate);
        const startMin = parsedTime ? parsedTime.getHours() * 60 + parsedTime.getMinutes() : null;
        const duration = Number(b.totalDuration || 60);
        return {
          ...b,
          startMin,
          endMin: startMin !== null ? startMin + duration : null
        };
      }).filter(b => b.startMin !== null && !isFinalStatus(b.status));

      // Compare pairs for staff overlap
      for (let i = 0; i < withTimes.length; i++) {
        for (let j = i + 1; j < withTimes.length; j++) {
          const b1 = withTimes[i];
          const b2 = withTimes[j];

          if (b1.nailArtistId && b2.nailArtistId && b1.nailArtistId === b2.nailArtistId) {
            if (b1.startMin < b2.endMin && b2.startMin < b1.endMin) {
              list.push({
                type: "DoubleBooking",
                title: "Staff Overlap",
                description: `${b1.artist} double-booked at ${b1.time} & ${b2.time}`,
                time: `${b1.date} · ${b1.time}`,
                bookingId: b1.id,
                severity: "error"
              });
            }
          }
        }
      }

      // Add customer multi-booking warnings
      dayBookings.forEach(b => {
        const key = b.customerId || b.customer;
        if (key && customerCounts[key] > 2) {
          const exists = list.some(item => item.type === "MultiBooking" && item.customerKey === key && item.date === dateKey);
          if (!exists) {
            list.push({
              type: "MultiBooking",
              customerKey: key,
              date: dateKey,
              title: "Excessive Daily Bookings",
              description: `${b.customer} has ${customerCounts[key]} appointments on ${b.date}`,
              time: `${b.date} · ${customerCounts[key]} slots`,
              bookingId: b.id,
              severity: "warning"
            });
          }
        }
      });
    });

    // Identify unassigned bookings
    bookings.forEach(b => {
      if (!isFinalStatus(b.status) && !b.nailArtistId) {
        list.push({
          type: "Unassigned",
          title: "Unassigned Booking",
          description: `No artist assigned for ${b.customer} at ${b.time}`,
          time: `${b.date} · ${b.time}`,
          bookingId: b.id,
          severity: "info"
        });
      }
    });

    return list.slice(0, 10);
  }, [bookings]);

  useEffect(() => {
    Promise.resolve().then(() => loadBookings());
  }, [loadBookings]);

  const summaryStats = useMemo(() => {
    const pending = bookings.filter(b => b.status === "Pending").length;
    const confirmed = bookings.filter(b => b.status === "Confirmed").length;
    const checkedIn = bookings.filter(b => b.status === "CheckedIn" || b.status === "Checked In").length;
    const completed = bookings.filter(b => b.status === "Completed" || b.status === "ServiceCompleted").length;

    return [
      {
        label: "Pending Bookings",
        value: pending.toString(),
        note: "awaiting confirmation",
        icon: Clock3,
        iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
        noteClassName: "text-[#c08aa4]",
      },
      {
        label: "Confirmed Bookings",
        value: confirmed.toString(),
        note: "+5 since yesterday",
        icon: CheckCircle2,
        iconClassName: "bg-[#eaf9ee] text-[#2fa25f]",
        noteClassName: "text-[#2fa25f]",
      },
      {
        label: "Checked-in Customers",
        value: checkedIn.toString(),
        note: "+2 this hour",
        icon: UserCheck,
        iconClassName: "bg-[#e7ecff] text-[#4755b8]",
        noteClassName: "text-[#2fa25f]",
      },
      {
        label: "Completed Bookings",
        value: completed.toString(),
        note: "services finished",
        icon: CheckCircle2,
        iconClassName: "bg-[#eaf9ee] text-[#2fa25f]",
        noteClassName: "text-[#2fa25f]",
      },
    ];
  }, [bookings]);

  return (
    <section className="flex min-h-full flex-col gap-5">
      <Card className="overflow-hidden border-none bg-gradient-to-br from-[#fff3f8] via-[#fffafb] to-[#fff5fb] p-0 shadow-lg">
        <div className="flex flex-col gap-6 p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-xl">
                <Calendar size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#2d1b35]">Branch Bookings</h1>
                <p className="text-sm text-[#a88a9f]">Track appointments, assign artists, and monitor activity</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#8b7382]">
              Manage your salon&apos;s daily operations with real-time booking management, staff scheduling, and seamless customer tracking.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#f0d9e8] bg-white px-4 py-2.5 text-xs font-semibold text-[#ea4f93] shadow-md hover:shadow-lg hover:border-[#ea4f93] transition duration-200"
            >
              <Download size={16} />
              Export
            </button>
            <Link
              to={roleConfig.createRoute}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ea4f93] to-[#ff8ebb] px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:shadow-xl transition duration-200"
            >
              <UserPlus size={16} />
              New Booking
            </Link>
          </div>
        </div>
      </Card>

      {flashMessage ? (
        <div className="rounded-[16px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f]">
          {flashMessage}
        </div>
      ) : null}

      {error ? (
        <Alert
          message="Error Loading Bookings"
          description={error}
          type="error"
          showIcon
        />
      ) : null}

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spin size="large" />
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryStats.map((item) => (
            <MetricCard key={item.label} item={item} />
          ))}
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_300px]">
          <div className="space-y-4">
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col gap-4 border-b border-[#f0d9e8] bg-gradient-to-b from-[#fff9fb] to-[#fffafb] p-6 lg:flex-row lg:items-center lg:justify-between">
                <SectionHeading
                  title="Today's Appointments"
                  subtitle={`${filteredAppointments.length} booking${filteredAppointments.length !== 1 ? 's' : ''}`}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap gap-2">
                    <Dropdown
                      menu={{
                        items: appointmentFilters.map((filter) => ({
                          key: filter.value,
                          label: (
                            <span className={activeFilter === filter.value ? "font-semibold text-[#ea4f93]" : "text-[#5c4559]"}>
                              {filter.label}
                            </span>
                          ),
                          onClick: () => setActiveFilter(filter.value),
                        })),
                      }}
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-[#f0d9e8] bg-white px-4 py-2.5 text-xs font-semibold text-[#5c4559] transition hover:border-[#ea4f93] hover:bg-[#fff7fb]"
                      >
                        <span>{appointmentFilters.find((f) => f.value === activeFilter)?.label || activeFilter}</span>
                        <ChevronDown size={14} />
                      </button>
                    </Dropdown>
                    <DatePicker
                      value={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      placeholder="Select date"
                      className="h-10 rounded-full border border-[#f0d9e8] bg-white text-xs text-[#5c4559] outline-none transition placeholder:text-[#c8b0bf] focus:border-[#ea4f93] focus:ring-2 focus:ring-[#ea4f93]/10"
                      suffixIcon={<Calendar size={14} className="text-[#a88a9f]" />}
                    />
                  </div>
                  <label className="relative block min-w-[220px]">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a88a9f]"
                    />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search customer, artist..."
                      className="h-10 w-full rounded-full border border-[#f0d9e8] bg-white pl-9 pr-4 text-xs text-[#5c4559] outline-none transition placeholder:text-[#c8b0bf] focus:border-[#ea4f93] focus:ring-2 focus:ring-[#ea4f93]/10"
                    />
                  </label>
                </div>
              </div>

              {/* ── TABLE: fixed layout with colgroup for perfect header alignment ── */}
              <div ref={tableContainerRef} className="overflow-x-auto">
                <table className="w-full table-fixed text-left">
                  <colgroup>
                    {/* Time */}
                    <col className="w-[100px]" />
                    {/* Customer */}
                    <col className="w-[140px]" />
                    {/* Staff Artist */}
                    <col className="w-[120px]" />
                    {/* Status */}
                    <col className="w-[110px]" />
                    {/* Action */}
                    <col className="w-[100px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#f0d9e8] bg-[#fff8fb] text-xs uppercase tracking-wide text-[#a88a9f] font-semibold">
                      <th className="px-3 py-2.5 font-semibold text-left">Time</th>
                      <th className="px-3 py-2.5 font-semibold text-left">Customer</th>
                      <th className="px-3 py-2.5 font-semibold text-left">Artist</th>
                      <th className="px-3 py-2.5 font-semibold text-left">Status</th>
                      <th className="px-3 py-2.5 font-semibold text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAppointments.map((row) => (
                      <tr
                        key={row.id}
                        className="group relative border-b border-[#f0d9e8] transition-all duration-300 hover:bg-[#fff9fb] cursor-pointer last:border-b-0"
                        onClick={() => handleOpenDrawer(row.id)}
                      >
                        {/* Time */}
                        <td className="px-3 py-2 align-middle">
                          <p className="text-xs font-semibold text-[#2d1b35] truncate">{row.time}</p>
                          <p className="text-[10px] text-[#a88a9f]">{row.duration}</p>
                        </td>

                        {/* Customer */}
                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${row.avatarTone} text-[10px] font-bold text-white shadow-sm`}
                            >
                              {row.initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-bold text-[#402542]">{row.customer}</p>
                                {(() => {
                                  const customerConflicts = computedConflicts.filter(c => c.bookingId === row.id && c.type === "MultiBooking");
                                  if (customerConflicts.length > 0) {
                                    return (
                                      <span className="rounded bg-[#ffeef2] px-1.5 py-0.5 text-[9px] font-bold text-[#e1447f] border border-[#fccad6]">
                                        Spam Alert
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <p className="text-[11px] text-[#c08aa4]">{row.phone}</p>
                            </div>
                          </div>
                        </td>

                        {/* Staff Artist */}
                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center gap-1 min-w-0">
                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${row.artistTone} text-[8px] font-bold text-white shadow-sm`}
                            >
                              {row.artist
                                .split(" ")
                                .map((part) => part[0])
                                .join("")}
                            </div>
                            <span className="text-xs text-[#8b7382] truncate">{row.artist}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2 align-middle">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${getStatusTone(row.status)}`}
                          >
                            {(row.status === "InProgress" || row.status === "In Progress") && (
                              <Loader2 size={11} className="animate-spin" />
                            )}
                            {formatStatusDisplay(row.status)}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-3 py-2 align-middle" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleViewBooking(row.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#fff0f8] text-[#ea4f93] hover:bg-[#ea4f93] hover:text-white transition text-center"
                              title="View"
                            >
                              <Eye size={12} />
                            </button>
                            {!(
                              (row.nailArtistId || row.staffId || row.staffArtistId || row.artistId) &&
                              (row.status === "CheckedIn" || row.status === "Checked In")
                            ) && (!isFinalStatus(row.status) || row.status === "Approved") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookingForAssign(row);
                                    setIsAssignArtistModalOpen(true);
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e7ecff] text-[#4755b8] hover:bg-[#4755b8] hover:text-white transition"
                                  title="Assign"
                                >
                                  <UserCheck size={12} />
                                </button>
                              )}

                            {!isFinalStatus(row.status) && !(row.status === "CheckedIn" || row.status === "Checked In" || row.status === "InProgress" || row.status === "In Progress") && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookingForAction(row);
                                    setIsConfirmModalOpen(true);
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf9ee] text-[#2fa25f] hover:bg-[#2fa25f] hover:text-white transition"
                                  title="Confirm"
                                >
                                  <CheckCircle2 size={12} />                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookingForAction(row);
                                    setIsCancelModalOpen(true);
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#fff0dd] text-[#db8520] hover:bg-[#db8520] hover:text-white transition"
                                  title="Cancel"
                                >
                                  <XCircle size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredAppointments.length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#8a7082]">
                    No appointments matched the current filters.
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end p-4 border-t border-[#f0d9e8] bg-gradient-to-b from-[#fffafb] to-white">
                <Pagination
                  currentPage={currentPage}
                  totalPages={filteredTotalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </Card>

            {/* Assign Artist Modal */}
            {selectedBookingForAssign && (
              <AssignArtistModal
                open={isAssignArtistModalOpen}
                onClose={() => {
                  setIsAssignArtistModalOpen(false);
                  setSelectedBookingForAssign(null);
                }}
                bookingId={String(selectedBookingForAssign.id)}
                salonId={
                  selectedBookingForAssign.salonId
                    ? String(selectedBookingForAssign.salonId)
                    : getSalonId()
                }
                booking={selectedBookingForAssign}
                onSuccess={() => loadBookings()}
              />
            )}

            {/* Confirm / Cancel / Reject Modals */}
            <ConfirmBookingModal
              open={isConfirmModalOpen}
              onClose={() => {
                setIsConfirmModalOpen(false);
                setSelectedBookingForAction(null);
              }}
              bookingId={selectedBookingForAction?.id ? String(selectedBookingForAction.id) : ""}
              onSuccess={() => loadBookings()}
            />
            <CancelBookingModal
              open={isCancelModalOpen}
              onClose={() => {
                setIsCancelModalOpen(false);
                setSelectedBookingForAction(null);
              }}
              bookingId={selectedBookingForAction?.id ? String(selectedBookingForAction.id) : ""}
              onSuccess={() => loadBookings()}
            />
            <RejectBookingModal
              open={isRejectModalOpen}
              onClose={() => {
                setIsRejectModalOpen(false);
                setSelectedBookingForAction(null);
              }}
              bookingId={selectedBookingForAction?.id ? String(selectedBookingForAction.id) : ""}
              onSuccess={() => loadBookings()}
            />

            {/* Booking Detail Drawer */}
            <Drawer
              title={null}
              open={isDrawerOpen}
              onClose={() => {
                setIsDrawerOpen(false);
                setSelectedBookingForDrawer(null);
              }}
              width={480}
              styles={{
                body: { padding: 0 },
                content: { background: "#fafafa" }
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
                <div className="bg-[#fafafa] h-full flex flex-col">
                  {/* Drawer Header */}
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-[#ea4f93] via-[#ff7ba4] to-[#ffaab6] shadow-md p-6 rounded-b-3xl">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/85">Booking Details</p>
                        <h2 className="text-xl font-bold text-white mt-1">#{String(selectedBookingForDrawer.bookingId || selectedBookingForDrawer.id).slice(0, 8)}</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setSelectedBookingForDrawer(null);
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 flex-shrink-0"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="mt-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getDrawerStatusTone(selectedBookingForDrawer.status)}`}>
                        {(selectedBookingForDrawer.status === "InProgress" || selectedBookingForDrawer.status === "In Progress") && (
                          <Loader2 size={13} className="animate-spin" />
                        )}
                        {formatStatusDisplay(selectedBookingForDrawer.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Customer Information */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f0d9e8]">
                      <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Customer Information</h3>
                      <div className="space-y-4">
                        <InfoItem label="Customer Name">
                          {selectedCustomerForDrawer
                            ? `${selectedCustomerForDrawer.firstName || ''} ${selectedCustomerForDrawer.lastName || ''}`.trim()
                            : selectedBookingForDrawer.customerName}
                        </InfoItem>
                        {(selectedBookingForDrawer.phone || selectedCustomerForDrawer?.phone) && (
                          <InfoItem label="Phone Number">
                            {selectedCustomerForDrawer?.phone || selectedBookingForDrawer.phone}
                          </InfoItem>
                        )}
                        {(selectedBookingForDrawer.email || selectedCustomerForDrawer?.email) && (
                          <InfoItem label="Email">
                            {selectedCustomerForDrawer?.email || selectedBookingForDrawer.email}
                          </InfoItem>
                        )}
                      </div>
                    </div>

                    {/* Service Information */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f0d9e8]">
                      <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Service Information</h3>
                      <div className="space-y-4">
                        <InfoItem label="Service">{selectedBookingForDrawer.serviceName}</InfoItem>
                        <InfoItem label="Nail Artist">{selectedBookingForDrawer.artistName}</InfoItem>
                        <div className="grid grid-cols-2 gap-3">
                          <InfoItem label="Date">{selectedBookingForDrawer.date}</InfoItem>
                          <InfoItem label="Time">{selectedBookingForDrawer.time}</InfoItem>
                        </div>
                        {selectedBookingForDrawer.totalDuration && (
                          <InfoItem label="Estimated Duration">{formatDuration(selectedBookingForDrawer.totalDuration)}</InfoItem>
                        )}
                      </div>
                    </div>

                    {/* Booking Items */}
                    {selectedBookingForDrawer.bookingItems && selectedBookingForDrawer.bookingItems.length > 0 && (
                      <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f0d9e8]">
                        <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Service Details</h3>
                        <div className="space-y-3">
                          {selectedBookingForDrawer.bookingItems.map((item, idx) => (
                            <div key={idx} className="rounded-xl border border-[#f0d9e8] bg-gradient-to-br from-[#fff9fb] to-[#fffafb] p-4 hover:shadow-md transition-shadow">
                              <p className="text-sm font-bold text-[#402542]">{item.serviceName || "Nail Service"}</p>
                              {item.nailVariantName && (
                                <p className="mt-1 text-xs text-[#c08aa4]">Variant: {item.nailVariantName}</p>
                              )}
                              {item.customerNailName && (
                                <p className="text-xs text-[#c08aa4]">Nail Set: {item.customerNailName}</p>
                              )}
                              <div className="mt-3 grid grid-cols-3 gap-2">
                                <InfoItem label="Quantity">{item.quantity !== undefined ? item.quantity : "-"}</InfoItem>
                                <InfoItem label="Duration">{item.duration !== undefined ? formatDuration(item.duration) : "-"}</InfoItem>
                                <InfoItem label="Price">{item.price !== undefined ? formatVND(item.price) : "-"}</InfoItem>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payment Information */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f0d9e8]">
                      <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Payment & Codes</h3>
                      <div className="space-y-4">
                        <InfoItem label="Deposit Status">
                          <span className={selectedBookingForDrawer.depositTone}>{selectedBookingForDrawer.deposit}</span>
                        </InfoItem>
                        <InfoItem label="Total Amount">{formatVND(selectedBookingForDrawer.totalPrice)}</InfoItem>

                        {(selectedBookingForDrawer.qrCode || selectedBookingForDrawer.qtCode) && (
                          <div className="pt-4 border-t border-[#f0d9e8]">
                            <p className="text-xs font-semibold uppercase tracking-widest text-[#a88a9f] mb-3">Confirmation Codes</p>
                            {selectedBookingForDrawer.qrCode && (
                              <div
                                className="rounded-xl border border-[#f0d9e8] bg-gradient-to-br from-white to-[#fffafb] p-4 mb-3 cursor-pointer hover:border-[#ea4f93] hover:shadow-md transition-all"
                                onClick={() => setIsQrExpanded(true)}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-xs font-semibold uppercase tracking-widest text-[#a88a9f]">QR Code</p>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsQrExpanded(true); }}
                                    className="text-[#ea4f93] hover:text-[#c9366b] transition"
                                  >
                                    <Maximize2 size={16} />
                                  </button>
                                </div>
                                <img crossOrigin="anonymous"
                                  src={
                                    typeof selectedBookingForDrawer.qrCode === "string" && selectedBookingForDrawer.qrCode.startsWith("data:")
                                      ? selectedBookingForDrawer.qrCode
                                      : typeof selectedBookingForDrawer.qrCode === "string" && selectedBookingForDrawer.qrCode.length > 100
                                        ? `data:image/png;base64,${selectedBookingForDrawer.qrCode}`
                                        : selectedBookingForDrawer.qrCode
                                  }
                                  alt="QR Code"
                                  className="max-w-[120px] mx-auto rounded-xl"
                                  onError={(e) => {
                                    console.error("QR Code image failed to load:", selectedBookingForDrawer.qrCode);
                                    e.target.style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                            {selectedBookingForDrawer.qtCode && (
                              <div className="rounded-xl border border-[#f0d9e8] bg-gradient-to-br from-white to-[#fffafb] p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#a88a9f]">QT Code</p>
                                <p className="break-all text-sm font-medium text-[#2d1b35]">{selectedBookingForDrawer.qtCode}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Check-in Image */}
                    {selectedBookingForDrawer.checkInImageUrl && (
                      <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#f0d9e8]">
                        <h3 className="text-sm font-bold text-[#2d1b35] mb-4">Check-in Photo</h3>
                        <div className="overflow-hidden rounded-xl border border-[#f0d9e8] bg-gradient-to-br from-white to-[#fffafb] p-2">
                          <img crossOrigin="anonymous" src={selectedBookingForDrawer.checkInImageUrl} alt="Check-in" className="max-w-full rounded-lg w-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </Drawer>

            {/* QR Code Expand Modal */}
            <Modal
              open={isQrExpanded}
              onCancel={() => setIsQrExpanded(false)}
              footer={null}
              centered
              width={400}
              styles={{
                content: { padding: 0, borderRadius: 24, overflow: "hidden" },
                mask: { backdropFilter: "blur(4px)" },
              }}
            >
              <div className="bg-white p-6 text-center">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-bold text-[#402542]">QR Code</p>
                  <button
                    type="button"
                    onClick={() => setIsQrExpanded(false)}
                    className="text-[#c08aa4] hover:text-[#ea4f93] transition"
                  >
                    <X size={18} />
                  </button>
                </div>
                {selectedBookingForDrawer && (
                  <img crossOrigin="anonymous"
                    src={
                      typeof selectedBookingForDrawer.qrCode === "string" && selectedBookingForDrawer.qrCode.startsWith("data:")
                        ? selectedBookingForDrawer.qrCode
                        : typeof selectedBookingForDrawer.qrCode === "string" && selectedBookingForDrawer.qrCode.length > 100
                          ? `data:image/png;base64,${selectedBookingForDrawer.qrCode}`
                          : selectedBookingForDrawer.qrCode
                    }
                    alt="QR Code"
                    className="max-w-[280px] mx-auto rounded-xl"
                  />
                )}
              </div>
            </Modal>

            <Card className="overflow-hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SectionHeading title="Staff Schedule - Day View" />
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-full border border-[#f4c1d8] bg-[#fff7fb] p-0.5">
                    {["Day", "Week", "Month"].map((view, index) => (
                      <button
                        key={view}
                        type="button"
                        className={
                          index === 0
                            ? "rounded-full bg-[#ea4f93] px-3 py-1 text-[10px] font-bold text-white"
                            : "rounded-full px-3 py-1 text-[10px] font-bold text-[#c08aa4]"
                        }
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92]"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <span className="px-2 text-xs font-bold text-[#7f6478]">Jul 12, 2025</span>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92]"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-[#f7d7e5] bg-[linear-gradient(180deg,#fffafb_0%,#fff6fa_100%)] p-4">
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-[120px_repeat(9,minmax(0,1fr))] gap-1 border-b border-[#f6dce7] pb-2">
                    <div />
                    {scheduleHours.map((hour) => (
                      <div key={hour} className="text-center text-[10px] font-bold text-[#c08aa4]">
                        {formatHourLabel(hour)}
                      </div>
                    ))}
                  </div>

                  {scheduleStaff.map((staff) => (
                    <div
                      key={staff.name}
                      className="grid grid-cols-[120px_repeat(9,minmax(0,1fr))] gap-1 border-b border-[#fbe7ef] py-3 last:border-b-0"
                    >
                      <p className="pr-2 text-xs font-bold text-[#402542]">{staff.name}</p>
                      <div className="relative col-span-9 grid grid-cols-9 gap-1">
                        {scheduleHours.map((hour) => (
                          <div key={hour} className="h-10 rounded-md bg-[#fffafb] border border-[#f8deea]" />
                        ))}
                        {staff.blocks.map((block) => {
                          const startOffset = ((block.start - 9) / 8) * 100;
                          const width = ((block.end - block.start) / 8) * 100;

                          return (
                            <div
                              key={`${block.label}-${block.start}`}
                              className={`absolute top-0 flex h-10 flex-col justify-center rounded-md border px-2 ${staff.tone} ${block.alert ? "ring-2 ring-[#e1447f]" : ""}`}
                              style={{ left: `${startOffset}%`, width: `${width}%` }}
                            >
                              <p className="truncate text-[10px] font-bold">{block.label}</p>
                              <p className="truncate text-[9px] opacity-80">{block.service}</p>
                              {block.alert ? (
                                <span className="absolute -top-2 right-1 rounded-full bg-[#e1447f] px-1.5 py-0.5 text-[8px] font-bold text-white">
                                  Conflict
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="mb-4 flex items-center gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#ffe7ef] text-[#ea4f93]">
                  <Sparkles size={15} />
                </div>
                <SectionHeading
                  title="Smart Slot Suggestions"
                  subtitle="AI-recommended openings based on staff availability & service type"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {smartSlots.map((slot) => (
                  <div
                    key={slot.time}
                    className="rounded-[18px] border border-[#f8deea] bg-[linear-gradient(180deg,#fffafb_0%,#fff6fa_100%)] p-4 shadow-[0_10px_24px_rgba(236,72,153,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-extrabold text-[#402542]">{slot.time}</p>
                        <p className="text-[11px] text-[#c08aa4]">{slot.date}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${slot.tagTone}`}>
                        {slot.tag}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${slot.avatarTone} text-[9px] font-bold text-white`}
                      >
                        {slot.artist
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#402542]">{slot.artist}</p>
                        <p className="text-[11px] text-[#c08aa4]">{slot.duration}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#7f6478]">{slot.service}</p>
                    <p className="mt-1 text-[11px] text-[#c08aa4]">{slot.complexity}</p>
                    <button
                      type="button"
                      className="mt-4 w-full rounded-full border border-[#f4c1d8] bg-white py-2 text-xs font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
                    >
                      Book This Slot
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
            <Card className="overflow-hidden">
              <SectionHeading title="Today's Capacity" />
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ["31", "Booked"],
                  ["40", "Total Slots"],
                  ["78%", "Filled"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-2 py-3">
                    <p className="text-xl font-extrabold text-[#ea4f93]">{value}</p>
                    <p className="mt-1 text-[10px] text-[#c08aa4]">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-4">
                {capacityPeriods.map((period) => (
                  <div key={period.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-[#7f6478]">{period.label}</span>
                      <span className="font-bold text-[#ea4f93]">{period.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#fbe1ec]">
                      <div
                        className={`h-full rounded-full ${period.tone}`}
                        style={{ width: `${period.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <SectionHeading title="Staff Workload" />
              <div className="mt-4 space-y-4">
                {staffWorkload.map((staff) => (
                  <div key={staff.name} className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${staff.tone} text-[9px] font-bold text-white`}
                    >
                      {staff.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#402542]">{staff.name}</span>
                        <span className="font-bold text-[#ea4f93]">
                          {staff.filled}/{staff.total}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#fbe1ec]">
                        <div
                          className="h-full rounded-full bg-[#ea4f93]"
                          style={{ width: `${(staff.filled / staff.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <SectionHeading title="Waitlist" subtitle="Customers waiting for an opening" />
              <div className="mt-4 space-y-3">
                {waitlist.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-3 py-3"
                  >
                    <p className="text-sm font-bold text-[#402542]">{item.name}</p>
                    <p className="mt-1 text-xs text-[#7a6176]">{item.service}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#ea4f93]">{item.time}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <SectionHeading
                title="Booking Conflicts"
                subtitle={computedConflicts.length > 0 ? `${computedConflicts.length} items need attention` : "System is running smoothly"}
              />
              <div className="mt-4 space-y-3">
                {computedConflicts.length === 0 ? (
                  <div className="rounded-[12px] border border-[#b8e6cc] bg-[#eaf9ee] p-4 text-center">
                    <p className="text-xs font-bold text-[#2fa25f]">✓ All clear</p>
                    <p className="mt-0.5 text-[10px] text-[#71a687]">No booking overlaps or spam detected today.</p>
                  </div>
                ) : (
                  computedConflicts.map((conflict, idx) => (
                    <div
                      key={idx}
                      className={`rounded-[12px] border p-3 ${conflict.severity === "error"
                        ? "border-[#f8c4d8] bg-[#fff0f6]"
                        : conflict.severity === "warning"
                          ? "border-[#fbe3b5] bg-[#fffaf0]"
                          : "border-[#c7d7ff] bg-[#f0f4ff]"
                        }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${conflict.severity === "error"
                          ? "bg-[#e1447f]"
                          : conflict.severity === "warning"
                            ? "bg-[#db8520]"
                            : "bg-[#4755b8]"
                          }`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold ${conflict.severity === "error"
                            ? "text-[#e1447f]"
                            : conflict.severity === "warning"
                              ? "text-[#db8520]"
                              : "text-[#4755b8]"
                            }`}>{conflict.title}</p>
                          <p className="mt-0.5 text-xs font-semibold text-[#5c4559]">{conflict.description}</p>
                          <p className="mt-1 text-[10px] text-[#c08aa4]">{conflict.time}</p>
                          <Link to={roleConfig.getDetailRoute(conflict.bookingId)} className="mt-2 inline-block text-[10px] font-bold text-[#ea4f93] hover:underline">
                            View Booking
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

