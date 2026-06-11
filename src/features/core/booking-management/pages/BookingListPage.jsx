import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  DollarSign,
  FileText,
  PencilLine,
  Play,
  Search,
  SquareCheckBig,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROLES } from "../../../../shared/constants/roles";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { PropTypes } from "../../../../shared/utils/propTypes";
import {
  BOOKING_ROLE_CONFIG,
  BOOKING_ROWS,
  BOOKING_STATUS_STYLES,
} from "../services/mockBookings";
import { getBookingRoleFromPath } from "../utils/bookingMapper";

const SUMMARY_BY_ROLE = {
  [ROLES.admin]: [
    {
      label: "Total Bookings",
      value: "1,284",
      note: "+12.4% this month",
      icon: CalendarDays,
      iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
    },
    {
      label: "Pending",
      value: "87",
      note: "+5 today",
      icon: Clock3,
      iconClassName: "bg-[#fff4e8] text-[#f59e0b]",
    },
    {
      label: "Completed",
      value: "1,091",
      note: "+8.6% this month",
      icon: DollarSign,
      iconClassName: "bg-[#eaf9ee] text-[#2fa25f]",
    },
    {
      label: "Cancelled",
      value: "74",
      note: "-2.3% this month",
      icon: XCircle,
      iconClassName: "bg-[#fff0f5] text-[#e1447f]",
    },
    {
      label: "No-shows",
      value: "32",
      note: "-1.1% this month",
      icon: AlertTriangle,
      iconClassName: "bg-[#f5ecff] text-[#8b5cf6]",
    },
  ],
  [ROLES.manager]: [
    {
      label: "Branch Bookings",
      value: "428",
      note: "+9.8% this month",
      icon: CalendarDays,
      iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
    },
    {
      label: "Pending",
      value: "21",
      note: "+3 today",
      icon: Clock3,
      iconClassName: "bg-[#fff4e8] text-[#f59e0b]",
    },
    {
      label: "Completed",
      value: "356",
      note: "+6.1% this month",
      icon: DollarSign,
      iconClassName: "bg-[#eaf9ee] text-[#2fa25f]",
    },
    {
      label: "Cancelled",
      value: "18",
      note: "-0.6% this month",
      icon: XCircle,
      iconClassName: "bg-[#fff0f5] text-[#e1447f]",
    },
    {
      label: "No-shows",
      value: "11",
      note: "-0.4% this month",
      icon: AlertTriangle,
      iconClassName: "bg-[#f5ecff] text-[#8b5cf6]",
    },
  ],
  [ROLES.staff]: [
    {
      label: "Assigned Today",
      value: "18",
      note: "+2 vs yesterday",
      icon: CalendarDays,
      iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
    },
    {
      label: "Pending",
      value: "4",
      note: "Awaiting check-in",
      icon: Clock3,
      iconClassName: "bg-[#fff4e8] text-[#f59e0b]",
    },
    {
      label: "Completed",
      value: "53",
      note: "+7 this week",
      icon: DollarSign,
      iconClassName: "bg-[#eaf9ee] text-[#2fa25f]",
    },
    {
      label: "Cancelled",
      value: "3",
      note: "Low this week",
      icon: XCircle,
      iconClassName: "bg-[#fff0f5] text-[#e1447f]",
    },
    {
      label: "No-shows",
      value: "2",
      note: "Stable",
      icon: AlertTriangle,
      iconClassName: "bg-[#f5ecff] text-[#8b5cf6]",
    },
  ],
  [ROLES.receptionist]: [
    {
      label: "Front Desk Bookings",
      value: "212",
      note: "+6 today",
      icon: CalendarDays,
      iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
    },
    {
      label: "Pending",
      value: "19",
      note: "Needs callback",
      icon: Clock3,
      iconClassName: "bg-[#fff4e8] text-[#f59e0b]",
    },
    {
      label: "Completed",
      value: "168",
      note: "+4.1% this week",
      icon: DollarSign,
      iconClassName: "bg-[#eaf9ee] text-[#2fa25f]",
    },
    {
      label: "Cancelled",
      value: "9",
      note: "Watch reschedules",
      icon: XCircle,
      iconClassName: "bg-[#fff0f5] text-[#e1447f]",
    },
    {
      label: "No-shows",
      value: "7",
      note: "Follow-up needed",
      icon: AlertTriangle,
      iconClassName: "bg-[#f5ecff] text-[#8b5cf6]",
    },
  ],
};

