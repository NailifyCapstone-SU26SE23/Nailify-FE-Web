import {
  AlarmClock,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  MessageSquareText,
  Sparkles,
  Star,
  TimerReset,
  Trophy,
} from "lucide-react";

const DASHBOARD_METRICS = [
  {
    label: "Today's Bookings",
    value: "5",
    note: "2 remaining",
    icon: CalendarDays,
    iconClassName: "bg-[#fff0f5] text-[#f06292]",
  },
  {
    label: "Completed",
    value: "3",
    note: "Today so far",
    icon: ClipboardList,
    iconClassName: "bg-[#eefcf3] text-[#35b56b]",
  },
  {
    label: "Avg Rating",
    value: "4.9",
    note: "★★★★★",
    icon: Star,
    iconClassName: "bg-[#fff6eb] text-[#f5a623]",
  },
  {
    label: "Tips Earned",
    value: "$48",
    note: "Today",
    icon: CircleDollarSign,
    iconClassName: "bg-[#f3efff] text-[#8b5cf6]",
  },
  {
    label: "Next Appt",
    value: "2:30 PM",
    note: "In 45 min",
    icon: AlarmClock,
    iconClassName: "bg-[#edf7ff] text-[#4ea1ff]",
  },
];

const SCHEDULE_ROWS = [
  {
    id: "booking-01",
    time: "9:00 - 10:30 AM",
    customer: "Sophie Tran",
    customerMeta: "#1596 · 0101",
    service: "Gel Manicure",
    design: "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=120&q=80",
    status: "Completed",
    statusTone: "bg-[#e9fbef] text-[#2ca865]",
    actionLabel: "View Notes",
    actionTone: "bg-[#eaf8ec] text-[#2ca865]",
  },
  {
    id: "booking-02",
    time: "10:30 AM - 12:00 PM",
    customer: "Mia Johnson",
    customerMeta: "#1555 · 0182",
    service: "Acrylic Full Set",
    design: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=120&q=80",
    status: "Completed",
    statusTone: "bg-[#e9fbef] text-[#2ca865]",
    actionLabel: "View Notes",
    actionTone: "bg-[#eaf8ec] text-[#2ca865]",
  },
  {
    id: "booking-03",
    time: "12:00 - 2:30 PM",
    customer: "Chloe Park",
    customerMeta: "#1586 · 0247",
    service: "Nail Art Design",
    design: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=120&q=80",
    status: "In Progress",
    statusTone: "bg-[#eaf2ff] text-[#5e8df7]",
    actionLabel: "Complete",
    actionTone: "bg-[image:var(--gradient-accent)] text-white",
  },
  {
    id: "booking-04",
    time: "2:30 - 4:00 PM",
    customer: "Emma Davis",
    customerMeta: "#1657 · 0319",
    service: "Gel Polish + Tips",
    design: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=120&q=80",
    status: "Waiting",
    statusTone: "bg-[#fff4df] text-[#df8e1d]",
    actionLabel: "Start",
    actionTone: "bg-[image:var(--gradient-accent)] text-white",
  },
  {
    id: "booking-05",
    time: "4:00 - 5:00 PM",
    customer: "Ava Wilson",
    customerMeta: "#1566 · 0433",
    service: "French Manicure",
    design: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=120&q=80",
    status: "Upcoming",
    statusTone: "bg-[#fff1f5] text-[#f06292]",
    actionLabel: "View",
    actionTone: "bg-[#fff1f5] text-[#f06292]",
  },
];

const BREAK_SCHEDULE = [
  { time: "11:15 AM", note: "15 min break", badge: "Done", tone: "bg-[#eefcf3] text-[#35b56b]" },
  { time: "1:30 PM", note: "30 min lunch", badge: "Next", tone: "bg-[#fff4df] text-[#df8e1d]" },
  { time: "3:45 PM", note: "15 min break", badge: "Later", tone: "bg-[#f4f5f7] text-[#8b95a7]" },
];

const MONTHLY_TIPS = [
  ["W1", "$120", 74],
  ["W2", "$168", 100],
  ["W3", "$96", 57],
  ["W4", "$48", 30],
];

const REVIEW_REACTIONS = [
  { label: "heart", value: "9", tone: "bg-[#eefcf3] text-[#35b56b]" },
  { label: "smile", value: "4", tone: "bg-[#fff4df] text-[#df8e1d]" },
  { label: "spark", value: "6", tone: "bg-[#eaf2ff] text-[#5e8df7]" },
  { label: "star", value: "5", tone: "bg-[#fff1f5] text-[#f06292]" },
];

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-[18px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_26px_rgba(236,72,153,0.06)]">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-[12px] ${item.iconClassName}`}>
        <Icon size={16} />
      </div>
      <p className="mt-4 text-[11px] font-medium text-[#b08a9f]">{item.label}</p>
      <p className="mt-1 text-[1.7rem] font-extrabold leading-none text-[#3f2b3f]">{item.value}</p>
      <p className="mt-2 text-[11px] font-medium text-[#d597b3]">{item.note}</p>
    </article>
  );
}

