import {
  Armchair,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Footprints,
  Star,
  Users,
} from "lucide-react";
import { PropTypes } from "../../../../shared/utils/propTypes";

const metricCards = [
  {
    icon: CalendarDays,
    label: "Today's Bookings",
    value: "34",
    delta: "+12%",
    deltaTone: "bg-[#eaf9ee] text-[#2fa25f]",
    tint: "from-[#ff5e95] to-[#ff7f4f]",
    glow: "bg-[#ffe8e3]",
  },
  {
    icon: Footprints,
    label: "Walk-in Customers",
    value: "7",
    delta: "+5",
    deltaTone: "bg-[#eaf9ee] text-[#2fa25f]",
    tint: "from-[#a74ce6] to-[#7d38dd]",
    glow: "bg-[#efe2ff]",
  },
  {
    icon: Users,
    label: "Available Staff",
    value: "3",
    delta: "3 Free",
    deltaTone: "bg-[#eaf9ee] text-[#2fa25f]",
    tint: "from-[#2fc5a9] to-[#2a9d8f]",
    glow: "bg-[#dff7f2]",
  },
  {
    icon: Armchair,
    label: "Occupied Chairs",
    value: "6",
    delta: "6/12",
    deltaTone: "bg-[#ffe7ef] text-[#ea4f93]",
    tint: "from-[#ff8352] to-[#ff5f6f]",
    glow: "bg-[#ffe9de]",
  },
  {
    icon: CircleDollarSign,
    label: "Daily Revenue",
    value: "$1,840",
    delta: "+12%",
    deltaTone: "bg-[#eaf9ee] text-[#2fa25f]",
    tint: "from-[#ff4f98] to-[#d92e7a]",
    glow: "bg-[#ffe2ee]",
  },
  {
    icon: Clock3,
    label: "Average Wait Time",
    value: "18m",
    delta: "+10min",
    deltaTone: "bg-[#fff0dd] text-[#db8520]",
    tint: "from-[#ffad33] to-[#ff7f4f]",
    glow: "bg-[#fff0dd]",
  },
];

const staffMembers = [
  ["Tina L.", "Nail Artist", "Busy", "from-[#ffc5de] to-[#ea4f93]"],
  ["Mei K.", "Nail Artist", "Available", "from-[#b8f0d8] to-[#2fc5a9]"],
  ["Priya S.", "Nail Artist", "Busy", "from-[#ffd0e2] to-[#f04f91]"],
  ["Jess T.", "Nail Artist", "On Break", "from-[#ffe0b2] to-[#ff9800]"],
  ["Lily N.", "Nail Artist", "Available", "from-[#d8c4ff] to-[#8b5cf6]"],
  ["Chloe W.", "Nail Artist", "Busy", "from-[#ffc5de] to-[#ea4f93]"],
  ["Sophie P.", "Nail Artist", "Available", "from-[#b8f0d8] to-[#2fc5a9]"],
  ["Mia T.", "Nail Artist", "Busy", "from-[#ffd0e2] to-[#f04f91]"],
  ["Rachel L.", "Nail Artist", "On Break", "from-[#ffe0b2] to-[#ff9800]"],
  ["Amanda K.", "Nail Artist", "Available", "from-[#d8c4ff] to-[#8b5cf6]"],
  ["Fiona N.", "Nail Artist", "Busy", "from-[#ffc5de] to-[#ea4f93]"],
  ["Siti R.", "Nail Artist", "Available", "from-[#b8f0d8] to-[#2fc5a9]"],
  ["Hana Y.", "Nail Artist", "Busy", "from-[#ffd0e2] to-[#f04f91]"],
  ["Clara M.", "Nail Artist", "Available", "from-[#d8c4ff] to-[#8b5cf6]"],
];

const queueItems = [
  { label: "Waiting Customers", value: "5", tone: "bg-[#fff0dd] text-[#db8520]" },
  { label: "Current Bookings", value: "6", tone: "bg-[#ffe7ef] text-[#ea4f93]" },
  { label: "Delayed Bookings", value: "2", tone: "bg-[#ffe6ec] text-[#e1447f]" },
  { label: "No-shows", value: "1", tone: "bg-[#f3f4f6] text-[#6b7280]" },
];

