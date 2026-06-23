import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Spin, Alert, DatePicker, Dropdown } from "antd";
import dayjs from "dayjs";
import { ROLES } from "../../../../shared/constants/roles";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { formatDurationLabel } from "../../../../shared/utils/formatDuration";
import { BOOKING_ROLE_CONFIG } from "../services/mockBookings";
import { fetchBookingsBySalonId } from "../services/bookingsService";

const roleConfig = BOOKING_ROLE_CONFIG[ROLES.manager];
const DEFAULT_SALON_ID = "484c3aef-3ae1-4ad6-8aba-6b0bc6df586d";

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

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[18px] border border-[#f8deea] bg-white p-5 shadow-[0_10px_24px_rgba(236,72,153,0.06)] ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h3 className="text-sm font-extrabold text-[#3f2240]">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-[#c08aa4]">{subtitle}</p> : null}
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
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.iconClassName}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-3 text-[1.65rem] font-extrabold leading-none text-[#3b2241]">{item.value}</p>
      <p className="mt-2 text-[13px] font-semibold text-[#7f6478]">{item.label}</p>
      <p className={`mt-1 text-[11px] font-medium ${item.noteClassName}`}>{item.note}</p>
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

function getStatusTone(status) {
  switch (status) {
    case "CheckedIn":
    case "Checked In":
      return "bg-[#e7ecff] text-[#4755b8]";
    case "InProgress":
    case "In Progress":
      return "bg-[#f3ebff] text-[#7e4fe6]";
    case "Pending":
      return "bg-[#fff0dd] text-[#db8520]";
    case "Confirmed":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Completed":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Rejected":
      return "bg-[#ffe6ec] text-[#e1447f]";
    case "RescheduleReq":
    case "Reschedule Req":
      return "bg-[#fff0dd] text-[#db8520]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
  }
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

function formatStatusDisplay(status) {
  if (status === "CheckedIn") return "Checked In";
  if (status === "InProgress") return "In Progress";
  if (status === "RescheduleReq") return "Reschedule Req";
  return status;
}

function matchesFilter(status, filter) {
  if (filter === "All") return true;
  if (filter === "Reschedule") return status === "RescheduleReq" || status === "Reschedule Req";
  return status === filter;
}

function formatHourLabel(hour) {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

function getArtistDisplayName(artist) {
  const name = artist?.nailArtistName || artist?.artistName || artist?.fullName || artist?.name;
  return name === "Chưa chỉ định" ? "Unassigned" : name || "Unassigned";
}

function mapApiBookingToUiFormat(apiBooking) {
  console.log("Mapping API booking:", apiBooking);
  
  
  // Helper to format date and time
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Get customer name and initials
  const customerName = apiBooking.customerName || "Unknown Customer";
  const customerInitials = customerName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Get artist name
  const artistName = getArtistDisplayName(apiBooking);
  const artistId = apiBooking.staffId || apiBooking.nailArtistId || apiBooking.staffArtistId || apiBooking.artistId || null;

  return {
    id: apiBooking.bookingId || apiBooking.id,
    bookingId: apiBooking.bookingId || apiBooking.id,
    bookingDate: apiBooking.bookingDate,
    date: formatDate(apiBooking.bookingDate || apiBooking.createdAt),
    time: formatTime(apiBooking.bookingDate || apiBooking.createdAt),
    startTime: apiBooking.startTime,
    duration: formatDuration(apiBooking.totalDuration || 60),
    totalDuration: apiBooking.totalDuration,
    customer: customerName,
    customerName: apiBooking.customerName,
    customerId: apiBooking.customerId,
    phone: apiBooking.customerPhone || "N/A",
    service: apiBooking.serviceName || "Nail Service",
    serviceName: apiBooking.serviceName,
    artist: artistName,
    nailArtistName: artistName,
    nailArtistId: artistId,
    deposit: apiBooking.depositAmount ? `$${apiBooking.depositAmount} Paid` : "Pending",
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
    ...apiBooking, // Include all other fields
  };
}

export function ManagerBookingListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flashMessage] = useState(location.state?.flashMessage ?? "");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const apiBookings = await fetchBookingsBySalonId(DEFAULT_SALON_ID);
      const uiBookings = apiBookings.map(mapApiBookingToUiFormat);
      setBookings(uiBookings);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setError(err.message || "Failed to load bookings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return bookings.filter((appointment) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [appointment.customer, appointment.phone, appointment.artist, appointment.time]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      // Date filtering
      let matchesDate = true;
      if (selectedDate) {
        const bookingDate = dayjs(appointment.bookingDate || appointment.createdAt);
        matchesDate = bookingDate.isSame(selectedDate, "day");
      }

      return matchesQuery && matchesFilter(appointment.status, activeFilter) && matchesDate;
    });
  }, [activeFilter, query, bookings, selectedDate]);

  const summaryStats = useMemo(() => {
    const pending = bookings.filter(b => b.status === "Pending").length;
    const confirmed = bookings.filter(b => b.status === "Confirmed").length;
    const checkedIn = bookings.filter(b => b.status === "Checked In").length;
    const noShows = bookings.filter(b => b.status === "No Show").length;
    const rescheduleReqs = bookings.filter(b => b.status === "Reschedule Req").length;

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
        label: "No-shows Today",
        value: noShows.toString(),
        note: "+1 from last week",
        icon: XCircle,
        iconClassName: "bg-[#ffe6ec] text-[#e1447f]",
        noteClassName: "text-[#e1447f]",
      },
      {
        label: "Reschedule Requests",
        value: rescheduleReqs.toString(),
        note: "needs attention",
        icon: RefreshCw,
        iconClassName: "bg-[#fff0dd] text-[#db8520]",
        noteClassName: "text-[#db8520]",
      },
    ];
  }, [bookings]);

  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-2xl border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_8px_18px_rgba(236,72,153,0.06)] transition hover:bg-[#fff7fb]"
        >
          <Download size={14} />
          Export
        </button>
        <Link
          to={roleConfig.createRoute}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#ea4f93] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:bg-[#df4588]"
        >
          <UserPlus size={14} />
          New Booking
        </Link>
      </div>

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
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <Card className="p-0">
            <div className="flex flex-col gap-4 border-b border-[#f6dce7] p-5 lg:flex-row lg:items-center lg:justify-between">
              <SectionHeading title="Today's Appointments" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-2">
                  {/* Status Filter Dropdown */}
                  <Dropdown
                    menu={{
                      items: appointmentFilters.map((filter) => ({
                        key: filter.value,
                        label: (
                          <span className={activeFilter === filter.value ? "text-[#ea4f93] font-bold" : "text-[#5c4559]"}>
                            {filter.label}
                          </span>
                        ),
                        onClick: () => setActiveFilter(filter.value),
                      })),
                    }}
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-[#f4c1d8] bg-white px-4 py-2 text-xs font-bold text-[#5c4559] transition hover:bg-[#fff7fb]"
                    >
                      <span>{appointmentFilters.find(f => f.value === activeFilter)?.label || activeFilter}</span>
                      <ChevronDown size={12} />
                    </button>
                  </Dropdown>
                  {/* Date Picker */}
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    placeholder="Select date"
                    className="h-9 rounded-full border border-[#f5d7e4] bg-[#fff9fc] text-xs text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
                    suffixIcon={<Calendar size={14} className="text-[#c08aa4]" />}
                  />
                </div>
                <label className="relative block min-w-[200px]">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#c08aa4]"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search bookings..."
                    className="h-9 w-full rounded-full border border-[#f5d7e4] bg-[#fff9fc] pl-9 pr-4 text-xs text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
                  />
                </label>
              </div>
            </div>

            <div className="overflow-x-auto p-5 pt-0">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-[#f6dce7] text-[10px] uppercase tracking-[0.16em] text-[#c693ad]">
                    <th className="px-3 py-3 whitespace-nowrap">Time</th>
                    <th className="px-3 py-3 whitespace-nowrap">Customer</th>
                    <th className="px-3 py-3 whitespace-nowrap">Staff Artist</th>
                    <th className="px-3 py-3 whitespace-nowrap">Deposit</th>
                    <th className="px-3 py-3 whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((row) => (
                    <tr key={row.id} className="border-b border-[#fbe7ef] last:border-b-0">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-[#402542]">{row.time}</p>
                        <p className="text-[11px] text-[#c08aa4]">{formatDurationLabel(row.duration)}</p>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${row.avatarTone} text-[10px] font-bold text-white`}
                          >
                            {row.initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#402542]">{row.customer}</p>
                            <p className="text-[11px] text-[#c08aa4]">{row.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${row.artistTone} text-[9px] font-bold text-white`}
                          >
                            {row.artist
                              .split(" ")
                              .map((part) => part[0])
                              .join("")}
                          </div>
                          <span className="text-sm text-[#7a6176]">{row.artist}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${row.depositTone}`}>{row.deposit}</span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap ${getStatusTone(row.status)}`}
                        >
                          {formatStatusDisplay(row.status)}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Link
                          to={roleConfig.getDetailRoute(row.id)}
                          className="inline-flex items-center gap-1 rounded-full bg-[#ea4f93] px-2.5 py-1 text-[10px] font-bold text-white shadow-[0_4px_12px_rgba(234,79,147,0.25)] transition hover:bg-[#df4588]"
                        >
                          <Eye size={12} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAppointments.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#8a7082]">
                  No appointments matched the current filters.
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
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

            <div className="mt-5 overflow-x-auto">
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

          <Card>
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
                  className="rounded-[16px] border border-[#f8deea] bg-[#fffafb] p-4"
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
                      <p className="text-[11px] text-[#c08aa4]">{formatDurationLabel(slot.duration)}</p>
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

        <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
          <Card>
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

          <Card>
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

          <Card>
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

          <Card>
            <SectionHeading title="Booking Conflicts" subtitle="3 items need attention" />
            <div className="mt-4 space-y-3">
              {bookingConflicts.map((conflict) => (
                <div
                  key={conflict.title}
                  className="rounded-[12px] border border-[#f8c4d8] bg-[#fff0f6] px-3 py-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#e1447f]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-[#e1447f]">{conflict.title}</p>
                      <p className="mt-1 text-[11px] text-[#c08aa4]">{conflict.time}</p>
                      <button type="button" className="mt-2 text-[11px] font-bold text-[#ea4f93]">
                        {conflict.action}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
        </div>
      ) : null}

    </section>
  );
}