function StatusChip({ label, className }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>
      {label}
    </span>
  );
}

function Panel({ title, icon: Icon, children, action }) {
  return (
    <section className="rounded-[20px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_26px_rgba(236,72,153,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? <Icon size={14} className="text-[#ea4f93]" /> : null}
          <h3 className="text-sm font-extrabold text-[#432744]">{title}</h3>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function StaffDashboardPage() {
  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff5fa_100%)]">
      <div className="flex flex-col gap-4 rounded-[24px] border border-[#f6dbe8] bg-[#fff7fb] p-4 shadow-[0_14px_30px_rgba(236,72,153,0.05)]">
        <div className="rounded-[20px] border border-[#f4d5e3] bg-[linear-gradient(90deg,#ffe8f1_0%,#ffdce8_100%)] px-5 py-4">
          <p className="text-base font-extrabold text-[#ea4f93]">Good morning, Linh!</p>
          <p className="mt-1 text-sm text-[#b5859f]">
            You have 5 bookings today. Let&apos;s have a great day!
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {DASHBOARD_METRICS.map((item) => (
            <MetricCard key={item.label} item={item} />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.62fr)_290px]">
          <div className="space-y-4">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-sm font-extrabold text-[#432744]">Today&apos;s Schedule</h3>
                <StatusChip
                  label="5 bookings"
                  className="border border-[#f6d3e3] bg-[#fff1f6] text-[#b48aa0]"
                />
              </div>

              <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_26px_rgba(236,72,153,0.06)]">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[#fff9fc]">
                      <tr className="text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#c58ea8]">
                        <th className="px-5 py-4">Time</th>
                        <th className="px-4 py-4">Customer</th>
                        <th className="px-4 py-4">Service</th>
                        <th className="px-4 py-4">Design</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SCHEDULE_ROWS.map((booking) => (
                        <tr key={booking.id} className="border-t border-[#f9e6ef]">
                          <td className="px-5 py-4 text-sm font-bold text-[#3f2b3f]">{booking.time}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(booking.customer)}&background=fde7ef&color=8f365c&bold=true`}
                                alt={booking.customer}
                                className="h-9 w-9 rounded-full border border-[#f6d3e3]"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <p className="text-sm font-bold text-[#432744]">{booking.customer}</p>
                                <p className="mt-0.5 text-[11px] text-[#d08ca9]">{booking.customerMeta}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-[#6d5669]">{booking.service}</td>
                          <td className="px-4 py-4">
                            <img
                              src={booking.design}
                              alt={booking.service}
                              className="h-9 w-9 rounded-xl object-cover shadow-sm"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <StatusChip label={booking.status} className={booking.statusTone} />
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${booking.actionTone}`}
                            >
                              {booking.actionLabel}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Current Customer">
                <div className="flex items-start gap-3">
                  <img
                    src="https://ui-avatars.com/api/?name=Chloe+Park&background=fde7ef&color=8f365c&bold=true"
                    alt="Chloe Park"
                    className="h-12 w-12 rounded-full border border-[#f6d3e3]"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-sm font-extrabold text-[#432744]">Chloe Park</p>
                    <p className="mt-1 text-[11px] text-[#c28ca6]">Booking #61 · 24/05 · 12:00 PM</p>
                    <StatusChip label="Nail Art Design" className="mt-2 bg-[#fff1f5] text-[#f06292]" />
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[18px] bg-[#f7eef4]">
                  <img
                    src="https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80"
                    alt="Current nail design"
                    className="h-40 w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="mt-4 space-y-3 text-[11px] leading-5 text-[#866d80]">
                  <div>
                    <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Notes</p>
                    <p className="mt-1">Prefers soft pink tones. Wants floral pattern on ring fingers.</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Allergies</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <StatusChip label="Acrylic Powder" className="bg-[#fff1f5] text-[#f06292]" />
                      <StatusChip label="Formaldehyde" className="bg-[#fff4df] text-[#df8e1d]" />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Booked At</p>
                      <p className="mt-1">Today, 12:00 PM · Est. 75 min</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Last Visit</p>
                      <p className="mt-1">June 28, 2025 · Gel Manicure</p>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel
                title="Performance Snapshot"
                action={
                  <StatusChip
                    label="This Month"
                    className="border border-[#f6d3e3] bg-[#fff1f6] text-[#b48aa0]"
                  />
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["4.9", "Avg Rating", "★★★★★"],
                    ["127", "Total Reviews", "Monthly"],
                    ["84", "Monthly Bookings", "Completed"],
                    ["96%", "Satisfaction Rate", "Positive"],
                  ].map(([value, label, note]) => (
                    <div
                      key={label}
                      className="rounded-[16px] border border-[#f8dce8] bg-[#fff9fc] px-4 py-3"
                    >
                      <p className="text-xl font-extrabold text-[#ea4f93]">{value}</p>
                      <p className="mt-1 text-xs font-bold text-[#432744]">{label}</p>
                      <p className="mt-1 text-[11px] text-[#c28ca6]">{note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[18px] border border-[#f8dce8] bg-[#fff9fc] p-4">
                  <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-[#ea4f93]" />
                    <p className="text-xs font-extrabold text-[#432744]">Monthly Tips Breakdown</p>
                  </div>
                  <div className="mt-4 flex items-end gap-3">
                    {MONTHLY_TIPS.map(([week, amount, height]) => (
                      <div key={week} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-24 w-full items-end rounded-xl bg-[#fde8f0] px-1.5 pb-1.5">
                          <div
                            className="w-full rounded-xl bg-[linear-gradient(180deg,#f6a7c5_0%,#ea4f93_100%)]"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-[#b48aa0]">{week}</p>
                          <p className="mt-1 text-[10px] text-[#c28ca6]">{amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>
          </div>

          <aside className="space-y-4">
            <Panel title="Next Customer" icon={Sparkles}>
              <div className="flex items-start gap-3">
                <img
                  src="https://ui-avatars.com/api/?name=Emma+Davis&background=fde7ef&color=8f365c&bold=true"
                  alt="Emma Davis"
                  className="h-11 w-11 rounded-full border border-[#f6d3e3]"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-sm font-extrabold text-[#432744]">Emma Davis</p>
                  <p className="mt-1 text-[11px] text-[#c28ca6]">Gel Polish + Tips</p>
                </div>
              </div>

              <div className="mt-4 rounded-[14px] border border-[#f6d3e3] bg-[#fff1f5] px-3 py-2 text-xs font-bold text-[#ea4f93]">
                2:30 PM · In 45 minutes
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Duration", "60 min"],
                  ["Price", "$65"],
                  ["Visits", "3rd"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[14px] border border-[#f8dce8] bg-[#fff9fc] px-3 py-3 text-center"
                  >
                    <p className="text-[10px] text-[#c28ca6]">{label}</p>
                    <p className="mt-1 text-xs font-extrabold text-[#432744]">{value}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Session Timer" icon={Clock3}>
              <div className="text-center">
                <p className="text-[2.2rem] font-extrabold tracking-[0.08em] text-[#d94e85]">
                  00:00:00
                </p>
                <p className="mt-2 text-[11px] text-[#c28ca6]">Session not started</p>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-[image:var(--gradient-accent)] px-4 py-2.5 text-xs font-bold text-white"
                >
                  Start Session
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-[#f6d3e3] bg-[#fff1f5] px-4 py-2.5 text-xs font-bold text-[#ea4f93]"
                >
                  Reset
                </button>
              </div>
            </Panel>

            <Panel title="Break Schedule" icon={TimerReset}>
              <div className="space-y-3">
                {BREAK_SCHEDULE.map((item) => (
                  <div
                    key={item.time}
                    className="rounded-[14px] border border-[#f8dce8] bg-[#fff9fc] px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-extrabold text-[#432744]">{item.time}</p>
                      <StatusChip label={item.badge} className={item.tone} />
                    </div>
                    <p className="mt-1 text-[11px] text-[#c28ca6]">{item.note}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Latest Review" icon={MessageSquareText}>
              <div className="flex items-center gap-1 text-[#f5a623]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={12} fill="currentColor" />
                ))}
              </div>

              <p className="mt-3 text-[12px] leading-6 text-[#6f5b6d]">
                &quot;Linh is detail-oriented and quick. My nails have never looked this beautiful.
                The floral design she did was exactly what I envisioned.&quot;
              </p>

              <div className="mt-4">
                <p className="text-xs font-extrabold text-[#ea4f93]">Sophie Tran</p>
                <p className="mt-1 text-[11px] text-[#c28ca6]">Today · 10:40 AM session</p>
              </div>

              <div className="mt-4 border-t border-[#f8dce8] pt-4">
                <p className="text-[11px] text-[#c28ca6]">This month&apos;s review reactions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {REVIEW_REACTIONS.map((item) => (
                    <StatusChip
                      key={item.label}
                      label={item.value}
                      className={item.tone}
                    />
                  ))}
                </div>
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </section>
  );
}