const scheduleRows = [
  {
    time: "09:00 AM",
    customer: "Sarah Chen",
    phone: "+65 9123 4567",
    service: "Gel Manicure",
    artist: "Tina L.",
    status: "Completed",
    action: "View",
    initials: "SC",
    avatarTone: "from-[#ffc5de] to-[#ea4f93]",
  },
  {
    time: "09:30 AM",
    customer: "Emily Wong",
    phone: "+65 8234 5678",
    service: "Nail Art Design",
    artist: "Mei K.",
    status: "In Progress",
    action: "Done",
    initials: "EW",
    avatarTone: "from-[#d8c4ff] to-[#8b5cf6]",
  },
  {
    time: "10:00 AM",
    customer: "Jessica Tan",
    phone: "+65 9345 6789",
    service: "Acrylic Full Set",
    artist: "Priya S.",
    status: "Checked In",
    action: "Start",
    initials: "JT",
    avatarTone: "from-[#b8f0d8] to-[#2fc5a9]",
  },
  {
    time: "10:30 AM",
    customer: "Grace Teo",
    phone: "+65 8456 7890",
    service: "French Tip",
    artist: "Jess T.",
    status: "Waiting",
    action: "Check-in",
    initials: "GT",
    avatarTone: "from-[#ffe0b2] to-[#ff9800]",
  },
  {
    time: "11:00 AM",
    customer: "Wendy Chua",
    phone: "+65 9567 8901",
    service: "Gel Pedicure",
    artist: "Lily N.",
    status: "Cancelled",
    action: "View",
    initials: "WC",
    avatarTone: "from-[#ffd0e2] to-[#f04f91]",
  },
];

const urgentIssues = [
  {
    title: "Late Customer",
    description: "Grace Teo is 15 minutes late for her 10:30 AM appointment.",
    tone: "border-[#ffe0b2] bg-[#fff8eb] text-[#c9770a]",
    dot: "bg-[#ff9800]",
  },
  {
    title: "Staff Absence",
    description: "Jess T. requested an emergency leave — reassign 2 bookings.",
    tone: "border-[#f8c4d8] bg-[#fff0f6] text-[#e1447f]",
    dot: "bg-[#ea4f93]",
  },
  {
    title: "Customer Complaint",
    description: "Sarah Chen reported chipped polish after 1 day — follow up needed.",
    tone: "border-[#ddd6fe] bg-[#f5f3ff] text-[#7c3aed]",
    dot: "bg-[#8b5cf6]",
  },
];

const reviews = [
  {
    name: "Aisha Rahman",
    service: "Gel Manicure",
    date: "Jul 14, 2025",
    rating: 5,
    text: "Amazing service! Tina did a beautiful job with my nail art. Will definitely come back.",
    time: "Today, 10:45 AM",
    initials: "AR",
    avatarTone: "from-[#ffc5de] to-[#ea4f93]",
  },
  {
    name: "Priya Nair",
    service: "French Tip",
    date: "Jul 13, 2025",
    rating: 5,
    text: "Clean salon, friendly staff, and my nails look perfect. Highly recommend Nailify!",
    time: "Yesterday, 4:20 PM",
    initials: "PN",
    avatarTone: "from-[#d8c4ff] to-[#8b5cf6]",
  },
  {
    name: "Yuki Matsuda",
    service: "Nail Art Design",
    date: "Jul 12, 2025",
    rating: 4,
    text: "Creative designs and great attention to detail. Slightly long wait but worth it.",
    time: "Jul 12, 2:15 PM",
    initials: "YM",
    avatarTone: "from-[#b8f0d8] to-[#2fc5a9]",
  },
];

const scheduleFilters = ["All", "Waiting", "In Progress", "Completed"];

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

function getStaffStatusTone(status) {
  switch (status) {
    case "Busy":
      return "bg-[#ffe7ef] text-[#ea4f93]";
    case "On Break":
      return "bg-[#fff0dd] text-[#db8520]";
    default:
      return "bg-[#eaf9ee] text-[#2fa25f]";
  }
}

function getBookingStatusTone(status) {
  switch (status) {
    case "Completed":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "In Progress":
      return "bg-[#ffe7ef] text-[#ea4f93]";
    case "Checked In":
      return "bg-[#e7ecff] text-[#4755b8]";
    case "Waiting":
      return "bg-[#fff0dd] text-[#db8520]";
    default:
      return "bg-[#ffe6ec] text-[#e1447f]";
  }
}

