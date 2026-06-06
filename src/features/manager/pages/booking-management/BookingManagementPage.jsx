import {
  CalendarOutlined,
  DownOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Input, Progress, Table, Tag } from "antd";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Target,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  BOOKING_APPOINTMENTS,
  BOOKING_CONFLICTS,
  BOOKING_STATUS_FILTERS,
  BOOKING_SUMMARY_CARDS,
  BOOKING_WAITLIST,
  CAPACITY_STATS,
  SCHEDULE_HOURS,
  SHIFT_CAPACITY,
  SMART_SLOT_SUGGESTIONS,
  STAFF_SCHEDULE,
  STAFF_WORKLOAD,
} from "../../services/mockBookingManagement";

const SUMMARY_ICON_MAP = {
  check: CheckCircle2,
  clock: Clock3,
  refresh: RefreshCw,
  target: Target,
  user: UserRound,
};

const SCHEDULE_VIEW_OPTIONS = ["Day", "Week", "Month"];

function formatPageDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date("2025-07-12"));
}

function matchesBookingFilter(row, filter) {
  if (filter === "All") return true;
  if (filter === "Pending") return row.status === "Pending";
  if (filter === "Confirmed") return row.status === "Confirmed";
  if (filter === "Checked In") return row.status === "Checked In" || row.status === "In Progress";
  if (filter === "Reschedule") return row.status === "Reschedule Req.";
  return true;
}

