import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Eye, LoaderCircle, RefreshCcw, Search, SquareCheckBig, UserPlus, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Table } from "antd";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import {
  ROUTES,
  getReceptionistBookingDetailRoute,
} from "../../../../shared/constants/routes";
import {
  confirmReceptionistBooking,
  fetchReceptionistBookings,
  fetchReceptionistSalonDetail,
  getReceptionistSalonId,
  manualCheckInReceptionistBooking,
  rejectReceptionistBooking,
} from "../services/receptionistBookingService";

function formatCurrency(value) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} VNĐ`;
}

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

function formatTime(value) {
  if (!value) {
    return "--";
  }

  return value.slice(0, 5);
}

function getStatusTone(status) {
  switch (status) {
    case "Completed":
      return "bg-[#e8f8ef] text-[#1f9d61]";
    case "Confirmed":
    case "CheckedIn":
      return "bg-[#eaf1ff] text-[#4c71d9]";
    case "Pending":
      return "bg-[#fff3e5] text-[#d98b1d]";
    case "Cancelled":
      return "bg-[#ffe8ef] text-[#df4e86]";
    default:
      return "bg-[#f5ecff] text-[#7c63d8]";
  }
}

function normalizeBooking(booking) {
  return {
    bookingId: booking.bookingId,
    customerName: booking.customerName || "Unknown customer",
    artistName: booking.artistName || "Unassigned",
    salonName: booking.salonName || "--",
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    totalPrice: booking.totalPrice,
    status: booking.status || "Pending",
    totalDuration: booking.totalDuration,
    services: booking.bookingItems?.map((item) => item.serviceName).filter(Boolean) ?? [],
  };
}

function canManualCheckIn(status) {
  return !["CheckedIn", "Completed", "Cancelled"].includes(status);
}

const BOOKING_PAGE_SIZE = 10;

export function ReceptionistBookingListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [salonName, setSalonName] = useState("Receptionist Booking Management");
  const [salonMeta, setSalonMeta] = useState("Bookings are loaded from salon API.");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: BOOKING_PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  });

  const loadBookings = useCallback(async (page = currentPage) => {
    setIsLoading(true);
    setError("");

    try {
      const data = await fetchReceptionistBookings({
        includePagination: true,
        pageNumber: page,
        pageSize: BOOKING_PAGE_SIZE,
      });
      setBookings(Array.isArray(data?.items) ? data.items.map(normalizeBooking) : []);
      setPagination({
        currentPage: data?.pagination?.currentPage ?? page,
        pageSize: data?.pagination?.pageSize ?? BOOKING_PAGE_SIZE,
        totalCount: data?.pagination?.totalCount ?? 0,
        totalPages: data?.pagination?.totalPages ?? 1,
      });
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load bookings.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadBookings(currentPage);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [currentPage, loadBookings]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void (async () => {
        try {
          const salonId = getReceptionistSalonId();
          const salon = await fetchReceptionistSalonDetail(salonId);
          setSalonName(salon?.name || "Receptionist Booking Management");
          setSalonMeta(
            [salon?.address, salon?.phone].filter(Boolean).join(" | ") || "Bookings are loaded from salon API.",
          );
        } catch (salonError) {
          const message =
            salonError instanceof Error ? salonError.message : "Failed to load salon detail.";
          setSalonName("Receptionist Booking Management");
          setSalonMeta(message);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const filteredBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return bookings;
    }

    return bookings.filter((booking) =>
      [
        booking.bookingId,
        booking.customerName,
        booking.artistName,
        booking.salonName,
        booking.status,
        booking.services.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [bookings, query]);

  const paginationLabel = useMemo(() => {
    if (!pagination.totalCount) {
      return "Showing 0 bookings";
    }

    const start = (pagination.currentPage - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.totalCount, start + bookings.length - 1);

    return `Showing ${start}-${end} of ${pagination.totalCount} bookings`;
  }, [bookings.length, pagination.currentPage, pagination.pageSize, pagination.totalCount]);

  const summary = useMemo(() => {
    const waitingCount = bookings.filter((booking) => booking.status === "Pending").length;
    const checkedInCount = bookings.filter((booking) => booking.status === "CheckedIn").length;

    return {
      total: pagination.totalCount,
      waiting: waitingCount,
      checkedIn: checkedInCount,
      revenue: bookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0),
    };
  }, [bookings, pagination.totalCount]);

  const bookingColumns = useMemo(() => ([
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (value) => <span className="text-sm font-bold text-[#412643]">{value}</span>,
    },
    {
      title: "Salon",
      dataIndex: "salonName",
      key: "salonName",
      render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
    },
    {
      title: "Artist",
      dataIndex: "artistName",
      key: "artistName",
      render: (value) => <span className="text-sm text-[#6b5668]">{value}</span>,
    },
    {
      title: "Service",
      key: "service",
      render: (_, booking) => <span className="text-sm text-[#6b5668]">{booking.services[0] || "--"}</span>,
    },
    {
      title: "Schedule",
      key: "schedule",
      render: (_, booking) => (
        <div>
          <p className="text-sm font-semibold text-[#412643]">{formatDate(booking.bookingDate)}</p>
          <p className="mt-1 text-[11px] text-[#b38a9f]">{formatTime(booking.startTime)}</p>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (value) => <span className="text-sm font-semibold text-[#412643]">{formatCurrency(value)}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold ${getStatusTone(status)}`}>
          {status}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, booking) => (
        <ActionDropdown
          items={[
            {
              key: "view",
              label: "View Booking",
              icon: Eye,
              onSelect: () => navigate(getReceptionistBookingDetailRoute(booking.bookingId)),
            },
            {
              key: "confirm",
              label: "Confirm Booking",
              icon: CheckCircle2,
              className: "text-[#1f9d61]",
              onSelect: () => void handleConfirmBooking(booking.bookingId),
            },
            ...(canManualCheckIn(booking.status)
              ? [
                {
                  key: "check-in",
                  label: "Check In",
                  icon: SquareCheckBig,
                  className: "text-[#4c71d9]",
                  onSelect: () => void handleManualCheckIn(booking.bookingId),
                },
              ]
              : []),
            {
              key: "reject",
              label: "Reject Booking",
              icon: XCircle,
              className: "text-[#df4e86]",
              onSelect: () => void handleRejectBooking(booking.bookingId),
            },
          ]}
        />
      ),
    },
  ]), [handleConfirmBooking, handleManualCheckIn, handleRejectBooking, navigate]);

  function updateBookingRow(updatedBooking) {
    if (!updatedBooking?.bookingId) {
      return;
    }

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.bookingId === updatedBooking.bookingId ? normalizeBooking(updatedBooking) : booking,
      ),
    );
  }

  async function handleConfirmBooking(bookingId) {
    try {
      const updatedBooking = await confirmReceptionistBooking(bookingId);
      updateBookingRow(updatedBooking);
      toast.success("Booking confirmed successfully.");
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to confirm booking.";
      toast.error(message);
    }
  }

  async function handleRejectBooking(bookingId) {
    try {
      const updatedBooking = await rejectReceptionistBooking(bookingId);
      updateBookingRow(updatedBooking);
      toast.success("Booking rejected successfully.");
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to reject booking.";
      toast.error(message);
    }
  }

  async function handleManualCheckIn(bookingId) {
    try {
      const updatedBooking = await manualCheckInReceptionistBooking(bookingId);
      updateBookingRow(updatedBooking);
      toast.success("Customer checked in successfully.");
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to check in booking.";
      toast.error(message);
    }
  }

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Today Bookings", value: summary.total, note: "Salon booking queue", iconTone: "bg-[#ffe8f1] text-[#ea4f93]" },
          { label: "Waiting", value: summary.waiting, note: "Need front desk action", iconTone: "bg-[#fff4e5] text-[#d98b1d]" },
          { label: "Checked In", value: summary.checkedIn, note: "Arrived customers", iconTone: "bg-[#e8f8ef] text-[#1f9d61]" },
          { label: "Revenue", value: formatCurrency(summary.revenue), note: "Total loaded from API", iconTone: "bg-[#f1ecff] text-[#7c63d8]" },
        ].map((item) => (
          <article key={item.label} className="rounded-[20px] border border-[#f6d8e5] bg-white p-4 shadow-[0_12px_28px_rgba(236,72,153,0.06)]">
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.iconTone}`}>
              <CalendarDays size={18} />
            </span>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#c896af]">{item.label}</p>
            <p className="mt-2 text-[1.8rem] font-extrabold text-[#412643]">{item.value}</p>
            <p className="mt-2 text-xs text-[#b38a9f]">{item.note}</p>
          </article>
        ))}
      </div>

      <article className="rounded-[24px] border border-[#f6d8e5] bg-white p-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)] md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-extrabold text-[#412643]">{salonName}</p>
            <p className="mt-1 text-sm text-[#b38a9f]">{salonMeta}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadBookings(currentPage)}
              className="inline-flex items-center gap-2 rounded-full border border-[#f3cade] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <RefreshCcw size={14} />
              Refresh
            </button>
            <Link
              to={ROUTES.receptionistBookingsCreate}
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)]"
            >
              <UserPlus size={14} />
              Create Walk-in
            </Link>
          </div>
        </div>

        <label className="relative mt-4 block">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d47aa8]" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search booking ID, customer, artist, service..."
            className="h-12 w-full rounded-2xl border border-[#f5d7e4] bg-[#fff9fc] pl-11 pr-4 text-sm text-[#5c4559] outline-none transition placeholder:text-[#d39bb5] focus:border-[#ef6bb4]"
          />
        </label>

        {error ? (
          <div className="mt-4 rounded-[16px] border border-[#f7d4df] bg-[#fff3f7] px-4 py-3 text-sm font-medium text-[#d14c84]">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-6 flex min-h-56 items-center justify-center rounded-[20px] border border-[#f7dce8] bg-[#fffafd]">
            <div className="flex items-center gap-3 text-sm font-medium text-[#b38a9f]">
              <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
              Loading bookings...
            </div>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[20px] border border-[#f7dce8]">
            <div className="hidden lg:block">
              <Table
                rowKey="bookingId"
                columns={bookingColumns}
                dataSource={filteredBookings}
                pagination={false}
                scroll={{ x: 1100 }}
                locale={{ emptyText: "No bookings matched the current search." }}
              />
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {filteredBookings.map((booking) => (
                <article key={booking.bookingId} className="rounded-[18px] border border-[#f8dce8] bg-[#fffafb] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#412643]">{booking.customerName}</p>
                      <p className="mt-1 text-[11px] text-[#b38a9f]">{booking.artistName}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold ${getStatusTone(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[#6b5668]">{booking.services[0] || "--"}</p>
                  <p className="mt-1 text-[11px] text-[#b38a9f]">{booking.salonName}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#412643]">{formatDate(booking.bookingDate)}</p>
                      <p className="mt-1 text-[11px] text-[#b38a9f]">{formatTime(booking.startTime)}</p>
                    </div>
                    <ActionDropdown
                      items={[
                        {
                          key: "view",
                          label: "View Booking",
                          icon: Eye,
                          onSelect: () => navigate(getReceptionistBookingDetailRoute(booking.bookingId)),
                        },
                        {
                          key: "confirm",
                          label: "Confirm Booking",
                          icon: CheckCircle2,
                          className: "text-[#1f9d61]",
                          onSelect: () => void handleConfirmBooking(booking.bookingId),
                        },
                        ...(canManualCheckIn(booking.status)
                          ? [
                            {
                              key: "check-in",
                              label: "Check In",
                              icon: SquareCheckBig,
                              className: "text-[#4c71d9]",
                              onSelect: () => void handleManualCheckIn(booking.bookingId),
                            },
                          ]
                          : []),
                        {
                          key: "reject",
                          label: "Reject Booking",
                          icon: XCircle,
                          className: "text-[#df4e86]",
                          onSelect: () => void handleRejectBooking(booking.bookingId),
                        },
                      ]}
                    />
                  </div>
                </article>
              ))}
            </div>

            {filteredBookings.length ? (
              <div className="flex flex-col gap-3 border-t border-[#f7dce8] bg-[#fffafd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-[#c694ad]">{paginationLabel}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92] disabled:opacity-50"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-[#ea4f93] px-2 text-[11px] font-bold text-white"
                  >
                    {currentPage}
                  </button>
                  <span className="px-2 text-[11px] font-medium text-[#b9849f]">/ {pagination.totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage >= pagination.totalPages}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#f3cade] bg-white text-[#e84d92] disabled:opacity-50"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ) : null}

            {!filteredBookings.length ? (
              <div className="border-t border-[#f7dce8] bg-[#fffafd] px-5 py-10 text-center text-sm text-[#8a7082]">
                No bookings matched the current search.
              </div>
            ) : null}
          </div>
        )}
      </article>
    </section>
  );
}