const SALON_OPTIONS = ["All salons", "Downtown Luxe", "Westside Glow", "Northpark Studio", "Eastview Nails"];
const STATUS_OPTIONS = ["All", "Pending", "Confirmed", "Completed", "Cancelled", "No-show"];
const PAYMENT_OPTIONS = ["All", "Paid", "Partial", "Pending", "Refunded", "Unpaid"];

const BOOKING_CONFLICTS = [
  ["#BK-1041", "Mia Nguyen", "2:00 PM overlap", "Downtown Luxe", "Double booked"],
  ["#BK-1078", "Luna Park", "4:30 PM slot", "Westside Glow", "Overlap"],
  ["#BK-1091", "Chloe Kim", "11:00 AM slot", "Northpark Studio", "Double booked"],
];

const NO_SHOW_ALERTS = [
  ["Mia Russo", "#BK-1278", "Eastview Nails", "No-show"],
  ["Priya Sharma", "#BK-1261", "Downtown Luxe", "No-show"],
  ["Tina Brooks", "#BK-1248", "Westside Glow", "No-show"],
  ["Rachel Yu", "#BK-1235", "Northpark Studio", "No-show"],
];

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

function formatDateLabel(dateValue) {
  const parts = dateValue.split("-");
  if (parts.length !== 3) return dateValue;
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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
    case "Classic Manicure":
      return "Gel Manicure";
    case "Nail Art Premium":
      return "Nail Art";
    case "Spa Pedicure":
      return "Pedicure Deluxe";
    case "Builder Gel Set":
      return "Acrylic Full Set";
    case "Gel Polish":
    default:
      return "Gel Polish";
  }
}

function mapPayment(paymentStatus) {
  switch (paymentStatus) {
    case "Deposit Paid":
      return "Partial";
    default:
      return paymentStatus;
  }
}

function getPaymentTone(paymentStatus) {
  switch (paymentStatus) {
    case "Paid":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Partial":
      return "bg-[#fff4e8] text-[#d9871c]";
    case "Refunded":
      return "bg-[#f5ecff] text-[#8b5cf6]";
    case "Pending":
      return "bg-[#fff7e7] text-[#cc8a16]";
    default:
      return "bg-[#fff0f5] text-[#e1447f]";
  }
}

function mapStatus(status) {
  if (status === "In Service") return "Confirmed";
  return status;
}

function getStatusTone(status) {
  switch (status) {
    case "Completed":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Confirmed":
      return "bg-[#e8f2ff] text-[#4a72d8]";
    case "Pending":
      return "bg-[#fff4e8] text-[#d9871c]";
    case "Cancelled":
      return "bg-[#ffe7ef] text-[#e1447f]";
    case "No-show":
      return "bg-[#f3ebff] text-[#7e4fe6]";
    default:
      return BOOKING_STATUS_STYLES[status] ?? "bg-[#fff5ef] text-[#8c5d44]";
  }
}

function normalizeBooking(booking) {
  const status = mapStatus(booking.status);
  const payment = mapPayment(booking.paymentStatus);

  return {
    ...booking,
    uiId: booking.id.replace("BKG", "BK"),
    avatar: getInitials(booking.customerName),
    uiBranch: mapBranch(booking.branch),
    uiService: mapService(booking.service),
    uiStatus: status,
    uiPayment: payment,
  };
}

function getDefaultDateRange(bookings) {
  if (bookings.length === 0) {
    return {
      from: "",
      to: "",
    };
  }

  const sortedDates = bookings
    .map((booking) => booking.bookingDate)
    .filter(Boolean)
    .sort();

  return {
    from: sortedDates[0] ?? "",
    to: sortedDates[sortedDates.length - 1] ?? "",
  };
}

