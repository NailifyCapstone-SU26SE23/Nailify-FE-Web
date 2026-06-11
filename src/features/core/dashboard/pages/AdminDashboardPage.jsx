import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CircleDollarSign,
  Clock3,
  MapPin,
  Sparkles,
  Star,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import { PropTypes } from "../../../../shared/utils/propTypes";

const metricCards = [
  {
    icon: Users,
    label: "Total Customers",
    value: "48,392",
    note: "+1,240 this month",
    delta: "+12.4%",
    tint: "from-[#ff4f98] to-[#d92e7a]",
    glow: "bg-[#ffe2ee]",
  },
  {
    icon: Clock3,
    label: "Total Bookings",
    value: "12,847",
    note: "+340 this week",
    delta: "+8.7%",
    tint: "from-[#a74ce6] to-[#7d38dd]",
    glow: "bg-[#efe2ff]",
  },
  {
    icon: CircleDollarSign,
    label: "Monthly Revenue",
    value: "$284,590",
    note: "+$43,200 vs last month",
    delta: "+18.2%",
    tint: "from-[#ff5e95] to-[#ff7f4f]",
    glow: "bg-[#ffe8e3]",
  },
  {
    icon: Store,
    label: "Active Salons",
    value: "18",
    note: "2 new branches opened",
    delta: "+2",
    tint: "from-[#ff8352] to-[#ff5f6f]",
    glow: "bg-[#ffe9de]",
  },
  {
    icon: UserRound,
    label: "Staff Artists",
    value: "247",
    note: "14 new hires this month",
    delta: "+14",
    tint: "from-[#5b74db] to-[#4755b8]",
    glow: "bg-[#e7ecff]",
  },
  {
    icon: Check,
    label: "Completion Rate",
    value: "94.6%",
    note: "11,847 of 12,523 bookings",
    delta: "+3.1%",
    tint: "from-[#2fc5a9] to-[#2a9d8f]",
    glow: "bg-[#dff7f2]",
  },
];

const revenueTrend = [
  ["Jan", 24],
  ["Feb", 31],
  ["Mar", 45],
  ["Apr", 52],
  ["May", 64],
  ["Jun", 78],
  ["Jul", 84],
  ["Aug", 86],
];
const bookingBars = [
  ["Mo", 56],
  ["Tu", 71],
  ["We", 64],
  ["Th", 79],
  ["Fr", 83],
  ["Sa", 60],
  ["Su", 74],
];
const peakBars = [
  ["9a", 18],
  ["10", 24],
  ["11", 38],
  ["12", 61],
  ["1pm", 76],
  ["2", 84],
  ["3", 88],
  ["4", 79],
  ["5", 58],
  ["6", 44],
  ["7", 27],
];


const registrations = [
  ["Jasmine Loh", "Just now"],
  ["Priya Nair", "4 min ago"],
  ["Yuki Matsuda", "12 min ago"],
  ["Clara Mendez", "28 min ago"],
  ["Hana Yoshida", "45 min ago"],
];

const recentActivities = [
  {
    title: "Booking #BK-8821 completed at Nailify Orchard",
    time: "2 min ago",
    color: "bg-[#f04f91]",
  },
  {
    title: "New staff artist onboarded at Nailify Marina",
    time: "15 min ago",
    color: "bg-[#8b5cf6]",
  },
  {
    title: "Payment of $284 received for Booking #BK-8819",
    time: "22 min ago",
    color: "bg-[#ec4899]",
  },
  {
    title: "New complaint filed by Aisha Rahman",
    time: "1 hour ago",
    color: "bg-[#f59e0b]",
  },
  {
    title: "Monthly analytics report generated for July",
    time: "6 hours ago",
    color: "bg-[#6366f1]",
  },
];

