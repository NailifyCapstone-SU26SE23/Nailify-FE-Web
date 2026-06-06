import {
  BellOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Progress, Table, Tag } from "antd";
import {
  AlertTriangle,
  Armchair,
  CalendarDays,
  Clock3,
  DollarSign,
  Star,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  MANAGER_KPI_CARDS,
  MANAGER_QUEUE_OVERVIEW,
  MANAGER_QUICK_STATUS,
  MANAGER_REVIEWS,
  MANAGER_SCHEDULE_FILTERS,
  MANAGER_SCHEDULE_ROWS,
  MANAGER_STAFF_AVAILABILITY,
  MANAGER_URGENT_ISSUES,
} from "../../manager/services/mockManagerDashboard";

const KPI_ICON_MAP = {
  calendar: CalendarDays,
  chair: Armchair,
  clock: Clock3,
  dollar: DollarSign,
  user: UserOutlined,
  users: Users,
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatTodayDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function StaffAvatar({ member }) {
  if (member.image) {
    return (
      <img
        src={member.image}
        alt={member.name}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${member.avatarTone} text-xs font-bold text-white`}
    >
      {member.initials}
    </div>
  );
}

function ReviewAvatar({ review }) {
  if (review.image) {
    return (
      <img
        src={review.image}
        alt={review.name}
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${review.avatarTone} text-[10px] font-bold text-white`}
    >
      {review.initials}
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={12}
          className={index < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
        />
      ))}
    </div>
  );
}

export function ManagerDashboardPage() {
  const { user } = useAuth();
  const [scheduleFilter, setScheduleFilter] = useState("All");
  const displayName = user?.fullName?.split(" ")[0] ?? "Linh";

  const filteredSchedule = useMemo(() => {
    if (scheduleFilter === "All") {
      return MANAGER_SCHEDULE_ROWS;
    }

    return MANAGER_SCHEDULE_ROWS.filter((row) => {
      if (scheduleFilter === "Waiting") {
        return row.status === "Waiting";
      }

      if (scheduleFilter === "In Progress") {
        return row.status === "In Progress";
      }

      if (scheduleFilter === "Completed") {
        return row.status === "Completed";
      }

      return true;
    });
  }, [scheduleFilter]);

  const scheduleColumns = [
    {
      title: "TIME",
      dataIndex: "time",
      key: "time",
      width: 90,
      render: (time) => <span className="font-semibold text-slate-900">{time}</span>,
    },
    {
      title: "CUSTOMER",
      key: "customer",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 to-pink-200 text-[10px] font-bold text-white">
            {row.customer
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{row.customer}</p>
            <p className="text-xs text-slate-400">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      title: "SERVICE",
      dataIndex: "service",
      key: "service",
      render: (service) => <span className="text-slate-600">{service}</span>,
    },
    {
      title: "STAFF ARTIST",
      dataIndex: "artist",
      key: "artist",
      render: (artist) => <span className="text-slate-600">{artist}</span>,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status, row) => (
        <Tag bordered={false} className={`rounded-full px-3 py-0.5 text-xs font-medium ${row.statusTone}`}>
          {status}
        </Tag>
      ),
    },
    {
      title: "ACTION",
      dataIndex: "action",
      key: "action",
      width: 110,
      render: (action) => (
        <button type="button" className="text-sm font-medium text-[#d45b9f] hover:text-[#c04a88]">
          {action}
        </button>
      ),
    },
  ];

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#d45b9f] md:text-[26px]">
            Salon Manager Dashboard
          </h1>
          <p className="mt-1 text-lg font-semibold text-slate-800">
            {getGreeting()}, {displayName} 👋
          </p>
          <p className="text-sm text-slate-500">Here is today&apos;s salon operation overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            <CalendarOutlined className="text-[#d45b9f]" />
            {formatTodayDate()}
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-100 bg-white text-[#d45b9f] shadow-sm"
          >
            <BellOutlined />
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {MANAGER_KPI_CARDS.map((card) => {
          const IconComponent =
            card.icon === "user" ? UserOutlined : KPI_ICON_MAP[card.icon] ?? CalendarDays;

          return (
            <article
              key={card.label}
              className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_8px_24px_rgba(212,91,159,0.08)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className={`mt-1 text-xs font-medium ${card.changeTone}`}>{card.change}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
                  {card.icon === "user" ? (
                    <IconComponent style={{ fontSize: 16 }} />
                  ) : (
                    <IconComponent size={16} strokeWidth={2.2} />
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Staff Availability</h2>
            <p className="text-xs text-slate-500">8 staff members on shift today</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MANAGER_STAFF_AVAILABILITY.map((member) => (
              <div
                key={member.name}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <StaffAvatar member={member} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{member.name}</p>
                    <p className="truncate text-xs text-slate-500">{member.role}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${member.dotTone}`} />
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${member.statusTone}`}>
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Queue Overview</h2>
              <p className="text-xs text-slate-500">Updated just now</p>
            </div>
            <ClockCircleOutlined className="text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MANAGER_QUEUE_OVERVIEW.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border p-4 ${item.tone}`}
              >
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="mt-1 text-[11px] font-medium leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Today&apos;s Schedule</h2>
            <p className="text-xs text-slate-500">Manage and track all appointments</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MANAGER_SCHEDULE_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setScheduleFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  scheduleFilter === filter
                    ? "bg-[#d45b9f] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <Table
          columns={scheduleColumns}
          dataSource={filteredSchedule}
          pagination={false}
          rowKey="id"
          size="middle"
          className="manager-schedule-table"
        />
      </article>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
          <h2 className="text-base font-bold text-slate-900">Quick Status</h2>
          <div className="mt-4 space-y-3">
            {MANAGER_QUICK_STATUS.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.tone}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Capacity Bar</span>
              <span className="font-medium text-slate-700">6 / 8 chairs</span>
            </div>
            <Progress
              percent={75}
              showInfo={false}
              strokeColor="#d45b9f"
              trailColor="#fce7f3"
              size="small"
            />
          </div>
        </article>

        <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
          <h2 className="text-base font-bold text-slate-900">Urgent Issues</h2>
          <div className="mt-4 space-y-3">
            {MANAGER_URGENT_ISSUES.map((issue) => (
              <div
                key={issue.title}
                className={`rounded-xl border-l-4 p-3 ${issue.tone}`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${issue.iconTone}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{issue.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{issue.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">Review</h2>
          <p className="text-xs text-slate-500">Recent customer feedback from Google Reviews</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {MANAGER_REVIEWS.map((review) => (
            <div
              key={review.name + review.time}
              className="min-w-[240px] flex-1 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
            >
              <div className="flex items-center gap-3">
                <ReviewAvatar review={review} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{review.name}</p>
                  <StarRating rating={review.rating} />
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">{review.text}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">{review.time}</span>
                <button type="button" className="text-[10px] font-medium text-[#d45b9f]">
                  Google Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <style>{`
        .manager-schedule-table .ant-table-thead > tr > th {
          background: #fafafa !important;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #64748b !important;
        }
        .manager-schedule-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
        }
      `}</style>
    </section>
  );
}