export function BookingListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = getBookingRoleFromPath(location.pathname);
  const roleConfig = BOOKING_ROLE_CONFIG[role];
  const normalizedBookings = useMemo(() => BOOKING_ROWS.map(normalizeBooking), []);
  const defaultDateRange = useMemo(
    () => getDefaultDateRange(normalizedBookings),
    [normalizedBookings],
  );
  const [flashMessage] = useState(location.state?.flashMessage ?? "");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState(defaultDateRange.from);
  const [dateTo, setDateTo] = useState(defaultDateRange.to);
  const [salonFilter, setSalonFilter] = useState(SALON_OPTIONS[0]);
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0]);
  const [paymentFilter, setPaymentFilter] = useState(PAYMENT_OPTIONS[0]);
  const [staffFilter, setStaffFilter] = useState("All staff");

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const filteredBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return normalizedBookings.filter((booking) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          booking.id,
          booking.uiId,
          booking.customerName,
          booking.customerPhone,
          booking.uiBranch,
          booking.uiService,
          booking.staffName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "All" || booking.uiStatus === statusFilter;
      const matchesPayment =
        paymentFilter === "All" || booking.uiPayment === paymentFilter;
      const matchesSalon =
        salonFilter === "All salons" || booking.uiBranch === salonFilter;
      const matchesStaff =
        staffFilter === "All staff" || booking.staffName === staffFilter;
      const matchesDate =
        (!dateFrom || booking.bookingDate >= dateFrom) &&
        (!dateTo || booking.bookingDate <= dateTo);

      if (role === ROLES.staff || role === ROLES.receptionist) {
        return (
          matchesQuery &&
          matchesStatus &&
          matchesPayment &&
          matchesSalon &&
          matchesStaff &&
          matchesDate &&
          ["Ariana Vo", "Bao Tran", "Linh Pham"].includes(booking.staffName)
        );
      }

      if (role === ROLES.manager) {
        return (
          matchesQuery &&
          matchesStatus &&
          matchesPayment &&
          matchesSalon &&
          matchesStaff &&
          matchesDate &&
          ["District 1 Salon", "District 3 Salon"].includes(booking.branch)
        );
      }

      return (
        matchesQuery &&
        matchesStatus &&
        matchesPayment &&
        matchesSalon &&
        matchesStaff &&
        matchesDate
      );
    });
  }, [
    dateFrom,
    dateTo,
    normalizedBookings,
    paymentFilter,
    query,
    role,
    salonFilter,
    staffFilter,
    statusFilter,
  ]);

  const summaryItems = SUMMARY_BY_ROLE[role] ?? SUMMARY_BY_ROLE[ROLES.admin];
  const getActionItems = (booking) => {
    const detailRoute = roleConfig.getDetailRoute(booking.id);

    if (role === ROLES.staff) {
      return [
        { key: "view", label: "View Booking", icon: Eye, onSelect: () => navigate(detailRoute) },
        { key: "edit", label: "Edit Booking", icon: PencilLine, onSelect: () => navigate(detailRoute) },
        {
          key: "start",
          label: "Start Service",
          icon: Play,
          onSelect: () => navigate(detailRoute, { state: { staffAction: "start" } }),
        },
        {
          key: "complete",
          label: "Complete Service",
          icon: SquareCheckBig,
          onSelect: () => navigate(detailRoute, { state: { staffAction: "complete" } }),
        },
        {
          key: "notes",
          label: "View Notes",
          icon: FileText,
          onSelect: () => navigate(detailRoute, { state: { staffAction: "notes" } }),
        },
        {
          key: "delete",
          label: "Delete Booking",
          icon: Trash2,
          className: "text-[#d14c84]",
          onSelect: () => navigate(detailRoute, { state: { staffAction: "delete" } }),
        },
      ];
    }

    return [
      { key: "view", label: "View Detail", icon: Eye, onSelect: () => navigate(detailRoute) },
      { key: "edit", label: "Edit Booking", icon: PencilLine, onSelect: () => navigate(detailRoute) },
      {
        key: "delete",
        label: "Delete Booking",
        icon: Trash2,
        className: "text-[#d14c84]",
        onSelect: () => navigate(detailRoute, { state: { requestDelete: true } }),
      },
    ];
  };
  const bookingVolume = [
    { time: "9A", value: 4 },
    { time: "10A", value: 8 },
    { time: "11A", value: 11 },
    { time: "12P", value: 14 },
    { time: "1P", value: 9 },
    { time: "2P", value: 12 },
    { time: "3P", value: 10 },
    { time: "4P", value: 7 },
    { time: "5P", value: 6 },
    { time: "6P", value: 3 },
  ];

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff6fb_100%)]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryItems.map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_290px]">
        <div className="space-y-4">
          <article className="rounded-[20px] border border-[#f7d8e6] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] md:p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                  Date From
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
                  Date To
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
                  Salon
                </span>
                <select
                  value={salonFilter}
                  onChange={(event) => setSalonFilter(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-[#fff9fc] px-3 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
                >
                  {SALON_OPTIONS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                  Booking Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-[#fff9fc] px-3 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                  Payment
                </span>
                <select
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-[#fff9fc] px-3 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
                >
                  {PAYMENT_OPTIONS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
              <label className="space-y-2 md:w-52">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                  Staff Artist
                </span>
                <select
                  value={staffFilter}
                  onChange={(event) => setStaffFilter(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-[#fff9fc] px-3 text-sm text-[#5c4559] outline-none transition focus:border-[#ef6bb4]"
                >
                  {["All staff", "Ariana Vo", "Bao Tran", "Linh Pham", "Mia Nguyen"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="relative block flex-1">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">
                  Search
                </span>
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-[2.5rem] -translate-y-1/2 text-[#df7baa]"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search booking ID, customer..."
                  className="h-10 w-full rounded-xl border border-[#f5d7e4] bg-[#fff9fc] pl-10 pr-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
                />
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom(defaultDateRange.from);
                    setDateTo(defaultDateRange.to);
                    setSalonFilter(SALON_OPTIONS[0]);
                    setStatusFilter(STATUS_OPTIONS[0]);
                    setPaymentFilter(PAYMENT_OPTIONS[0]);
                    setStaffFilter("All staff");
                    setQuery("");
                  }}
                  className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                >
                  Reset
                </button>
              </div>
            </div>
          </article>

          <article className="rounded-[20px] border border-[#f7d8e6] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-extrabold text-[#462a45]">All Bookings</p>
                <p className="mt-1 text-[11px] text-[#d197b0]">
                  Showing 1 to {Math.min(filteredBookings.length, 10)} of 1,284 bookings
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
                >
                  Export CSV
                </button>
                <Link
                  to={roleConfig.createRoute}
                  className="inline-flex items-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
                >
                  <UserPlus size={13} className="mr-1.5" />
                  {roleConfig.createLabel}
                </Link>
              </div>
            </div>

            {flashMessage ? (
              <div className="mt-4 rounded-[16px] bg-[#edfdf4] px-4 py-3 text-sm font-medium text-[#16975f]">
                {flashMessage}
              </div>
            ) : null}

            <div className="mt-4 overflow-hidden rounded-[18px] border border-[#f6dbe7]">
              <div className="flex items-center justify-between gap-3 border-b border-[#f7dce8] bg-[#fffafd] px-4 py-3">
                <p className="text-sm font-extrabold text-[#462a45]">All Bookings</p>
                <button
                  type="button"
                  className="rounded-full border border-[#f4c6da] bg-[#fff7fb] px-3 py-1.5 text-[10px] font-bold text-[#ea4f93]"
                >
                  Bulk Actions
                </button>
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full">
                  <thead className="border-b border-[#f8e1eb] bg-[#fffdfd]">
                    <tr className="text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#c696ad]">
                      <th className="px-4 py-3">Booking ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Salon</th>
                      <th className="px-4 py-3">Staff Artist</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#fae6ef] bg-white">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="align-top">
                        <td className="px-4 py-3.5 text-xs font-bold text-[#f04f91]">
                          {booking.uiId}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd4e4_0%,#ea4f93_100%)] text-[10px] font-extrabold text-white">
                              {booking.avatar}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#432744]">{booking.customerName}</p>
                              <p className="mt-1 text-[11px] text-[#c694ad]">{booking.customerPhone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#6b5668]">{booking.uiBranch}</td>
                        <td className="px-4 py-3.5 text-sm text-[#8a7082]">{booking.staffName}</td>
                        <td className="px-4 py-3.5">
                          <SmallTag className="bg-[#ffe7ef] text-[#ea4f93]">
                            {booking.uiService}
                          </SmallTag>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-[#432744]">
                            {formatDateLabel(booking.bookingDate)}
                          </p>
                          <p className="mt-1 text-[11px] text-[#c694ad]">{booking.bookingTime}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <SmallTag className={getPaymentTone(booking.uiPayment)}>
                            {booking.uiPayment}
                          </SmallTag>
                        </td>
                        <td className="px-4 py-3.5">
                          <SmallTag className={getStatusTone(booking.uiStatus)}>
                            {booking.uiStatus}
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
                {filteredBookings.map((booking) => (
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
                          <span className="text-[10px] font-bold text-[#f04f91]">{booking.uiId}</span>
                        </div>
                        <p className="mt-1 text-sm text-[#6b5668]">{booking.customerPhone}</p>
                        <p className="mt-1 text-[11px] text-[#c694ad]">
                          {booking.uiBranch} • {booking.staffName}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <SmallTag className="bg-[#ffe7ef] text-[#ea4f93]">{booking.uiService}</SmallTag>
                      <SmallTag className={getPaymentTone(booking.uiPayment)}>{booking.uiPayment}</SmallTag>
                      <SmallTag className={getStatusTone(booking.uiStatus)}>{booking.uiStatus}</SmallTag>
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

              <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-[#c694ad]">
                  Showing 1-10 of 1,284 bookings
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92]"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-[#ea4f93] px-2 text-[11px] font-bold text-white"
                  >
                    1
                  </button>
                  {["2", "3", "...", "129"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white px-2 text-[11px] font-medium text-[#b9849f]"
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92]"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="mt-4 rounded-[16px] border border-[#f8dce8] bg-[#fffafb] px-5 py-8 text-center text-sm text-[#8a7082]">
                No bookings matched the current filters.
              </div>
            ) : null}
          </article>
        </div>

        <aside className="rounded-[20px] border border-[#f7d8e6] bg-[linear-gradient(180deg,#fffdfd_0%,#fff7fb_100%)] p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
          <div>
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-sm font-extrabold text-[#412643]">Today&apos;s Booking Volume</p>
              <SmallTag className="bg-[#ffe7ef] text-[#ea4f93]">Live</SmallTag>
            </div>
            <div className="rounded-[16px] border border-[#f8dce8] bg-[#fffafb] p-3">
              <div className="flex h-24 items-end gap-2">
                {bookingVolume.map((item, index) => (
                  <div key={item.time} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-[#ea4f93]">{item.value}</span>
                    <div
                      className={`w-full rounded-t-full ${index === 3 ? "bg-[#cf3f89]" : "bg-[#f48ab7]"}`}
                      style={{ height: `${(item.value / 14) * 100}%` }}
                    />
                    <span className="text-[9px] font-medium text-[#c694ad]">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["48", "Today"],
                ["41", "Yesterday"],
                ["+17%", "vs Avg"],
              ].map(([value, label], index) => (
                <div key={label} className={`rounded-[14px] px-3 py-3 text-center ${index === 2 ? "bg-[#ffe7ef]" : "bg-[#fffafb]"} border border-[#f8dce8]`}>
                  <p className="text-xl font-extrabold text-[#ea4f93]">{value}</p>
                  <p className="mt-1 text-[10px] text-[#c694ad]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ce97b1]">
                Booking Conflicts
              </p>
              <SmallTag className="bg-[#fff0dd] text-[#d9871c]">3 issues</SmallTag>
            </div>
            <div className="space-y-3">
              {BOOKING_CONFLICTS.map(([code, name, time, branch, status]) => (
                <div key={code} className="rounded-[16px] border border-[#f7dce8] bg-[#fffafb] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-[#f04f91]">{code}</p>
                      <p className="mt-1 text-sm font-bold text-[#432744]">{name}</p>
                    </div>
                    <SmallTag className="bg-[#ffe7ef] text-[#e1447f]">{status}</SmallTag>
                  </div>
                  <p className="mt-2 text-[11px] text-[#8a7082]">{time}</p>
                  <p className="mt-1 text-[11px] text-[#c694ad]">{branch}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              View All Conflicts
            </button>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ce97b1]">
                No-show Alerts
              </p>
              <SmallTag className="bg-[#f3ebff] text-[#7e4fe6]">4 users</SmallTag>
            </div>
            <div className="space-y-3">
              {NO_SHOW_ALERTS.map(([name, code, branch, status]) => (
                <div key={code} className="flex items-center justify-between gap-3 rounded-[16px] border border-[#f7dce8] bg-[#fffafb] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd4e4_0%,#ea4f93_100%)] text-[10px] font-extrabold text-white">
                      {getInitials(name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#432744]">{name}</p>
                      <p className="text-[11px] text-[#c694ad]">{code}</p>
                      <p className="text-[11px] text-[#8a7082]">{branch}</p>
                    </div>
                  </div>
                  <SmallTag className="bg-[#f3ebff] text-[#7e4fe6]">{status}</SmallTag>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-full border border-[#f4c6da] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              View All No-shows
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