const salons = [
  ["Nailify Orchard", "Orchard Rd, SG", "Jessica Tan", "1,842", "$42,300", 92, "Active"],
  ["Nailify Marina", "Marina Bay, SG", "Priya Sharma", "1,620", "$38,750", 87, "Busy"],
  ["Nailify Bugis", "Bugis St, SG", "Mei Lin Chen", "1,390", "$31,200", 78, "Active"],
  ["Nailify Tampines", "Tampines Mall, SG", "Rachel Lim", "1,105", "$24,800", 71, "Active"],
  ["Nailify Jurong", "Jurong East, SG", "Amanda Koh", "980", "$21,450", 65, "Busy"],
  ["Nailify Woodlands", "Woodlands Ave, SG", "Siti Rahimah", "740", "$16,900", 58, "Active"],
  ["Nailify Sengkang", "Sengkang, SG", "Fiona Ng", "210", "$4,800", 22, "Closed"],
];

const artists = [
  ["Lily Nguyen", "Nailify Orchard", "384", "$8,920"],
  ["Mia Tanaka", "Nailify Marina", "361", "$8,340"],
  ["Sophie Park", "Nailify Bugis", "342", "$7,890"],
  ["Chloe Williams", "Nailify Tampines", "318", "$7,210"],
];

const customerStyles = [
  ["French Tip", 82],
  ["Gel Ombre", 74],
  ["Nail Art", 61],
  ["Acrylic Set", 48],
  ["Matte Finish", 39],
  ["Chrome Powder", 27],
];

