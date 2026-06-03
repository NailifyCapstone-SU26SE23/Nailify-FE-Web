import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Search,
  UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROLES } from "../../../shared/constants/roles";
import {
  BOOKING_ROLE_CONFIG,
  BOOKING_ROWS,
  BOOKING_STATUS_FILTERS,
  BOOKING_STATUS_STYLES,
  BOOKING_SUMMARY_BY_ROLE,
} from "../services/mockBookings";

function getRoleFromPath(pathname) {
  if (pathname.startsWith("/admin")) {
    return ROLES.admin;
  }

  if (pathname.startsWith("/manager")) {
    return ROLES.manager;
  }

  return ROLES.staff;
}

export function BookingManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = getRoleFromPath(location.pathname);
  const roleConfig = BOOKING_ROLE_CONFIG[role];
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [flashMessage] = useState(location.state?.flashMessage ?? "");

  useEffect(() => {
    if (!location.state?.flashMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const filteredBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return BOOKING_ROWS.filter((booking) => {
      const matchesStatus =
        statusFilter === "All" || booking.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          booking.id,
          booking.customerName,
          booking.customerPhone,
          booking.branch,
          booking.service,
          booking.staffName,
          booking.channel,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      if (role === ROLES.staff) {
        return (
          matchesStatus &&
          matchesQuery &&
          ["Ariana Vo", "Bao Tran", "Linh Pham"].includes(booking.staffName)
        );
      }

      if (role === ROLES.manager) {
        return (
          matchesStatus &&
          matchesQuery &&
          ["District 1 Salon", "District 3 Salon"].includes(booking.branch)
        );
      }

      return matchesStatus && matchesQuery;
    });
  }, [query, role, statusFilter]);

  const summaryItems = BOOKING_SUMMARY_BY_ROLE[role];

  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_40px_rgba(94,76,62,0.08)]">
        <div className="h-3 bg-[image:var(--gradient-accent)]" />
        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:items-start md:p-8">
          <div className="max-w-full md:max-w-[28rem]">
            <p className="text-sm uppercase tracking-[0.24em] text-[#d45b9f]">
              {roleConfig.badge}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
              {roleConfig.title}
            </h2>
            <p className="mt-3 text-base leading-8 text-[var(--color-muted)]">
              {roleConfig.description}
            </p>
          </div>

          <div className="rounded-[24px] bg-[linear-gradient(180deg,#fff5f9_0%,#fff8e8_100%)] p-4 text-sm text-[var(--color-muted)] shadow-[0_14px_30px_rgba(94,76,62,0.06)] sm:p-5">
            <div className="flex items-center gap-3 text-[var(--color-ink)]">
              <div className="rounded-2xl bg-white p-3 shadow-[0_12px_24px_rgba(94,76,62,0.08)]">
                <ClipboardList size={18} className="text-[#d45b9f]" />
              </div>
              <div>
                <p className="font-semibold">{roleConfig.panelTitle}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-[#d45b9f]">
                  {roleConfig.permissionLabel}
                </p>
              </div>
            </div>
            <p className="mt-4 leading-6">{roleConfig.panelDescription}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryItems.map((item) => (
          <article
            key={item.label}
            className="rounded-[22px] bg-white p-5 shadow-[0_14px_30px_rgba(94,76,62,0.06)]"
          >
            <p className="text-sm uppercase tracking-[0.16em] text-[#d45b9f]">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {item.description}
            </p>
          </article>
        ))}
      </div>

      <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#d45b9f]">
              Booking Desk
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--color-ink)] sm:text-2xl">
              {roleConfig.listHeading}
            </h3>
          </div>

          <Link
            to={roleConfig.createRoute}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
          >
            <UserPlus size={16} />
            <span>{roleConfig.createLabel}</span>
          </Link>
        </div>

        {flashMessage ? (
          <div className="mt-6 rounded-[22px] bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f]">
            {flashMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block w-full xl:max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#c28c69]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by booking ID, customer, branch, service, or staff"
              className="w-full rounded-full border border-[#f1d7c0] bg-[#fffdfb] py-3 pl-11 pr-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[#ef6bb4]"
            />
          </label>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:mx-0 xl:flex-wrap xl:overflow-visible xl:px-0 xl:pb-0">
            {BOOKING_STATUS_FILTERS.map((option) => {
              const isActive = option === statusFilter;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatusFilter(option)}
                  className={
                    isActive
                      ? "shrink-0 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white"
                      : "shrink-0 rounded-full bg-[#fff6f0] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[#ffe9d7]"
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-3 md:hidden">
          {filteredBookings.map((booking) => (
            <article
              key={booking.id}
              className="rounded-[22px] border border-[#f4e4d7] bg-[#fffdfa] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffe3f0_0%,#fff2cf_100%)] text-[#c84b91]">
                  <CalendarClock size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-ink)]">
                    {booking.customerName}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {booking.service}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#d45b9f]">
                    {booking.id}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#b38769]">
                    Schedule
                  </p>
                  <p className="mt-1 text-[var(--color-ink)]">
                    {booking.bookingDate} at {booking.bookingTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#b38769]">
                    Staff
                  </p>
                  <p className="mt-1 text-[var(--color-muted)]">{booking.staffName}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-[var(--color-muted)]">
                    {booking.branch}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${BOOKING_STATUS_STYLES[booking.status]}`}
                  >
                    {booking.status}
                  </span>
                </div>
                <Link
                  to={roleConfig.getDetailRoute(booking.id)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#fff5ef] px-3 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[#ffe9d7]"
                >
                  <span>Manage</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-[22px] border border-[#f4e4d7] md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#f4e4d7]">
              <thead className="bg-[#fff8f2]">
                <tr className="text-left text-xs uppercase tracking-[0.16em] text-[#b38769]">
                  <th className="px-5 py-4 font-semibold">Booking</th>
                  <th className="px-5 py-4 font-semibold">Service</th>
                  <th className="px-5 py-4 font-semibold">Branch</th>
                  <th className="px-5 py-4 font-semibold">Staff</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Schedule</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7ebdf] bg-white">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffe3f0_0%,#fff2cf_100%)] text-[#c84b91]">
                          <CalendarClock size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--color-ink)]">
                            {booking.customerName}
                          </p>
                          <p className="mt-1 text-sm text-[var(--color-muted)]">
                            {booking.customerPhone}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#d45b9f]">
                            {booking.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-ink)]">
                      <p>{booking.service}</p>
                      <p className="mt-1 text-[var(--color-muted)]">{booking.channel}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                      {booking.branch}
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                      {booking.staffName}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${BOOKING_STATUS_STYLES[booking.status]}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--color-muted)]">
                      {booking.bookingDate} at {booking.bookingTime}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={roleConfig.getDetailRoute(booking.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#fff5ef] px-3 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[#ffe9d7]"
                      >
                        <span>Manage</span>
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="mt-6 rounded-[22px] border border-[#f4e4d7] bg-[#fffdfa] px-5 py-8 text-center text-sm text-[var(--color-muted)]">
            No bookings matched the current search and status filter.
          </div>
        ) : null}
      </article>
    </section>
  );
}
