import {
  AlertTriangle,
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  DollarSign,
  FileText,
  Play,
  Search,
  SquareCheckBig,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLES } from "../../../../shared/constants/roles";
import { usePagination } from "../../../../shared/hooks/usePagination";
import {
  getStaffBookingDesignStudioRoute,
  getStaffBookingServiceSessionRoute,
} from "../../../../shared/constants/routes";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { StaffBookingNotesModal } from "../components/StaffBookingNotesModal";
import {
  BOOKING_ROLE_CONFIG,
  BOOKING_ROWS,
  BOOKING_STATUS_STYLES,
} from "../../../../shared/bookings/services/mockBookings";
import {
  buildStaffServiceSessionPayload,
  fetchStaffBookings,
  fetchStaffSalonBookings,
  getStaffArtistId,
  getTodayDateParam,
  normalizeStaffBooking,
} from "../services/staffBookingService";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

const STAFF_BOOKING_SCOPES = {
  mine: "mine",
  salon: "salon",
};

const SUMMARY_BY_ROLE = {
  [ROLES.staff]: [
    { label: "Assigned Today", value: "18", note: "+2 vs yesterday", icon: CalendarDays, iconClassName: "bg-[#ffe8f2] text-[#ea4f93]" },
    { label: "Pending", value: "4", note: "Awaiting check-in", icon: Clock3, iconClassName: "bg-[#fff4e8] text-[#f59e0b]" },
    { label: "Completed", value: "53", note: "+7 this week", icon: DollarSign, iconClassName: "bg-[#eaf9ee] text-[#2fa25f]" },
    { label: "Cancelled", value: "3", note: "Low this week", icon: XCircle, iconClassName: "bg-[#fff0f5] text-[#e1447f]" },
    { label: "No-shows", value: "2", note: "Stable", icon: AlertTriangle, iconClassName: "bg-[#f5ecff] text-[#8b5cf6]" },
  ],
};

const SALON_OPTIONS = ["All salons", "Downtown Luxe", "Westside Glow", "Northpark Studio", "Eastview Nails"];
const STATUS_OPTIONS = ["All", "Pending", "Approved", "Rejected", "Cancelled", "CheckedIn", "InProgress", "ServiceCompleted", "Completed", "Repaired", "ReschedulePending", "RescheduleSuggested"];

const BOOKING_PAGE_SIZE = 10;

/* STREAMING_CHUNK: UI Components */
function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-[18px] border border-[#f8d7e5] bg-white p-4 shadow-[0_10px_24px_rgba(236,72,153,0.06)]">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.iconClassName}`}>
        <Icon size={16} />
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#cd98b1]">
        {item.label}
      </p>
      <p className="mt-1 text-[1.9rem] font-extrabold leading-none text-[#3f2741]">
        {item.value}
      </p>
      <p className="mt-2 text-xs font-medium text-[#cf96b0]">{item.note}</p>
    </article>
  );
}

MetricCard.propTypes = {
  item: PropTypes.shape({
    icon: PropTypes.func.isRequired,
    iconClassName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    note: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }).isRequired,
};

function SmallTag({ children, className = "" }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>
      {children}
    </span>
  );
}

SmallTag.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

