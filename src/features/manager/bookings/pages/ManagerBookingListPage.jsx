import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROLES } from "../../../../shared/constants/roles";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { BOOKING_ROLE_CONFIG } from "../services/mockBookings";

const roleConfig = BOOKING_ROLE_CONFIG[ROLES.manager];

const summaryCards = [
  {
    label: "Pending Bookings",
    value: "14",
    note: "awaiting confirmation",
    icon: Clock3,
    iconClassName: "bg-[#ffe8f2] text-[#ea4f93]",
    noteClassName: "text-[#c08aa4]",
  },
  {
    label: "Confirmed Bookings",
    value: "31",
    note: "+5 since yesterday",
    icon: CheckCircle2,
    iconClassName: "bg-[#eaf9ee] text-[#2fa25f]",
    noteClassName: "text-[#2fa25f]",
  },
  {
    label: "Checked-in Customers",
    value: "9",
    note: "+2 this hour",
    icon: UserCheck,
    iconClassName: "bg-[#e7ecff] text-[#4755b8]",
    noteClassName: "text-[#2fa25f]",
  },
  {
    label: "No-shows Today",
    value: "3",
    note: "+1 from last week",
    icon: XCircle,
    iconClassName: "bg-[#ffe6ec] text-[#e1447f]",
    noteClassName: "text-[#e1447f]",
  },
  {
    label: "Reschedule Requests",
    value: "6",
    note: "needs attention",
    icon: RefreshCw,
    iconClassName: "bg-[#fff0dd] text-[#db8520]",
    noteClassName: "text-[#db8520]",
  },
];

const appointmentFilters = ["All", "Pending", "Confirmed", "Checked In", "Reschedule"];

const todayAppointments = [
  {
    id: "BKG-2401",
    time: "9:00 AM",
    duration: "60 min",
    customer: "Sarah Chen",
    phone: "+65 9123 4567",
    service: "Gel Full Set + Art",
    artist: "Luna Park",
    deposit: "$25.00 Paid",
    depositTone: "text-[#2fa25f]",
    status: "Checked In",
    initials: "SC",
    avatarTone: "from-[#ffc5de] to-[#ea4f93]",
    artistTone: "from-[#d8c4ff] to-[#8b5cf6]",
  },
  {
    id: "BKG-2402",
    time: "9:30 AM",
    duration: "90 min",
    customer: "Emily Wong",
    phone: "+65 8234 5678",
    service: "Nail Art Design",
    artist: "Aria Nguyen",
    deposit: "$30.00 Paid",
    depositTone: "text-[#2fa25f]",
    status: "In Progress",
    initials: "EW",
    avatarTone: "from-[#b8f0d8] to-[#2fc5a9]",
    artistTone: "from-[#ffc5de] to-[#ea4f93]",
  },
  {
    id: "BKG-2403",
    time: "10:00 AM",
    duration: "45 min",
    customer: "Jessica Tan",
    phone: "+65 9345 6789",
    service: "Gel Manicure",
    artist: "Chloe Davis",
    deposit: "Pending",
    depositTone: "text-[#db8520]",
    status: "Pending",
    initials: "JT",
    avatarTone: "from-[#ffe0b2] to-[#ff9800]",
    artistTone: "from-[#b8f0d8] to-[#2fc5a9]",
  },
  {
    id: "BKG-2404",
    time: "10:30 AM",
    duration: "75 min",
    customer: "Grace Teo",
    phone: "+65 8456 7890",
    service: "Acrylic Full Set",
    artist: "Mel Santos",
    deposit: "$20.00 Paid",
    depositTone: "text-[#2fa25f]",
    status: "Confirmed",
    initials: "GT",
    avatarTone: "from-[#d8c4ff] to-[#8b5cf6]",
    artistTone: "from-[#ffe0b2] to-[#ff9800]",
  },
  {
    id: "BKG-2405",
    time: "11:00 AM",
    duration: "60 min",
    customer: "Wendy Chua",
    phone: "+65 9567 8901",
    service: "French Tip",
    artist: "Luna Park",
    deposit: "Pending",
    depositTone: "text-[#db8520]",
    status: "Reschedule Req",
    initials: "WC",
    avatarTone: "from-[#ffd0e2] to-[#f04f91]",
    artistTone: "from-[#d8c4ff] to-[#8b5cf6]",
  },
  {
    id: "BKG-2406",
    time: "11:30 AM",
    duration: "60 min",
    customer: "Priya Nair",
    phone: "+65 9678 9012",
    service: "Gel Pedicure",
    artist: "Aria Nguyen",
    deposit: "$15.00 Paid",
    depositTone: "text-[#2fa25f]",
    status: "No Show",
    initials: "PN",
    avatarTone: "from-[#b8f0d8] to-[#2fc5a9]",
    artistTone: "from-[#ffc5de] to-[#ea4f93]",
  },
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
    case "Checked In":
      return "bg-[#e7ecff] text-[#4755b8]";
    case "In Progress":
      return "bg-[#f3ebff] text-[#7e4fe6]";
    case "Pending":
      return "bg-[#fff0dd] text-[#db8520]";
    case "Confirmed":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Reschedule Req":
      return "bg-[#fff0dd] text-[#db8520]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
  }
}

function matchesFilter(status, filter) {
  if (filter === "All") return true;
  if (filter === "Checked In") return status === "Checked In";
  if (filter === "Reschedule") return status === "Reschedule Req";
  return status === filter;
}

function formatHourLabel(hour) {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

export function ManagerBookingListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flashMessage] = useState(location.state?.flashMessage ?? "");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return todayAppointments.filter((appointment) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [appointment.customer, appointment.phone, appointment.service, appointment.artist, appointment.time]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesQuery && matchesFilter(appointment.status, activeFilter);
    });
  }, [activeFilter, query]);

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Card className="p-0">
            <div className="flex flex-col gap-4 border-b border-[#f6dce7] p-5 lg:flex-row lg:items-center lg:justify-between">
              <SectionHeading title="Today's Appointments" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-2">
                  {appointmentFilters.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={
                        activeFilter === filter
                          ? "rounded-full bg-[#ea4f93] px-3 py-1.5 text-[11px] font-bold text-white"
                          : "rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-3 py-1.5 text-[11px] font-bold text-[#c08aa4]"
                      }
                    >
                      {filter}
                    </button>
                  ))}
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
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Service</th>
                    <th className="px-3 py-3">Staff Artist</th>
                    <th className="px-3 py-3">Deposit</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((row) => (
                    <tr key={row.id} className="border-b border-[#fbe7ef] last:border-b-0">
                      <td className="px-3 py-4">
                        <p className="text-sm font-semibold text-[#402542]">{row.time}</p>
                        <p className="text-[11px] text-[#c08aa4]">{row.duration}</p>
                      </td>
                      <td className="px-3 py-4">
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
                      <td className="px-3 py-4 text-sm text-[#7a6176]">{row.service}</td>
                      <td className="px-3 py-4">
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
                      <td className="px-3 py-4">
                        <span className={`text-sm font-semibold ${row.depositTone}`}>{row.deposit}</span>
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${getStatusTone(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <Link
                          to={roleConfig.getDetailRoute(row.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-[#f4c7da] bg-[#fff6fa] px-3 py-1.5 text-xs font-bold text-[#e84d92]"
                        >
                          Actions
                          <ChevronDown size={12} />
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
    </section>
  );
}