export function BookingManagementPage() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [scheduleView, setScheduleView] = useState("Day");

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return BOOKING_APPOINTMENTS.filter((row) => {
      if (!matchesBookingFilter(row, statusFilter)) return false;
      if (!query) return true;
      return (
        row.customer.toLowerCase().includes(query) ||
        row.service.toLowerCase().includes(query) ||
        row.artist.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, statusFilter]);

  const actionItems = [
    { key: "view", label: "View details" },
    { key: "edit", label: "Edit booking" },
    { key: "cancel", label: "Cancel booking" },
  ];

  const columns = [
    {
      title: "TIME",
      key: "time",
      width: 100,
      render: (_, row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.time}</p>
          <p className="text-xs text-slate-400">{row.duration}</p>
        </div>
      ),
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
      key: "artist",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${row.artistDot}`} />
          <span className="text-slate-600">{row.artist}</span>
        </div>
      ),
    },
    {
      title: "DEPOSIT",
      key: "deposit",
      width: 110,
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-900">{row.deposit}</p>
          <p className={`text-xs ${row.depositTone}`}>{row.depositStatus}</p>
        </div>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status, row) => (
        <Tag
          bordered={false}
          className={`rounded-full px-3 py-0.5 text-xs font-medium ${row.statusTone}`}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "ACTION",
      key: "action",
      width: 120,
      render: () => (
        <Dropdown menu={{ items: actionItems }} trigger={["click"]}>
          <button type="button" className="flex items-center gap-1 text-sm font-medium text-[#d45b9f]">
            Actions
            <DownOutlined style={{ fontSize: 10 }} />
          </button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
      {/* ── Main column ── */}
      <section className="min-w-0 flex-1 space-y-5">
        {/* Header */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#d45b9f] md:text-[26px]">Booking Management</h1>
            <p className="text-sm text-slate-500">
              Manage appointments, confirmations, and scheduling conflicts
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <CalendarOutlined className="text-[#d45b9f]" />
              {formatPageDate()}
            </div>
            <Button className="rounded-full border-rose-200 text-[#d45b9f]">Export</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="rounded-full border-none bg-[#d45b9f] shadow-sm hover:bg-[#c04a88]"
            >
              New Booking
            </Button>
          </div>
        </header>

        {/* Summary cards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {BOOKING_SUMMARY_CARDS.map((card) => {
            const Icon = SUMMARY_ICON_MAP[card.icon] ?? Clock3;
            return (
              <article
                key={card.label}
                className="rounded-2xl border border-white/80 bg-white p-4 shadow-[0_8px_24px_rgba(212,91,159,0.08)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
                  </div>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
                    <Icon size={16} strokeWidth={2.2} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Appointments table */}
        <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-base font-bold text-slate-900">Today&apos;s Appointments</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                {BOOKING_STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      statusFilter === filter
                        ? "bg-[#d45b9f] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <Input
                allowClear
                placeholder="Search customer, service..."
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full sm:w-56"
              />
            </div>
          </div>
          <Table
            columns={columns}
            dataSource={filteredAppointments}
            pagination={false}
            rowKey="id"
            size="middle"
            scroll={{ x: 900 }}
            className="booking-management-table"
          />
        </article>

        {/* Staff Schedule */}
        <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Staff Schedule — Day View</h2>
              <p className="text-xs text-slate-500">Saturday, July 12, 2025</p>
            </div>
            <div className="flex items-center gap-2">
              {SCHEDULE_VIEW_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScheduleView(option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    scheduleView === option
                      ? "bg-[#d45b9f] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              {/* Hour headers */}
              <div
                className="mb-2 grid gap-2"
                style={{ gridTemplateColumns: "140px repeat(9, minmax(56px, 1fr))" }}
              >
                <div />
                {SCHEDULE_HOURS.map((hour) => (
                  <div key={hour} className="text-center text-[11px] font-medium text-slate-400">
                    {hour}
                  </div>
                ))}
              </div>

              {/* Staff rows */}
              <div className="space-y-3">
                {STAFF_SCHEDULE.map((staff) => (
                  <div key={staff.name} className="grid gap-2" style={{ gridTemplateColumns: "140px 1fr" }}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${staff.dotColor}`} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900">{staff.name}</p>
                        <p className="truncate text-[10px] text-slate-400">{staff.role}</p>
                      </div>
                    </div>
                    <div className="relative grid grid-cols-9 gap-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="h-10 rounded-md bg-slate-50" />
                      ))}
                      {staff.blocks.map((block) => (
                        <div
                          key={`${staff.name}-${block.label}`}
                          className={`absolute top-0 flex h-10 items-center justify-center rounded-md px-1 text-[10px] font-medium text-white ${
                            block.conflict ? "bg-red-500" : staff.blockColor
                          }`}
                          style={{
                            left: `${((block.startCol - 1) / 9) * 100}%`,
                            width: `calc(${(block.span / 9) * 100}% - 4px)`,
                          }}
                        >
                          <span className="truncate">{block.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* Smart Slot Suggestions */}
        <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Smart Slot Suggestions</h2>
            <p className="text-xs text-slate-500">
              AI-recommended openings based on staff availability &amp; service type
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {SMART_SLOT_SUGGESTIONS.map((slot) => (
              <div
                key={slot.time + slot.staff}
                className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-bold text-slate-900">{slot.time}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${slot.difficultyTone}`}>
                    {slot.difficulty}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{slot.detail}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${slot.avatarTone} text-[10px] font-bold text-white`}
                  >
                    {slot.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{slot.staff}</p>
                    <p className="text-[10px] text-slate-400">{slot.staffAppts}</p>
                  </div>
                </div>
                {slot.duration && (
                  <p className="mt-2 text-[10px] text-slate-500">{slot.duration}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1">
                  {slot.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-400">{slot.complexity}</p>
                <Button
                  type="primary"
                  block
                  className="mt-auto rounded-full border-none bg-[#d45b9f] hover:bg-[#c04a88]"
                  style={{ marginTop: 16 }}
                >
                  Book This Slot
                </Button>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* ── Right Sidebar ── */}
      <aside className="w-full shrink-0 space-y-4 xl:w-[320px]">

        {/* Today's Capacity */}
        <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
          <h2 className="text-base font-bold text-slate-900">Today&apos;s Capacity</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {CAPACITY_STATS.map((stat) => (
              <div key={stat.label}>
                <p className={`text-xl font-bold ${stat.tone}`}>{stat.value}</p>
                <p className="text-[10px] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {SHIFT_CAPACITY.map((shift) => (
              <div key={shift.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">{shift.label}</span>
                  <span className="font-medium text-slate-700">{shift.slots}</span>
                </div>
                <Progress
                  percent={shift.percent}
                  showInfo={false}
                  strokeColor={shift.tone}
                  trailColor="#fce7f3"
                  size="small"
                />
              </div>
            ))}
          </div>
        </article>

        {/* Staff Workload */}
        <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
          <h2 className="text-base font-bold text-slate-900">Staff Workload</h2>
          <div className="mt-4 space-y-3">
            {STAFF_WORKLOAD.map((staff) => (
              <div key={staff.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">{staff.name}</span>
                  <span className="font-medium text-slate-700">
                    {staff.current}/{staff.max}
                  </span>
                </div>
                <Progress
                  percent={(staff.current / staff.max) * 100}
                  showInfo={false}
                  strokeColor={staff.tone}
                  trailColor="#f1f5f9"
                  size="small"
                />
              </div>
            ))}
          </div>
        </article>

        {/* Waitlist */}
        <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
          <h2 className="text-base font-bold text-slate-900">Waitlist</h2>
          <div className="mt-4 space-y-3">
            {BOOKING_WAITLIST.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${item.color}`}
                >
                  {item.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.service}</p>
                </div>
                <p className="shrink-0 text-[11px] font-medium text-[#d45b9f]">{item.time}</p>
              </div>
            ))}
          </div>
        </article>

        {/* Booking Conflicts */}
        <article className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_8px_24px_rgba(212,91,159,0.08)]">
          <h2 className="text-base font-bold text-slate-900">Booking Conflicts</h2>
          <div className="mt-4 space-y-3">
            {BOOKING_CONFLICTS.map((conflict) => (
              <div key={conflict.title} className={`rounded-xl border-l-4 p-3 ${conflict.tone}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${conflict.iconTone}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{conflict.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{conflict.detail}</p>
                    {conflict.action && (
                      <button
                        type="button"
                        className="mt-2 text-xs font-semibold text-[#d45b9f] hover:underline"
                      >
                        {conflict.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </aside>

      <style>{`
        .booking-management-table .ant-table-thead > tr > th {
          background: #fafafa !important;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #64748b !important;
        }
        .booking-management-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
        }
      `}</style>
    </div>
  );
}