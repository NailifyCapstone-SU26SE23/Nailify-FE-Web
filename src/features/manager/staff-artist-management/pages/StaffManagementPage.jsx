import {
  ArrowRightLeft,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Star,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROUTES, getManagerStaffUpdateRoute } from "../../../../shared/constants/routes";
import {
  LOW_RATING_ALERTS,
  PERFORMANCE_OVERVIEW,
  QUICK_ACTIONS,
  SCHEDULE_DAY_KEYS,
  SCHEDULE_STATUS_STYLES,
  STAFF_ALERTS,
  STAFF_ARTISTS,
  STAFF_FILTER_TABS,
  STAFF_MINI_STATS,
  STAFF_ON_LEAVE,
  STAFF_STATUS_STYLES,
  STAFF_SUMMARY_STATS,
  TOP_PERFORMER,
  WEEKLY_SCHEDULE,
  WORKLOAD_BALANCE,
  filterStaffByStatus,
  getStaffInitials,
} from "../services/mockStaffArtists";

const SUMMARY_ICON_MAP = {
  users: Users,
  check: CheckCircle2,
  star: Star,
  clipboard: ClipboardList,
};

const ACTION_ICON_MAP = {
  calendar: CalendarDays,
  award: Award,
  chart: BarChart3,
  arrow: ArrowRightLeft,
};

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

