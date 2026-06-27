import {
  AlarmClock,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  LoaderCircle,
  MessageSquareText,
  PencilLine,
  Play,
  RefreshCcw,
  Sparkles,
  SquareCheckBig,
  Star,
  TimerReset,
  Trash2,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Table } from "antd";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import {
  getStaffBookingDetailRoute,
  getStaffBookingDesignStudioRoute,
  getStaffBookingServiceSessionRoute,
} from "../../../../shared/constants/routes";
import {
  buildStaffServiceSessionPayload,
  fetchStaffBookings,
  formatCurrency,
  formatTimeValue,
  getTodayDateParam,
  getStaffSessionUser,
  normalizeStaffBooking,
  startStaffBookingService,
} from "../../../staff/bookings/services/staffBookingService";

const BREAK_SCHEDULE = [
  { time: "11:15 AM", note: "15 min break", badge: "Done", tone: "bg-[#eefcf3] text-[#35b56b]" },
  { time: "1:30 PM", note: "30 min lunch", badge: "Next", tone: "bg-[#fff4df] text-[#df8e1d]" },
  { time: "3:45 PM", note: "15 min break", badge: "Later", tone: "bg-[#f4f5f7] text-[#8b95a7]" },
];

function formatDate(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatBookingWindow(booking) {
  const startTime = formatTimeValue(booking?.startTimeValue);

  if (!booking?.totalDuration || startTime === "--") {
    return startTime;
  }

  const [hours, minutes] = startTime.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return startTime;
  }

  const endDate = new Date();
  endDate.setHours(hours, minutes + Number(booking.totalDuration || 0), 0, 0);
  const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

  return `${startTime} - ${endTime}`;
}

function getStatusTone(status) {
  switch (status) {
    case "Completed":
      return "bg-[#e9fbef] text-[#2ca865]";
    case "In Progress":
    case "CheckedIn":
      return "bg-[#eaf2ff] text-[#5e8df7]";
    case "Confirmed":
      return "bg-[#eefcf3] text-[#35b56b]";
    case "Pending":
      return "bg-[#fff4df] text-[#df8e1d]";
    case "Cancelled":
      return "bg-[#fff1f5] text-[#f06292]";
    default:
      return "bg-[#f4f5f7] text-[#8b95a7]";
  }
}

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
    <span className={`inline-flex max-w-full break-words rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-normal ${className}`}>
      {label}
    </span>
  );
}