const demographics = [
  ["Female (18-34)", 72],
  ["Female (35-50)", 55],
  ["Female (51+)", 28],
  ["Male (18-34)", 18],
  ["Male (35+)", 10],
];

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[24px] border border-[#f7d7e5] bg-white p-5 shadow-[0_16px_36px_rgba(236,72,153,0.08)] ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionHeading({ title, subtitle, badge }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-extrabold text-[#3f2240]">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-[#c08aa4]">{subtitle}</p> : null}
      </div>
      {badge ? (
        <span className="rounded-full border border-[#f7c9dc] bg-[#fff6fa] px-3 py-1 text-[10px] font-bold text-[#ea4f93]">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

SectionHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  badge: PropTypes.string,
};

function ProgressRow({ label, value, color = "bg-[#ea4f93]" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-[#7f6478]">{label}</span>
        <span className="font-bold text-[#ea4f93]">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#fbe1ec]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

ProgressRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  color: PropTypes.string,
};

function getStatusTone(status) {
  switch (status) {
    case "Busy":
      return "bg-[#fff0dd] text-[#db8520]";
    case "Closed":
      return "bg-[#ffe6ec] text-[#e1447f]";
    default:
      return "bg-[#e9faef] text-[#30a05f]";
  }
}

function StatusBadge({ status }) {
  const tone = getStatusTone(status);

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
      {status}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

export function AdminDashboardPage() {
  return (
    <section className="flex min-h-full flex-col gap-5 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_330px]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metricCards.map((card) => {
              const Icon = card.icon;

              return (
                <Card key={card.label} className="relative overflow-hidden">
                  <div className={`absolute -bottom-6 -right-6 h-24 w-24 rounded-full ${card.glow}`} />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tint} text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]`}
                      >
                        <Icon size={18} />
                      </div>
                      <span className="rounded-full bg-[#eff9ef] px-2.5 py-1 text-[11px] font-bold text-[#2fa25f]">
                        {card.delta}
                      </span>
                    </div>
                    <p className="mt-5 text-[2rem] font-extrabold leading-none text-[#3b2241]">
                      {card.value}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#7f6478]">{card.label}</p>
                    <p className="mt-1 text-xs text-[#d28ea8]">{card.note}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionHeading
                title="Revenue Growth"
                subtitle="Monthly revenue across all branches"
                badge="2025"
              />
              <div className="mt-6 flex h-44 items-end gap-3 rounded-[20px] bg-[linear-gradient(180deg,#fff8fb_0%,#fffdfd_100%)] px-3 py-4">
                {revenueTrend.map(([month, value], index) => (
                  <div key={month} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <div className="relative w-full flex-1">
                      <div className="absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#ea4f93]" style={{ bottom: `${value}%` }} />
                      {index < revenueTrend.length - 1 ? (
                        <div
                          className="absolute left-1/2 h-0.5 origin-left bg-[#ea4f93]/70"
                          style={{
                            bottom: `calc(${value}% + 0.25rem)`,
                            width: "100%",
                            transform: `rotate(${(revenueTrend[index + 1][1] - value) * -0.55}deg)`,
                          }}
                        />
                      ) : null}
                    </div>
                    <span className="text-[10px] font-medium text-[#c9a2b5]">{month}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeading
                title="Booking Trends"
                subtitle="Weekly bookings by service type"
                badge="This Week"
              />
              <div className="mt-6 flex h-44 items-end gap-3 rounded-[20px] bg-[linear-gradient(180deg,#fff8fb_0%,#fffdfd_100%)] px-4 py-4">
                {bookingBars.map(([day, value]) => (
                  <div key={day} className="flex flex-1 items-end gap-1">
                    <div
                      className="w-1/2 rounded-t-full bg-[#ea4f93]"
                      style={{ height: `${value}%` }}
                    />
                    <div
                      className="w-1/2 rounded-t-full bg-[#f8bfd6]"
                      style={{ height: `${Math.max(value - 12, 18)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-7 text-center text-[10px] font-medium text-[#c9a2b5]">
                {bookingBars.map(([day]) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeading
                title="Popular Nail Styles"
                subtitle="Top requested styles this month"
                badge="July 2025"
              />
              <div className="mt-6 grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-[#f4d5e5] border-t-[#ea4f93] border-r-[#f3a8c7] border-b-[#d97dd8] bg-[#fff8fb] shadow-[inset_0_0_0_14px_#fff]">
                  <div className="text-center">
                    <p className="text-3xl font-extrabold text-[#ea4f93]">33%</p>
                    <p className="text-xs font-semibold text-[#b6859f]">French</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    ["French Tip", 33],
                    ["Gel Ombre", 24],
                    ["Nail Art", 20],
                    ["Acrylic", 14],
                    ["Others", 9],
                  ].map(([label, value], index) => (
                    <div key={label} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: ["#ea4f93", "#d76ae5", "#f78db8", "#f4b4cf", "#d6c1e3"][index],
                          }}
                        />
                        <span className="font-medium text-[#775c72]">{label}</span>
                      </div>
                      <span className="font-bold text-[#ea4f93]">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <SectionHeading
                title="Peak Booking Hours"
                subtitle="Average bookings per hour slot"
                badge="Weekdays"
              />
              <div className="mt-6 flex h-44 items-end gap-2 rounded-[20px] bg-[linear-gradient(180deg,#fff8fb_0%,#fffdfd_100%)] px-4 py-4">
                {peakBars.map(([time, value], index) => (
                  <div key={time} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className={`w-full rounded-t-full ${index === 6 ? "bg-[#cf3f89]" : "bg-[#f48ab7]"}`}
                      style={{ height: `${value}%` }}
                    />
                    <span className="text-[10px] font-medium text-[#c9a2b5]">{time}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SectionHeading
                  title="Salon Performance"
                  subtitle="Branch revenue, occupancy, and status"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#e84d92]"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.2)]"
                  >
                    + Add Salon
                  </button>
                </div>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-[#f6dce7] text-[11px] uppercase tracking-[0.18em] text-[#c693ad]">
                      <th className="px-3 py-3">Salon Name</th>
                      <th className="px-3 py-3">Location</th>
                      <th className="px-3 py-3">Manager</th>
                      <th className="px-3 py-3">Bookings</th>
                      <th className="px-3 py-3">Revenue</th>
                      <th className="px-3 py-3">Occupancy</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salons.map(([name, location, manager, bookings, revenue, occupancy, status]) => (
                      <tr key={name} className="border-b border-[#fbe7ef] last:border-b-0">
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#ea4f93]" />
                            <div>
                              <p className="font-semibold text-[#402542]">{name}</p>
                              <p className="mt-1 text-xs text-[#bc89a4]">{location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-[#7a6176]">{location}</td>
                        <td className="px-3 py-4 text-sm text-[#7a6176]">{manager}</td>
                        <td className="px-3 py-4 text-sm font-semibold text-[#402542]">{bookings}</td>
                        <td className="px-3 py-4 text-sm font-bold text-[#ea4f93]">{revenue}</td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-20 rounded-full bg-[#f7d7e5]">
                              <div
                                className="h-full rounded-full bg-[#ea4f93]"
                                style={{ width: `${occupancy}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-[#8a6d82]">{occupancy}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            className="rounded-full border border-[#f4c7da] bg-[#fff6fa] px-3 py-1.5 text-xs font-bold text-[#e84d92]"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-[#3f2240]">Top Staff Artists</h3>
                <button type="button" className="text-xs font-bold text-[#e84d92]">
                  See All
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {artists.map(([name, branch, bookings, revenue], index) => (
                  <Card key={name} className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffc5de_0%,#ea4f93_100%)] text-lg font-extrabold text-white">
                      {name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <h4 className="mt-4 font-extrabold text-[#3e2341]">{name}</h4>
                    <p className="mt-1 text-xs text-[#be89a4]">{branch}</p>
                    <div className="mt-2 flex items-center justify-center gap-1 text-[#ff5b98]">
                      {[1, 2, 3, 4, 5].map((starNumber) => (
                        <Star key={starNumber} size={12} fill="currentColor" />
                      ))}
                      <span className="ml-1 text-[11px] font-bold text-[#d18ca8]">
                        4.{9 - index}
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-2 border-t border-[#f8deea] pt-4">
                      <div>
                        <p className="text-lg font-extrabold text-[#ea4f93]">{bookings}</p>
                        <p className="text-[11px] text-[#c394ac]">Bookings</p>
                      </div>
                      <div>
                        <p className="text-lg font-extrabold text-[#ea4f93]">{revenue}</p>
                        <p className="text-[11px] text-[#c394ac]">Revenue</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-[#3f2240]">Customer Insights</h3>
                <button type="button" className="text-xs font-bold text-[#e84d92]">
                  Full Report
                </button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <SectionHeading title="Returning Customer Rate" />
                  <div className="mt-6 text-center">
                    <p className="text-5xl font-extrabold text-[#d63988]">68.4%</p>
                    <p className="mt-2 text-sm text-[#be89a4]">
                      of customers return within 30 days
                    </p>
                    <div className="mt-3 inline-flex rounded-full bg-[#eaf9ee] px-3 py-1 text-[11px] font-bold text-[#2fa25f]">
                      +5.2% vs last month
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    <ProgressRow label="1-2 visits" value={30} />
                    <ProgressRow label="3-5 visits" value={42} />
                    <ProgressRow label="6-10 visits" value={20} />
                    <ProgressRow label="10+ visits" value={8} />
                  </div>
                </Card>

                <Card>
                  <SectionHeading title="Popular Styles by Customers" />
                  <div className="mt-6 space-y-4">
                    {customerStyles.map(([label, value]) => (
                      <ProgressRow key={label} label={label} value={value} />
                    ))}
                  </div>
                </Card>

                <Card>
                  <SectionHeading title="Favorite Booking Times" />
                  <div className="mt-6 space-y-4">
                    <ProgressRow label="Morning (9-12)" value={45} />
                    <ProgressRow label="Afternoon (12-3)" value={72} />
                    <ProgressRow label="Peak (3-6pm)" value={95} />
                    <ProgressRow label="Evening (6-9)" value={58} />
                  </div>
                  <div className="mt-5 rounded-[18px] border border-[#f8d9e7] bg-[#fff7fb] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#c896af]">
                      Most Popular Slot
                    </p>
                    <p className="mt-2 text-lg font-extrabold text-[#e34b91]">
                      Saturday 3:00 PM - 4:00 PM
                    </p>
                    <p className="mt-1 text-xs text-[#c08aa4]">Avg. 142 bookings per week</p>
                  </div>
                </Card>

                <Card>
                  <SectionHeading title="Customer Demographics" />
                  <div className="mt-6 space-y-4">
                    {demographics.map(([label, value], index) => (
                      <ProgressRow
                        key={label}
                        label={label}
                        value={value}
                        color={
                          ["bg-[#ea4f93]", "bg-[#f274b0]", "bg-[#f7b0cf]", "bg-[#9b5de5]", "bg-[#d8b4fe]"][index]
                        }
                      />
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      ["89%", "Female"],
                      ["11%", "Male"],
                      ["26", "Avg. Age"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-[18px] border border-[#f7d8e6] bg-[#fff8fb] px-3 py-4 text-center">
                        <p className="text-2xl font-extrabold text-[#e34b91]">{value}</p>
                        <p className="mt-1 text-xs text-[#c08aa4]">{label}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ff76ab_0%,#df307d_100%)] text-white">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="font-extrabold text-[#e84d92]">Nailify</p>
                <p className="text-xs text-[#c18ba5]">Quick Status Panel</p>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-[#3f2240]">New Registrations</h3>
                  <span className="rounded-full bg-[#eaf9ee] px-2 py-1 text-[10px] font-bold text-[#2fa25f]">
                    +48 today
                  </span>
                </div>
                <div className="space-y-3">
                  {registrations.map(([name, time]) => (
                    <div key={name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd0e2_0%,#ea4f93_100%)] text-xs font-bold text-white">
                          {name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#402542]">{name}</p>
                          <p className="text-[11px] text-[#c190aa]">{time}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-[#f7cade] bg-[#fff6fa] px-2 py-1 text-[10px] font-bold text-[#ea4f93]">
                        New
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-extrabold text-[#3f2240]">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivities.map((item) => (
                    <div key={item.title} className="flex gap-3">
                      <div className={`mt-1 h-8 w-8 rounded-full ${item.color}`} />
                      <div>
                        <p className="text-sm font-medium leading-5 text-[#5e4760]">{item.title}</p>
                        <p className="mt-1 text-[11px] text-[#c190aa]">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-extrabold text-[#3f2240]">Today&apos;s Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["142", "Bookings Today"],
                    ["$3,284", "Revenue Today"],
                    ["48", "New Customers"],
                    ["96%", "Satisfaction"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-[18px] border border-[#f8d9e7] bg-[#fff8fb] px-3 py-4 text-center">
                      <p className="text-2xl font-extrabold text-[#e34b91]">{value}</p>
                      <p className="mt-1 text-[11px] text-[#c08aa4]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#f7d7e5] bg-[linear-gradient(90deg,#fff7fb_0%,#fffdf8_100%)] p-4 shadow-[0_12px_24px_rgba(236,72,153,0.08)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-extrabold text-[#3f2240]">Admin Focus</p>
            <p className="mt-1 text-sm text-[#b9839f]">
              Cross-branch revenue is healthy, but complaint response and AR Try-On stability need attention today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff] px-3 py-2 text-xs font-bold text-[#ea4f93]">
              <AlertCircle size={14} />
              7 complaints pending
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff] px-3 py-2 text-xs font-bold text-[#2fa25f]">
              <ArrowUpRight size={14} />
              Revenue up 18.2%
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff] px-3 py-2 text-xs font-bold text-[#7d38dd]">
              <MapPin size={14} />
              18 branches active
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