/* STREAMING_CHUNK: Helper Functions */
function formatDateLabel(dateValue) {
  if (!dateValue) return "";
  const parts = String(dateValue).split("-");
  if (parts.length !== 3) return dateValue;
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

function getBookingDateTimeValue(booking) {
  const normalizedDate = String(
    booking?.bookingDateValue || booking?.bookingDate || booking?.bookingDateTime || "",
  ).trim();
  const normalizedTime = String(booking?.startTimeValue || booking?.bookingTime || "").trim();

  if (!normalizedDate) return Number.MAX_SAFE_INTEGER;

  const baseDate = new Date(normalizedDate);
  if (Number.isNaN(baseDate.getTime())) return Number.MAX_SAFE_INTEGER;

  const [hoursText = "0", minutesText = "0"] = normalizedTime.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  baseDate.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
  return baseDate.getTime();
}

function getInitials(name) {
  if (!name) return "NA";
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "NA";
}

function mapBranch(branch) {
  if (branch.includes("District 1")) return "Downtown Luxe";
  if (branch.includes("District 3")) return "Westside Glow";
  if (branch.includes("District 7")) return "Northpark Studio";
  if (branch.includes("Thu Duc")) return "Eastview Nails";
  return branch;
}

function mapService(service) {
  switch (service) {
    case "Classic Manicure": return "Gel Manicure";
    case "Nail Art Premium": return "Nail Art";
    case "Spa Pedicure": return "Pedicure Deluxe";
    case "Builder Gel Set": return "Acrylic Full Set";
    case "Gel Polish":
    default: return "Gel Polish";
  }
}

function mapStatus(status) {
  if (status === "In Service") return "Confirmed";
  return status;
}

function getStatusTone(status) {
  switch (status) {
    case "Completed": return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Confirmed": return "bg-[#e8f2ff] text-[#4a72d8]";
    case "Pending": return "bg-[#fff4e8] text-[#d9871c]";
    case "Cancelled": return "bg-[#ffe7ef] text-[#e1447f]";
    case "No-show": return "bg-[#f3ebff] text-[#7e4fe6]";
    default: return BOOKING_STATUS_STYLES[status] ?? "bg-[#fff5ef] text-[#8c5d44]";
  }
}

function escapeCsvCell(value) {
  const normalizedValue = String(value ?? "").replace(/"/g, "\"\"");
  return `"${normalizedValue}"`;
}

function buildBookingsCsvRows(bookings, language) {
  const headers = language === "vi"
    ? ["Mã LH", "Khách hàng", "SĐT", "Chi nhánh", "Thợ làm nail", "Ngày", "Giờ", "Trạng thái", "Dịch vụ", "Tổng giá"]
    : ["Booking ID", "Customer", "Phone", "Salon", "Staff Artist", "Date", "Time", "Status", "Service", "Total Price"];

  const rows = bookings.map((booking) => {
    return [
      booking.uiId || booking.id,
      booking.customerName,
      booking.customerPhone,
      booking.uiBranch || booking.branch,
      booking.staffName,
      booking.bookingDate || booking.bookingDateValue,
      booking.bookingTime,
      booking.uiStatus || booking.status,
      booking.uiService || booking.service,
      booking.totalPriceLabel || booking.totalPrice,
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}

function normalizeBooking(booking) {
  const status = mapStatus(booking.status);

  return {
    ...booking,
    uiId: booking.id.replace("BKG", "BK"),
    avatar: getInitials(booking.customerName),
    uiBranch: mapBranch(booking.branch),
    uiService: mapService(booking.service),
    uiStatus: status,
  };
}

/* STREAMING_CHUNK: Translation Maps */
const translateOption = (option, language) => {
  if (language !== "vi") return option;
  const mapVi = {
    "All": "Tất cả",
    "All salons": "Tất cả chi nhánh",
    "All staff": "Tất cả nhân viên",
    "Pending": "Đang chờ",
    "Confirmed": "Đã xác nhận",
    "ServiceCompleted": "Đã hoàn tất dịch vụ",
    "Completed": "Đã hoàn thành",
    "CheckedIn": "Đã có mặt",
    "Cancelled": "Đã hủy",
    "No-show": "Không đến",
  };
  return mapVi[option] || option;
};

const translateSummaryText = (text, language) => {
  if (language !== "vi") return text;
  const mapVi = {
    "Total Bookings": "Tổng lịch hẹn",
    "Branch Bookings": "Lịch hẹn chi nhánh",
    "Assigned Today": "Được giao hôm nay",
    "Front Desk Bookings": "Lịch hẹn lễ tân",
    "Pending": "Đang chờ",
    "Completed": "Đã hoàn thành",
    "Cancelled": "Đã hủy",
    "No-shows": "Không đến",
    "Revenue": "Doanh thu",
    "+12.4% this month": "+12.4% tháng này",
    "+5 today": "+5 hôm nay",
    "+8.6% this month": "+8.6% tháng này",
    "-2.3% this month": "-2.3% tháng này",
    "-1.1% this month": "-1.1% tháng này",
    "+9.8% this month": "+9.8% tháng này",
    "+3 today": "+3 hôm nay",
    "+6.1% this month": "+6.1% tháng này",
    "-0.6% this month": "-0.6% tháng này",
    "-0.4% this month": "-0.4% tháng này",
    "+2 vs yesterday": "+2 so với hôm qua",
    "Awaiting check-in": "Đang chờ check-in",
    "+7 this week": "+7 tuần này",
    "Low this week": "Thấp trong tuần",
    "Stable": "Ổn định",
    "+6 today": "+6 hôm nay",
    "Needs callback": "Cần gọi lại",
    "+4.1% this week": "+4.1% tuần này",
    "Watch reschedules": "Chú ý đổi lịch",
    "Follow-up needed": "Cần theo dõi",
    "Loaded from salon booking API": "Tải từ API đặt lịch của tiệm",
    "Loaded from artist schedule": "Tải từ lịch trình của thợ",
    "Awaiting service progress": "Đang chờ tiến trình dịch vụ",
    "Finished today": "Đã hoàn thành hôm nay",
    "Today": "Hôm nay",
    "Total loaded from API": "Tổng được tải từ API",
    "Salon Bookings": "Lịch hẹn toàn tiệm",
    "My Bookings": "Lịch hẹn của tôi"
  };
  return mapVi[text] || text;
};

/* STREAMING_CHUNK: Component Setup */
export function StaffBookingListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const formatDisplay = (s) => {
    switch (s) {
      case "Checked In":
      case "CheckedIn":
        return language === "vi" ? "Đã check in" : "Checked In";
      case "In Progress":
      case "InProgress":
        return language === "vi" ? "Đang tiến hành" : "In Progress";
      case "Pending":
        return language === "vi" ? "Đang chờ" : "Pending";
      case "Confirmed":
      case "Approved":
        return language === "vi" ? "Đã xác nhận" : "Confirmed";
      case "Completed":
      case "ServiceCompleted":
        return language === "vi" ? "Đã hoàn thành" : "Completed";
      case "Rejected":
        return language === "vi" ? "Đã từ chối" : "Rejected";
      case "Cancelled":
      case "Canceled":
        return language === "vi" ? "Đã hủy" : "Cancelled";
      case "ReschedulePending":
        return language === "vi" ? "Đang chờ dời lịch" : "Reschedule Pending";
      case "RescheduleSuggested":
        return language === "vi" ? "Đã đề xuất dời lịch" : "Reschedule Proposed";
      case "Repaired":
        return language === "vi" ? "Đã sửa chữa" : "Repaired";
      case "All":
        return language === "vi" ? "Tất cả" : "All";
      default:
        return s;
    }
  };

  const role = ROLES.staff;
  const roleConfig = BOOKING_ROLE_CONFIG[role];
  const isStaffRole = true;

  const todayDate = useMemo(() => getTodayDateParam(), []);

  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState(todayDate);
  const [dateTo, setDateTo] = useState(todayDate);
  const [salonFilter, setSalonFilter] = useState(SALON_OPTIONS[0]);
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0]);
  const [staffFilter, setStaffFilter] = useState("All staff");
  const [staffTimeSortDirection, setStaffTimeSortDirection] = useState("asc");
  const [staffBookingScope, setStaffBookingScope] = useState(STAFF_BOOKING_SCOPES.mine);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [staffBookings, setStaffBookings] = useState([]);
  const [staffSalonBookings, setStaffSalonBookings] = useState([]);
  const [selectedStaffNotesBooking, setSelectedStaffNotesBooking] = useState(null);

  const currentStaffArtistId = useMemo(() => {
    try {
      return getStaffArtistId();
    } catch {
      return "";
    }
  }, []);

  /* STREAMING_CHUNK: Effects */
  useEffect(() => {
    if (!location.state?.flashMessage) return;
    toast.success(location.state.flashMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = staffBookingScope === STAFF_BOOKING_SCOPES.salon
          ? await fetchStaffSalonBookings()
          : await fetchStaffBookings();

        if (!isMounted) return;
        const normalizedData = Array.isArray(data) ? data.map(normalizeStaffBooking) : [];

        if (staffBookingScope === STAFF_BOOKING_SCOPES.salon) {
          setStaffSalonBookings(normalizedData);
        } else {
          setStaffBookings(normalizedData);
        }
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error
          ? error.message
          : staffBookingScope === STAFF_BOOKING_SCOPES.salon
            ? (language === "vi" ? "Không thể tải lịch hẹn toàn tiệm." : "Failed to load salon bookings.")
            : (language === "vi" ? "Không thể tải lịch hẹn của bạn." : "Failed to load assigned bookings.");
        setLoadError(message);
        toast.error(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void loadBookings();
    return () => { isMounted = false; };
  }, [staffBookingScope, language]);

  useEffect(() => {
    setDateFrom(todayDate);
    setDateTo(todayDate);
  }, [staffBookingScope, todayDate]);

  /* STREAMING_CHUNK: Filtering & Pagination Logic */
  const isSalonScopeForStaff = staffBookingScope === STAFF_BOOKING_SCOPES.salon;
  const activeBookings = isSalonScopeForStaff ? staffSalonBookings : staffBookings;

  const filteredBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return activeBookings.filter((booking) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [booking.id, booking.uiId, booking.customerName, booking.customerPhone, booking.uiBranch, booking.uiService, booking.staffName]
          .join(" ").toLowerCase().includes(normalizedQuery);

      const matchesStatus = statusFilter === "All" || booking.uiStatus === statusFilter;
      const matchesSalon = salonFilter === "All salons" || booking.uiBranch === salonFilter;
      const matchesStaff = staffFilter === "All staff" || booking.staffName === staffFilter;
      const matchesDate =
        (!dateFrom || booking.bookingDateValue >= dateFrom) &&
        (!dateTo || booking.bookingDateValue <= dateTo);

      return matchesQuery && matchesStatus && matchesSalon && matchesStaff && matchesDate;
    });
  }, [activeBookings, dateFrom, dateTo, query, salonFilter, staffFilter, statusFilter]);

  const sortedBookings = useMemo(() => {
    const sortMultiplier = staffTimeSortDirection === "desc" ? -1 : 1;
    return [...filteredBookings].sort((left, right) => {
      const timeDifference = getBookingDateTimeValue(left) - getBookingDateTimeValue(right);
      if (timeDifference !== 0) return timeDifference * sortMultiplier;
      return left.customerName.localeCompare(right.customerName) * sortMultiplier;
    });
  }, [filteredBookings, staffTimeSortDirection]);

  const {
    currentPage,
    paginatedItems: paginatedBookings,
    setCurrentPage,
    totalPages,
  } = usePagination(sortedBookings, BOOKING_PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, query, salonFilter, setCurrentPage, staffFilter, staffTimeSortDirection, statusFilter]);

  const paginationLabel = useMemo(() => {
    if (!filteredBookings.length) {
      return language === "vi" ? "Đang hiển thị 0 lịch hẹn" : "Showing 0 bookings";
    }
    const start = (currentPage - 1) * BOOKING_PAGE_SIZE + 1;
    const end = Math.min(filteredBookings.length, currentPage * BOOKING_PAGE_SIZE);
    return language === "vi"
      ? `Đang hiển thị ${start}-${end} trong số ${filteredBookings.length} lịch hẹn`
      : `Showing ${start}-${end} of ${filteredBookings.length} bookings`;
  }, [currentPage, filteredBookings.length, language]);

  /* STREAMING_CHUNK: Dynamic Summary & Actions */
  const summaryItems = useMemo(() => {
    const pendingCount = activeBookings.filter((booking) => booking.status === "Pending").length;
    const completedCount = activeBookings.filter((booking) => booking.status === "Completed").length;
    const cancelledCount = activeBookings.filter((booking) => booking.status === "Cancelled").length;
    const revenue = activeBookings.reduce((sum, booking) => sum + booking.totalPriceValue, 0);

    const baseItems = [
      { label: isSalonScopeForStaff ? "Salon Bookings" : "Assigned Today", value: String(activeBookings.length), note: isSalonScopeForStaff ? "Loaded from salon booking API" : "Loaded from artist schedule", icon: CalendarDays, iconClassName: "bg-[#ffe8f2] text-[#ea4f93]" },
      { label: "Pending", value: String(pendingCount), note: "Awaiting service progress", icon: Clock3, iconClassName: "bg-[#fff4e8] text-[#f59e0b]" },
      { label: "Completed", value: String(completedCount), note: "Finished today", icon: DollarSign, iconClassName: "bg-[#eaf9ee] text-[#2fa25f]" },
      { label: "Cancelled", value: String(cancelledCount), note: "Today", icon: XCircle, iconClassName: "bg-[#fff0f5] text-[#e1447f]" },
      { label: "Revenue", value: revenue > 0 ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(revenue)} VND` : "0 VND", note: "Total loaded from API", icon: AlertTriangle, iconClassName: "bg-[#f5ecff] text-[#8b5cf6]" },
    ];

    return baseItems.map(item => ({
      ...item,
      label: translateSummaryText(item.label, language),
      note: translateSummaryText(item.note, language)
    }));
  }, [activeBookings, isSalonScopeForStaff, language]);

  const getActionItems = (booking) => {
    const detailRoute = roleConfig.getDetailRoute(booking.id);

    const isOwnBooking = !isSalonScopeForStaff || !currentStaffArtistId || String(booking?.nailArtistId || "").trim() === String(currentStaffArtistId).trim();
    const normalizedBookingStatus = String(booking?.status || booking?.uiStatus || "").trim().toLowerCase();
    const isPendingBooking = ["pending", "approved"].includes(normalizedBookingStatus);
    const isCheckedInBooking = normalizedBookingStatus === "checkedin";
    const isInProgressBooking = normalizedBookingStatus === "inprogress";
    const isCompletedBooking = normalizedBookingStatus === "completed";
    const isServiceCompletedBooking = normalizedBookingStatus === "servicecompleted";
    const isCancelledBooking = ["cancelled", "canceled"].includes(normalizedBookingStatus);

    const openServiceSession = () => {
      navigate(getStaffBookingServiceSessionRoute(booking.id), {
        state: {
          serviceSession: {
            ...buildStaffServiceSessionPayload(booking, {
              backRoute: detailRoute,
              designUpdateRoute: getStaffBookingDesignStudioRoute(booking.id),
            }),
            started: isInProgressBooking,
            completed: false,
          },
        },
      });
    };

    if (isInProgressBooking) {
      return [
        { key: "view", label: language === "vi" ? "Xem lịch hẹn" : "View Booking", icon: Eye, onSelect: () => navigate(detailRoute) },
        ...(isOwnBooking ? [{ key: "continue", label: language === "vi" ? "Tiếp tục làm" : "Continue Service", icon: Play, onSelect: () => void openServiceSession() }] : []),
        { key: "notes", label: language === "vi" ? "Xem ghi chú" : "View Notes", icon: FileText, onSelect: () => setSelectedStaffNotesBooking(booking) },
      ];
    }

    return [
      { key: "view", label: language === "vi" ? "Xem lịch hẹn" : "View Booking", icon: Eye, onSelect: () => navigate(detailRoute) },
      ...(isOwnBooking && !isCancelledBooking && !isPendingBooking && !isCompletedBooking && !isServiceCompletedBooking
        ? [{ key: "start", label: language === "vi" ? "Bắt đầu làm" : "Start Service", icon: Play, onSelect: () => void openServiceSession() }]
        : []),
      ...(isOwnBooking && !isCancelledBooking && !isPendingBooking && !isCheckedInBooking && !isCompletedBooking && !isServiceCompletedBooking
        ? [{ key: "complete", label: language === "vi" ? "Hoàn thành" : "Complete Service", icon: SquareCheckBig, onSelect: () => navigate(detailRoute, { state: { staffAction: "complete" } }) }]
        : []),
      { key: "notes", label: language === "vi" ? "Xem ghi chú" : "View Notes", icon: FileText, onSelect: () => setSelectedStaffNotesBooking(booking) },
    ];
  };

  const handleExportCsv = () => {
    if (!sortedBookings.length) {
      toast.error(language === "vi" ? "Không có lịch hẹn để xuất." : "No bookings available to export.");
      return;
    }

    const csvContent = buildBookingsCsvRows(sortedBookings, language);
    const csvBlob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    const dateLabel = new Date().toISOString().slice(0, 10);

    link.href = downloadUrl;
    link.download = `bookings-${role}-${dateLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    toast.success(language === "vi" ? "Đã xuất CSV thành công." : "CSV exported successfully.");
  };

  /* STREAMING_CHUNK: Render Application UI */
  return (
    <>
      <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryItems.map((item) => (
            <MetricCard key={item.label} item={item} />
          ))}
        </div>

        <div className="">
          <div className="space-y-4">
            <article className="rounded-[20px] border border-[#f7d8e6] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] md:p-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                    {language === "vi" ? "Từ ngày" : "Date From"}
                  </span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-[#fff9fc] px-3 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                    {language === "vi" ? "Đến ngày" : "Date To"}
                  </span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-[#fff9fc] px-3 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                    {language === "vi" ? "Trạng thái" : "Booking Status"}
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-[#fff9fc] px-3 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item} value={item}>{formatDisplay(item)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">

                <label className="relative block flex-1">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                    {language === "vi" ? "Tìm kiếm" : "Search"}
                  </span>
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-[2.5rem] -translate-y-1/2 text-[#df7baa]"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={language === "vi" ? "Nhập mã lịch hẹn, tên khách hàng..." : "Search booking ID, customer..."}
                    className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-[#fff9fc] pl-10 pr-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
                  >
                    {language === "vi" ? "Áp dụng" : "Apply"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateFrom(todayDate);
                      setDateTo(todayDate);
                      setSalonFilter(SALON_OPTIONS[0]);
                      setStatusFilter(STATUS_OPTIONS[0]);
                      setStaffFilter("All staff");
                      setQuery("");
                    }}
                    className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                  >
                    {language === "vi" ? "Đặt lại" : "Reset"}
                  </button>
                </div>
              </div>
            </article>

            <article className="rounded-[20px] border border-[#f7d8e6] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-[#462a45]">
                    {isSalonScopeForStaff ? (language === "vi" ? "Lịch Hẹn Toàn Tiệm" : "Salon Bookings") : (language === "vi" ? "Lịch Hẹn Của Tôi" : "My Bookings")}
                  </p>
                  <p className="mt-1 text-[11px] text-[#d197b0]">
                    {isSalonScopeForStaff ? paginationLabel : `${paginationLabel} ${language === "vi" ? "trong hôm nay" : "for today"}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex rounded-full border border-[#f4c6da] bg-[#fff7fb] p-1">
                    {[
                      { key: STAFF_BOOKING_SCOPES.mine, label: language === "vi" ? "Của tôi" : "My Bookings" },
                      { key: STAFF_BOOKING_SCOPES.salon, label: language === "vi" ? "Toàn tiệm" : "Salon Bookings" },
                    ].map((scopeOption) => {
                      const isActive = staffBookingScope === scopeOption.key;
                      return (
                        <button
                          key={scopeOption.key}
                          type="button"
                          onClick={() => setStaffBookingScope(scopeOption.key)}
                          className={`rounded-full px-4 py-2 text-xs font-bold transition ${isActive
                            ? "bg-[image:var(--gradient-accent)] text-white shadow-[0_10px_20px_rgba(236,72,153,0.18)]"
                            : "text-[#ea4f93]"
                            }`}
                        >
                          {scopeOption.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
                  >
                    {language === "vi" ? "Xuất CSV" : "Export CSV"}
                  </button>
                </div>
              </div>

              {loadError ? (
                <div className="mt-4 rounded-[16px] border border-[#f7d4df] bg-[#fff3f7] px-4 py-3 text-sm font-medium text-[#d14c84]">
                  {loadError}
                </div>
              ) : null}

              <div className="mt-4 overflow-hidden rounded-[18px] border border-[#f6dbe7]">
                <div className="flex items-center justify-between gap-3 border-b border-[#f7dce8] bg-[#fffafd] px-4 py-3">
                  <p className="text-sm font-extrabold text-[#462a45]">
                    {isSalonScopeForStaff ? (language === "vi" ? "Lịch Hẹn Toàn Tiệm" : "Salon Bookings") : (language === "vi" ? "Lịch Hẹn Của Tôi" : "My Bookings")}
                  </p>
                </div>

                {isLoading ? (
                  <div className="px-5 py-10 text-center text-sm text-[#8a7082]">
                    {isSalonScopeForStaff ? (language === "vi" ? "Đang tải lịch hẹn toàn tiệm..." : "Loading salon bookings...") : (language === "vi" ? "Đang tải lịch hẹn được phân công..." : "Loading assigned bookings...")}
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto lg:block">
                      <table className="min-w-full">
                        <thead className="border-b border-[#f8e1eb] bg-[#fffdfd]">
                          <tr className="text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#c696ad]">
                            <th className="px-4 py-3">{language === "vi" ? "Khách hàng" : "Customer"}</th>
                            <th className="px-4 py-3">{language === "vi" ? "Chi nhánh" : "Salon"}</th>
                            <th className="px-4 py-3">{language === "vi" ? "Thợ làm nail" : "Staff Artist"}</th>
                            <th className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setStaffTimeSortDirection((currentDirection) =>
                                    currentDirection === "asc" ? "desc" : "asc",
                                  )
                                }
                                className="inline-flex items-center gap-1 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#c696ad]"
                              >
                                {language === "vi" ? "Thời gian" : "Time"}
                                <ArrowUpDown size={12} className="text-[#df7baa]" />
                                <span className="text-[9px] normal-case tracking-normal text-[#df7baa]">
                                  {staffTimeSortDirection === "asc" ? (language === "vi" ? "Sớm nhất" : "Earliest") : (language === "vi" ? "Muộn nhất" : "Latest")}
                                </span>
                              </button>
                            </th>
                            <th className="px-4 py-3">{language === "vi" ? "Trạng thái" : "Status"}</th>
                            <th className="px-4 py-3">{language === "vi" ? "Thao tác" : "Action"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#fae6ef] bg-white">
                          {paginatedBookings.map((booking) => (
                            <tr key={booking.id} className="align-top">
                              <td className="px-4 py-3.5">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd4e4_0%,#ea4f93_100%)] text-[10px] font-extrabold text-white">
                                    {booking.avatar}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-[#432744]">{booking.customerName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-sm text-[#6b5668]">{booking.uiBranch}</td>
                              <td className="px-4 py-3.5 text-sm text-[#8a7082]">{booking.staffName}</td>
                              <td className="px-4 py-3.5">
                                <p className="text-sm font-semibold text-[#432744]">
                                  {formatDateLabel(booking.bookingDate)}
                                </p>
                                <p className="mt-1 text-[11px] text-[#c694ad]">{booking.bookingTime}</p>
                              </td>
                              <td className="px-4 py-3.5">
                                <SmallTag className={getStatusTone(booking.uiStatus)}>
                                  {formatDisplay(booking.uiStatus)}
                                </SmallTag>
                              </td>
                              <td className="px-4 py-3.5">
                                <ActionDropdown items={getActionItems(booking)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-3 p-4 lg:hidden">
                      {paginatedBookings.map((booking) => (
                        <article
                          key={booking.id}
                          className="rounded-[16px] border border-[#f8dce8] bg-[#fffafb] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd4e4_0%,#ea4f93_100%)] text-[10px] font-extrabold text-white">
                              {booking.avatar}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-[#432744]">{booking.customerName}</p>
                              </div>
                              <p className="mt-1 text-[11px] text-[#c694ad]">
                                {booking.uiBranch} • {booking.staffName}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <SmallTag className="bg-[#ffe7ef] text-[#ea4f93]">{booking.uiService}</SmallTag>
                            <SmallTag className={getStatusTone(booking.uiStatus)}>{formatDisplay(booking.uiStatus)}</SmallTag>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#432744]">
                                {formatDateLabel(booking.bookingDate)}
                              </p>
                              <p className="mt-1 text-[11px] text-[#c694ad]">{booking.bookingTime}</p>
                            </div>
                            <ActionDropdown items={getActionItems(booking)} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] text-[#c694ad]">
                    {paginationLabel}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92]"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-[#ea4f93] px-2 text-[11px] font-bold text-white"
                    >
                      {currentPage}
                    </button>
                    <span className="px-2 text-[11px] font-medium text-[#b9849f]">
                      / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage >= totalPages}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92]"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {!isLoading && filteredBookings.length === 0 ? (
                <div className="mt-4 rounded-[16px] border border-[#f8dce8] bg-[#fffafb] px-5 py-8 text-center text-sm text-[#8a7082]">
                  {language === "vi" ? "Không có lịch hẹn nào khớp với bộ lọc." : "No bookings matched the current filters."}
                </div>
              ) : null}
            </article>
          </div>
        </div>
      </section>
      <StaffBookingNotesModal
        open={Boolean(selectedStaffNotesBooking)}
        booking={selectedStaffNotesBooking}
        onClose={() => setSelectedStaffNotesBooking(null)}
      />
    </>
  );
}