function Panel({ title, icon: Icon, children, action }) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white p-4 shadow-[0_12px_26px_rgba(236,72,153,0.06)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? <Icon size={14} className="text-[#ea4f93]" /> : null}
          <h3 className="min-w-0 text-sm font-extrabold text-[#432744]">{title}</h3>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MobileBookingCard({ booking, actions }) {
  return (
    <article className="w-full min-w-0 rounded-[18px] border border-[#f8dce8] bg-[#fff9fc] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#432744]">{booking.customerName}</p>
          <p className="mt-1 text-[11px] text-[#c28ca6]">{formatBookingWindow(booking)}</p>
        </div>
        <StatusChip label={booking.status} className={getStatusTone(booking.status)} />
      </div>

      <div className="mt-4 flex min-w-0 items-center gap-3">
        {booking.previewImage ? (
          <img
            src={booking.previewImage}
            alt={booking.service}
            className="h-12 w-12 rounded-2xl object-cover shadow-sm"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1f6] text-[10px] font-bold text-[#ea4f93]">
            --
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="break-words text-xs font-bold text-[#432744]">{booking.services.join(", ") || "--"}</p>
          <p className="mt-1 break-words text-[11px] text-[#8a7082]">{booking.uiBranch || "--"}</p>
        </div>

        <div className="shrink-0">
          <ActionDropdown items={actions} />
        </div>
      </div>
    </article>
  );
}

export function StaffDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const sessionUser = getStaffSessionUser();
  const todayDate = useMemo(() => getTodayDateParam(), []);

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchStaffBookings({
          pageNumber: 1,
          pageSize: 100,
          startDate: todayDate,
          endDate: todayDate,
        });

        if (!isMounted) {
          return;
        }

        setBookings(Array.isArray(data) ? data.map(normalizeStaffBooking) : []);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Failed to load today's bookings.";
        setError(message);
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBookings();

    return () => {
      isMounted = false;
    };
  }, [todayDate]);

  const sortedBookings = useMemo(
    () => [...bookings].sort((left, right) => left.bookingTime.localeCompare(right.bookingTime)),
    [bookings],
  );

  const currentBooking = useMemo(
    () => sortedBookings.find((booking) => ["In Progress", "CheckedIn", "Confirmed"].includes(booking.status)) ?? sortedBookings[0] ?? null,
    [sortedBookings],
  );
  const nextBooking = useMemo(
    () => sortedBookings.find((booking) => ["Pending", "Confirmed"].includes(booking.status)) ?? sortedBookings[1] ?? currentBooking,
    [currentBooking, sortedBookings],
  );

  const metrics = useMemo(() => {
    const completedCount = bookings.filter((booking) => booking.status === "Completed").length;
    const revenue = bookings.reduce((sum, booking) => sum + booking.totalPriceValue, 0);
    const nextAppointment = sortedBookings[0]?.bookingTime ?? "--";

    return [
      {
        label: "Today's Bookings",
        value: String(bookings.length),
        note: bookings.length ? `${Math.max(bookings.length - completedCount, 0)} remaining` : "No appointments",
        icon: CalendarDays,
        iconClassName: "bg-[#fff0f5] text-[#f06292]",
      },
      {
        label: "Completed",
        value: String(completedCount),
        note: "Today so far",
        icon: ClipboardList,
        iconClassName: "bg-[#eefcf3] text-[#35b56b]",
      },
      {
        label: "Assigned Services",
        value: String(bookings.reduce((sum, booking) => sum + booking.services.length, 0)),
        note: "Service items today",
        icon: Star,
        iconClassName: "bg-[#fff6eb] text-[#f5a623]",
      },
      {
        label: "Revenue",
        value: formatCurrency(revenue),
        note: "Loaded from API",
        icon: CircleDollarSign,
        iconClassName: "bg-[#f3efff] text-[#8b5cf6]",
      },
      {
        label: "Next Appt",
        value: nextAppointment,
        note: nextBooking?.customerName || "--",
        icon: AlarmClock,
        iconClassName: "bg-[#edf7ff] text-[#4ea1ff]",
      },
    ];
  }, [bookings, nextBooking, sortedBookings]);

  const getActionItems = (booking) => {
    const detailRoute = getStaffBookingDetailRoute(booking.id);
    const startService = async () => {
      try {
        const updatedBooking = await startStaffBookingService(booking.id);
        toast.success("Service started successfully.");
        navigate(getStaffBookingServiceSessionRoute(booking.id), {
          state: {
            serviceSession: buildStaffServiceSessionPayload(updatedBooking, {
              backRoute: detailRoute,
              designUpdateRoute: getStaffBookingDesignStudioRoute(booking.id),
            }),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to start service.";
        toast.error(message);
      }
    };

    return [
      { key: "view", label: "View Booking", icon: Eye, onSelect: () => navigate(detailRoute) },
      { key: "edit", label: "Edit Booking", icon: PencilLine, onSelect: () => navigate(detailRoute) },
      {
        key: "start",
        label: "Start Service",
        icon: Play,
        onSelect: () => void startService(),
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
  };

  const greetingName = sessionUser?.fullName || sessionUser?.email || "Artist";

  const bookingColumns = useMemo(() => ([
    {
      title: "Time",
      key: "time",
      render: (_, booking) => (
        <span className="text-sm font-bold text-[#3f2b3f]">{formatBookingWindow(booking)}</span>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, booking) => (
        <div className="flex items-center gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(booking.customerName)}&background=fde7ef&color=8f365c&bold=true`}
            alt={booking.customerName}
            className="h-9 w-9 rounded-full border border-[#f6d3e3]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <p className="text-sm font-bold text-[#432744]">{booking.customerName}</p>
        </div>
      ),
    },
    // {
    //   title: "Service",
    //   key: "service",
    //   render: (_, booking) => <span className="text-sm text-[#6d5669]">{booking.services.join(", ") || "--"}</span>,
    // },
    // {
    //   title: "Design",
    //   key: "design",
    //   render: (_, booking) => (
    //     booking.previewImage ? (
    //       <img
    //         src={booking.previewImage}
    //         alt={booking.service}
    //         className="h-9 w-9 rounded-xl object-cover shadow-sm"
    //         loading="lazy"
    //         referrerPolicy="no-referrer"
    //       />
    //     ) : (
    //       <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1f6] text-[10px] font-bold text-[#ea4f93]">
    //         --
    //       </div>
    //     )
    //   ),
    // },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => <StatusChip label={value} className={getStatusTone(value)} />,
    },
    {
      title: "Action",
      key: "action",
      render: (_, booking) => <ActionDropdown items={getActionItems(booking)} />,
    },
  ]), [getActionItems]);

  return (
    <section className="flex min-h-full w-full min-w-0 flex-col gap-4 overflow-x-hidden bg-[linear-gradient(180deg,#fff9fc_0%,#fff5fa_100%)]">
      <div className="flex w-full min-w-0 flex-col gap-4 rounded-[24px] border border-[#f6dbe8] bg-[#fff7fb] p-3 shadow-[0_14px_30px_rgba(236,72,153,0.05)] sm:p-4">
        <div className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-[#f4d5e3] bg-[linear-gradient(90deg,#ffe8f1_0%,#ffdce8_100%)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <p className="text-base font-extrabold text-[#ea4f93]">Good morning, {greetingName}!</p>
            <p className="mt-1 break-words text-sm text-[#b5859f]">
              {bookings.length
                ? `You have ${bookings.length} bookings scheduled for today.`
                : "No bookings have been assigned for today."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#f2bfd4] bg-white/70 px-4 py-2 text-xs font-bold text-[#ea4f93]"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-[16px] border border-[#f7d4df] bg-[#fff3f7] px-4 py-3 text-sm font-medium text-[#d14c84]">
            {error}
          </div>
        ) : null}

        <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((item) => (
            <MetricCard key={item.label} item={item} />
          ))}
        </div>

        <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1.62fr)_290px]">
          <div className="min-w-0 space-y-4">
            <div>
              <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                <h3 className="text-sm font-extrabold text-[#432744]">Today&apos;s Schedule</h3>
                <StatusChip
                  label={`${bookings.length} bookings`}
                  className="border border-[#f6d3e3] bg-[#fff1f6] text-[#b48aa0]"
                />
              </div>

              <section className="overflow-hidden rounded-[20px] border border-[#f8dce8] bg-white shadow-[0_12px_26px_rgba(236,72,153,0.06)]">
                {isLoading ? (
                  <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-[#b38a9f]">
                    <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
                    Loading today&apos;s schedule...
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 p-3 md:hidden">
                      {sortedBookings.map((booking) => (
                        <MobileBookingCard
                          key={booking.id}
                          booking={booking}
                          actions={getActionItems(booking)}
                        />
                      ))}
                      {!sortedBookings.length ? (
                        <div className="px-4 py-10 text-center text-sm text-[#8a7082]">
                          No bookings found for today.
                        </div>
                      ) : null}
                    </div>

                    <div className="hidden md:block">
                      <Table
                        rowKey="id"
                        columns={bookingColumns}
                        dataSource={sortedBookings}
                        pagination={false}
                        scroll={{ x: 980 }}
                        locale={{ emptyText: "No bookings found for today." }}
                      />
                    </div>
                  </>
                )}
              </section>
            </div>

            <div className="grid w-full min-w-0 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Current Customer">
                {currentBooking ? (
                  <>
                    <div className="flex items-start gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentBooking.customerName)}&background=fde7ef&color=8f365c&bold=true`}
                        alt={currentBooking.customerName}
                        className="h-12 w-12 rounded-full border border-[#f6d3e3]"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#432744]">{currentBooking.customerName}</p>
                        <p className="mt-1 break-words text-[11px] text-[#c28ca6]">
                          {currentBooking.uiId}
                          <span className="hidden sm:inline"> | </span>
                          <span className="block sm:inline">{formatDate(currentBooking.bookingDateTime)}</span>
                          <span className="hidden sm:inline"> | </span>
                          <span className="block sm:inline">{currentBooking.bookingTime}</span>
                        </p>
                        <StatusChip label={currentBooking.service} className="mt-2 bg-[#fff1f5] text-[#f06292]" />
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[18px] bg-[#f7eef4]">
                      {currentBooking.previewImage ? (
                        <img
                          src={currentBooking.previewImage}
                          alt={currentBooking.service}
                          className="h-40 w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center text-sm text-[#b38a9f]">
                          No reference image available
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-3 break-words text-[11px] leading-5 text-[#866d80]">
                      <div>
                        <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Services</p>
                        <p className="mt-1">{currentBooking.services.join(", ") || "--"}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Booking Status</p>
                        <p className="mt-1">{currentBooking.status}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Booked At</p>
                          <p className="mt-1">{currentBooking.bookingTime} | Est. {currentBooking.duration}</p>
                        </div>
                        <div>
                          <p className="font-bold uppercase tracking-[0.14em] text-[#d08ca9]">Total</p>
                          <p className="mt-1">{currentBooking.totalPriceLabel}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#8a7082]">No current customer assigned.</p>
                )}
              </Panel>

              <Panel
                title="Performance Snapshot"
                action={(
                  <StatusChip
                    label="Today"
                    className="border border-[#f6d3e3] bg-[#fff1f6] text-[#b48aa0]"
                  />
                )}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    [String(bookings.length), "Assigned Bookings", "From API"],
                    [String(bookings.filter((booking) => booking.status === "Completed").length), "Completed", "Today"],
                    [String(bookings.reduce((sum, booking) => sum + booking.services.length, 0)), "Service Items", "Planned"],
                    [formatCurrency(bookings.reduce((sum, booking) => sum + booking.totalPriceValue, 0)), "Revenue", "Loaded"],
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
                    <p className="text-xs font-extrabold text-[#432744]">Revenue Breakdown</p>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-[#8a6f83]">
                    {sortedBookings.slice(0, 4).map((booking) => (
                      <div key={booking.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className="break-words">{booking.customerName}</span>
                        <span className="font-bold text-[#ea4f93]">{booking.totalPriceLabel}</span>
                      </div>
                    ))}
                    {!sortedBookings.length ? <p className="text-[#b38a9f]">No revenue items for today.</p> : null}
                  </div>
                </div>
              </Panel>
            </div>
          </div>

          <aside className="min-w-0 space-y-4">
            <Panel title="Next Customer" icon={Sparkles}>
              {nextBooking ? (
                <>
                  <div className="flex items-start gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(nextBooking.customerName)}&background=fde7ef&color=8f365c&bold=true`}
                      alt={nextBooking.customerName}
                      className="h-11 w-11 rounded-full border border-[#f6d3e3]"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#432744]">{nextBooking.customerName}</p>
                      <p className="mt-1 break-words text-[11px] text-[#c28ca6]">{nextBooking.services.join(", ") || "--"}</p>
                    </div>
                  </div>

                  <div className="mt-4 break-words rounded-[14px] border border-[#f6d3e3] bg-[#fff1f5] px-3 py-2 text-xs font-bold text-[#ea4f93]">
                    {nextBooking.bookingTime} | {nextBooking.status}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      ["Duration", nextBooking.duration],
                      ["Price", nextBooking.totalPriceLabel],
                      ["Salon", nextBooking.uiBranch],
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
                </>
              ) : (
                <p className="text-sm text-[#8a7082]">No next customer scheduled.</p>
              )}
            </Panel>

            {/* <Panel title="Session Timer" icon={Clock3}>
              <div className="text-center">
                <p className="break-all text-[1.7rem] font-extrabold tracking-[0.04em] text-[#d94e85] sm:text-[2.2rem] sm:tracking-[0.08em]">
                  00:00:00
                </p>
                <p className="mt-2 text-[11px] text-[#c28ca6]">Session timer remains UI-only</p>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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
            </Panel> */}

            {/* <Panel title="Break Schedule" icon={TimerReset}>
              <div className="space-y-3">
                {BREAK_SCHEDULE.map((item) => (
                  <div
                    key={item.time}
                    className="rounded-[14px] border border-[#f8dce8] bg-[#fff9fc] px-3 py-3"
                  >
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <p className="text-xs font-extrabold text-[#432744]">{item.time}</p>
                      <StatusChip label={item.badge} className={item.tone} />
                    </div>
                    <p className="mt-1 text-[11px] text-[#c28ca6]">{item.note}</p>
                  </div>
                ))}
              </div>
            </Panel> */}

            <Panel title="Latest Review" icon={MessageSquareText}>
              <div className="flex items-center gap-1 text-[#f5a623]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={12} fill="currentColor" />
                ))}
              </div>

              <p className="mt-3 break-words text-[12px] leading-6 text-[#6f5b6d]">
                Review data is not returned by the booking API yet. This card remains a placeholder for staff feedback.
              </p>

              <div className="mt-4">
                <p className="text-xs font-extrabold text-[#ea4f93]">{currentBooking?.customerName || "--"}</p>
                <p className="mt-1 text-[11px] text-[#c28ca6]">{currentBooking?.bookingTime || "--"} session</p>
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </section>
  );
}