function StaffCard({ name, role, status, avatarTone }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-2 py-3 text-center">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${avatarTone} text-xs font-bold text-white shadow-sm`}
      >
        {name
          .split(" ")
          .map((part) => part[0])
          .join("")}
      </div>
      <p className="mt-2 text-[11px] font-bold text-[#402542]">{name}</p>
      <p className="mt-0.5 text-[10px] text-[#c08aa4]">{role}</p>
      <span
        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${getStaffStatusTone(status)}`}
      >
        {status}
      </span>
    </div>
  );
}

StaffCard.propTypes = {
  name: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  avatarTone: PropTypes.string.isRequired,
};

export function ManagerDashboardPage() {
  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="rounded-[18px] border border-[#f8deea] bg-gradient-to-r from-white via-[#fffafd] to-[#fff0f6] px-5 py-4 shadow-[0_10px_24px_rgba(236,72,153,0.05)]">
        <p className="text-sm font-semibold text-[#3f2240]">Good morning, Anh 👋</p>
        <p className="mt-1 text-sm text-[#c08aa4]">
          Here is today&apos;s salon operation overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.label} className="relative overflow-hidden">
              <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full ${card.glow}`} />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.tint} text-white shadow-[0_8px_16px_rgba(236,72,153,0.15)]`}
                  >
                    <Icon size={17} />
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${card.deltaTone}`}>
                    {card.delta}
                  </span>
                </div>
                <p className="mt-4 text-[1.75rem] font-extrabold leading-none text-[#3b2241]">
                  {card.value}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#7f6478]">{card.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <SectionHeading
            title="Staff Availability"
            subtitle="8 staff members on shift today"
          />
          <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-7">
            {staffMembers.map(([name, role, status, avatarTone]) => (
              <StaffCard
                key={name}
                name={name}
                role={role}
                status={status}
                avatarTone={avatarTone}
              />
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading
            title="Queue Overview"
            subtitle="Live queue status as of now"
          />
          <div className="mt-5 grid grid-cols-2 gap-3">
            {queueItems.map((item) => (
              <div
                key={item.label}
                className={`flex min-h-[88px] flex-col items-center justify-center rounded-[14px] px-3 py-4 text-center ${item.tone}`}
              >
                <p className="text-2xl font-extrabold leading-none">{item.value}</p>
                <p className="mt-2 text-[10px] font-semibold leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex flex-col gap-4 border-b border-[#f6dce7] p-5 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading
            title="Today's Schedule"
            subtitle="24 appointments · Last updated 5 min ago"
          />
          <div className="flex flex-wrap gap-2">
            {scheduleFilters.map((filter, index) => (
              <button
                key={filter}
                type="button"
                className={
                  index === 0
                    ? "rounded-full bg-[#ea4f93] px-4 py-1.5 text-xs font-bold text-white shadow-[0_8px_16px_rgba(234,79,147,0.2)]"
                    : "rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-4 py-1.5 text-xs font-bold text-[#c08aa4]"
                }
              >
                {filter}
              </button>
            ))}
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
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {scheduleRows.map((row) => (
                <tr key={`${row.time}-${row.customer}`} className="border-b border-[#fbe7ef] last:border-b-0">
                  <td className="px-3 py-4 text-sm font-semibold text-[#402542]">{row.time}</td>
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
                  <td className="px-3 py-4 text-sm text-[#7a6176]">{row.artist}</td>
                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${getBookingStatusTone(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      className="rounded-full border border-[#f4c7da] bg-[#fff6fa] px-3 py-1.5 text-xs font-bold text-[#e84d92]"
                    >
                      {row.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeading title="Quick Status" />
          <div className="mt-5 space-y-4">
            {[
              ["Salon Status", "Open", "bg-[#eaf9ee] text-[#2fa25f]"],
              ["Queue Capacity", "75% Full", "bg-[#ffe7ef] text-[#ea4f93]"],
              ["Next Break", "12:00 PM", "bg-[#fff0dd] text-[#db8520]"],
              ["Closing Time", "8:00 PM", "bg-[#f3f4f6] text-[#6b7280]"],
            ].map(([label, value, tone]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#7f6478]">{label}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[#7f6478]">Capacity Bar</span>
              <span className="font-bold text-[#ea4f93]">12/16 chairs</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#fbe1ec]">
              <div className="h-full w-3/4 rounded-full bg-[#ea4f93]" />
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeading title="Urgent Issues" subtitle="3 items need attention" />
          <div className="mt-5 space-y-3">
            {urgentIssues.map((issue) => (
              <div
                key={issue.title}
                className={`rounded-[14px] border p-4 ${issue.tone}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${issue.dot}`} />
                  <div>
                    <p className="text-sm font-extrabold">{issue.title}</p>
                    <p className="mt-1 text-xs leading-5 opacity-90">{issue.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <SectionHeading title="Review" subtitle="Customer feedback" />
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {reviews.map((review) => (
            <Card key={review.name} className="min-w-[300px] shrink-0">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${review.avatarTone} text-xs font-bold text-white`}
                >
                  {review.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-[#402542]">{review.name}</p>
                  <p className="text-[11px] text-[#c08aa4]">
                    {review.service} · {review.date}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-0.5 text-[#fbbf24]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    fill={star <= review.rating ? "currentColor" : "none"}
                    className={star <= review.rating ? "" : "text-[#e5e7eb]"}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-[#7a6176]">{review.text}</p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#f8deea] pt-3">
                <span className="text-[10px] text-[#c08aa4]">{review.time}</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ea4f93]"
                >
                  Google Review
                  <ExternalLink size={12} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