function SummaryStatCard({ item }) {
  const Icon = SUMMARY_ICON_MAP[item.icon] ?? Users;

  return (
    <Card className="p-4">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.iconClassName}`}>
        <Icon size={16} />
      </div>
      <p className="mt-3 text-[1.65rem] font-extrabold leading-none text-[#3b2241]">{item.value}</p>
      <p className="mt-2 text-[13px] font-semibold text-[#7f6478]">{item.label}</p>
    </Card>
  );
}

SummaryStatCard.propTypes = {
  item: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    iconClassName: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }).isRequired,
};

function StaffArtistCard({ staff }) {
  return (
    <div className="rounded-[16px] border border-[#f8deea] bg-[#fffafb] p-4">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${staff.avatarTone} text-xs font-bold text-white`}
        >
          {getStaffInitials(staff.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-[#402542]">{staff.name}</p>
          <p className="text-xs text-[#c08aa4]">{staff.role}</p>
          <div className="mt-1 flex items-center gap-1 text-[#fbbf24]">
            <Star size={12} fill="currentColor" />
            <span className="text-xs font-bold text-[#ea4f93]">{staff.rating.toFixed(1)}</span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STAFF_STATUS_STYLES[staff.status]}`}
        >
          {staff.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {staff.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-[#ffe7ef] px-2 py-0.5 text-[9px] font-bold text-[#ea4f93]"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          [staff.stats.today, "Today's Bookings"],
          [staff.stats.month, "This Month"],
          [staff.stats.revenue, "Revenue"],
        ].map(([value, label]) => (
          <div key={label}>
            <p className="text-sm font-extrabold text-[#402542]">{value}</p>
            <p className="mt-0.5 text-[9px] text-[#c08aa4]">{label}</p>
          </div>
        ))}
      </div>

      <Link
        to={getManagerStaffUpdateRoute(staff.id)}
        className="mt-4 block w-full rounded-full border border-[#f4c1d8] bg-white py-2 text-center text-xs font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
      >
        Edit Profile
      </Link>
    </div>
  );
}

StaffArtistCard.propTypes = {
  staff: PropTypes.shape({
    avatarTone: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    role: PropTypes.string.isRequired,
    skills: PropTypes.arrayOf(PropTypes.string).isRequired,
    stats: PropTypes.shape({
      month: PropTypes.number.isRequired,
      revenue: PropTypes.string.isRequired,
      today: PropTypes.number.isRequired,
    }).isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
};

function ScheduleCell({ value }) {
  if (value === "Off") {
    return <span className="text-[11px] text-[#c08aa4]">Off</span>;
  }

  return (
    <span className="inline-block rounded-md bg-[#ffe7ef] px-2 py-1 text-[10px] font-bold text-[#ea4f93]">
      {value}
    </span>
  );
}

ScheduleCell.propTypes = {
  value: PropTypes.string.isRequired,
};

export function StaffManagementPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredStaff = useMemo(
    () => filterStaffByStatus(STAFF_ARTISTS, activeFilter),
    [activeFilter],
  );

  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAFF_SUMMARY_STATS.map((item) => (
          <SummaryStatCard key={item.label} item={item} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = ACTION_ICON_MAP[action.icon] ?? CalendarDays;

          return (
            <button
              key={action.label}
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] shadow-[0_8px_18px_rgba(236,72,153,0.06)] transition hover:bg-[#fff7fb]"
            >
              <Icon size={14} />
              {action.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading
                title="Staff Artist Management"
                subtitle="Manage staff schedules, skills, ratings, and performance"
              />
              <Link
                to={ROUTES.managerStaffArtistsCreate}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-[#ea4f93] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_22px_rgba(234,79,147,0.22)] transition hover:bg-[#df4588]"
              >
                <UserPlus size={14} />
                Add Staff Artist
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {STAFF_MINI_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-3 py-2.5 text-center"
                >
                  <p className="text-lg font-extrabold text-[#ea4f93]">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] text-[#c08aa4]">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {STAFF_FILTER_TABS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={
                    activeFilter === filter
                      ? "rounded-full bg-[#ea4f93] px-4 py-1.5 text-[11px] font-bold text-white"
                      : "rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-4 py-1.5 text-[11px] font-bold text-[#c08aa4]"
                  }
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredStaff.map((staff) => (
                <StaffArtistCard key={staff.id} staff={staff} />
              ))}
            </div>

            {filteredStaff.length === 0 ? (
              <div className="mt-5 rounded-[14px] border border-[#f8deea] bg-[#fffafb] px-4 py-8 text-center text-sm text-[#8a7082]">
                No staff artists matched the current filter.
              </div>
            ) : null}
          </Card>

          <Card className="p-0">
            <div className="flex flex-col gap-3 border-b border-[#f6dce7] p-5 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading title="Weekly Schedule" />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-4 py-1.5 text-[11px] font-bold text-[#ea4f93]"
              >
                <CalendarDays size={12} />
                This Week
              </button>
            </div>
            <div className="overflow-x-auto p-5 pt-0">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-[#f6dce7] bg-[#fffafd] text-[10px] uppercase tracking-[0.14em] text-[#c693ad]">
                    <th className="px-3 py-3">Staff</th>
                    {SCHEDULE_DAY_KEYS.map((day) => (
                      <th key={day} className="px-2 py-3 text-center">
                        {day}
                      </th>
                    ))}
                    <th className="px-3 py-3">Break</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEKLY_SCHEDULE.map((row) => (
                    <tr key={row.name} className="border-b border-[#fbe7ef] last:border-b-0">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${row.avatarTone} text-[9px] font-bold text-white`}
                          >
                            {getStaffInitials(row.name)}
                          </div>
                          <span className="text-sm font-semibold text-[#402542]">{row.name}</span>
                        </div>
                      </td>
                      {SCHEDULE_DAY_KEYS.map((day) => (
                        <td key={day} className="px-2 py-3 text-center">
                          <ScheduleCell value={row.days[day]} />
                        </td>
                      ))}
                      <td className="px-3 py-3 text-xs text-[#7a6176]">{row.break}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${SCHEDULE_STATUS_STYLES[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading title="Performance Overview" />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#f4c1d8] bg-[#fff7fb] px-4 py-1.5 text-[11px] font-bold text-[#ea4f93]"
              >
                <TrendingUp size={12} />
                This Month
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {PERFORMANCE_OVERVIEW.map((item) => (
                <div
                  key={item.name}
                  className="rounded-[16px] border border-[#f8deea] bg-[#fffafb] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${item.avatarTone} text-[10px] font-bold text-white`}
                    >
                      {getStaffInitials(item.name)}
                    </div>
                    <div>
                      <p className="font-extrabold text-[#402542]">{item.name}</p>
                      <p className="text-xs text-[#c08aa4]">{item.role}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      [item.metrics.completed, "Completed Bookings"],
                      [item.metrics.rating, "Avg Rating"],
                      [item.metrics.revenue, "Revenue"],
                      [item.metrics.satisfaction, "Satisfaction"],
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className="rounded-[12px] border border-[#f8deea] bg-white px-3 py-2"
                      >
                        <p className="text-sm font-extrabold text-[#ea4f93]">{value}</p>
                        <p className="mt-0.5 text-[9px] text-[#c08aa4]">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[12px] border border-[#f8deea] bg-white p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c08aa4]">
                      Testimonial
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[#7a6176]">
                      &ldquo;{item.testimonial}&rdquo;
                    </p>
                    <p className="mt-2 text-[11px] font-bold text-[#ea4f93]">— {item.client}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Star size={16} className="text-[#f59e0b]" fill="#f59e0b" />
              <SectionHeading title="Top Performer" />
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br p-1 ring-4 ring-[#f3ebff]">
                <div
                  className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${TOP_PERFORMER.avatarTone} text-lg font-bold text-white`}
                >
                  {getStaffInitials(TOP_PERFORMER.name)}
                </div>
              </div>
              <p className="mt-4 font-extrabold text-[#402542]">{TOP_PERFORMER.name}</p>
              <p className="text-xs text-[#c08aa4]">{TOP_PERFORMER.role}</p>
              <div className="mt-3 rounded-full bg-gradient-to-r from-[#fef3c7] via-[#fde68a] to-[#fbbf24] px-4 py-1.5 text-[10px] font-bold text-[#92400e]">
                {TOP_PERFORMER.badge}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  [TOP_PERFORMER.stats.bookings, "Bookings"],
                  [TOP_PERFORMER.stats.rating, "Rating"],
                  [TOP_PERFORMER.stats.revenue, "Revenue"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-2 py-2">
                    <p className="text-sm font-extrabold text-[#ea4f93]">{value}</p>
                    <p className="text-[9px] text-[#c08aa4]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Clock3 size={16} className="text-[#ea4f93]" />
              <SectionHeading title="Staff On Leave" />
            </div>
            <div className="space-y-3">
              {STAFF_ON_LEAVE.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${item.avatarTone} text-[9px] font-bold text-white`}
                    >
                      {getStaffInitials(item.name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#402542]">{item.name}</p>
                      <p className="text-[10px] text-[#c08aa4]">{item.dates}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#ffe6ec] px-2 py-0.5 text-[10px] font-bold text-[#e1447f]">
                    {item.days}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Star size={16} className="text-[#e1447f]" />
              <SectionHeading title="Low Rating Alert" />
            </div>
            <div className="space-y-3">
              {LOW_RATING_ALERTS.map((alert) => (
                <div
                  key={alert.name}
                  className="rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#402542]">{alert.name}</p>
                    <span className="text-xs font-bold text-[#ea4f93]">{alert.rating} ★</span>
                  </div>
                  <p className={`mt-1 text-[11px] ${alert.tone}`}>{alert.message}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeading title="Staff Alerts" subtitle="Ratings needing attention" />
            <div className="mt-4 space-y-3">
              {STAFF_ALERTS.map((alert) => (
                <div
                  key={alert.name}
                  className="flex items-center justify-between gap-3 rounded-[12px] border border-[#f8deea] bg-[#fffafb] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-bold text-[#402542]">{alert.name}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${alert.tone}`}>
                      {alert.message}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#ea4f93]">{alert.rating}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeading title="Workload Balance" />
            <div className="mt-4 space-y-4">
              {WORKLOAD_BALANCE.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.avatarTone} text-[9px] font-bold text-white`}
                  >
                    {getStaffInitials(item.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#402542]">{item.name}</span>
                      <span className="font-bold text-[#ea4f93]">{item.percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#fbe1ec]">
                      <div
                        className="h-full rounded-full bg-[#ea4f93]"
                        style={{ width: `${item.percent}%` }}
                      />
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
