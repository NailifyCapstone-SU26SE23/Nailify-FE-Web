import { Button, Modal } from "antd";
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  MessageCircleMore,
  Phone,
  Printer,
  QrCode,
  ReceiptText,
  RefreshCcw,
  Sparkles,
  SquareCheckBig,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";
import {
  fetchReceptionistBookingDetail,
  fetchReceptionistCustomerDetail,
  manualCheckInReceptionistBooking,
} from "../services/receptionistBookingService";

function formatCurrency(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "--";
  }

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(amount)} VNĐ`;
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

function getCustomerDisplayName(customerProfile, booking) {
  const fullName = [customerProfile?.firstName, customerProfile?.lastName].filter(Boolean).join(" ").trim();
  return fullName || booking?.customerName || "--";
}

function getCustomerInitials(customerProfile, booking) {
  return getCustomerDisplayName(customerProfile, booking)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "NA";
}

function getStatusTone(status) {
  switch (status) {
    case "Completed":
      return "bg-[#e7f8ee] text-[#309e63]";
    case "In Progress":
    case "CheckedIn":
      return "bg-[#efeafd] text-[#7c63d8]";
    case "Confirmed":
      return "bg-[#e9f2ff] text-[#4772da]";
    case "Waiting":
    case "Pending":
      return "bg-[#fff4e3] text-[#e09a27]";
    case "Cancelled":
      return "bg-[#ffe7ef] text-[#e04d86]";
    default:
      return "bg-[#fff1f6] text-[#eb5b92]";
  }
}

function getActionTone(label) {
  switch (label) {
    case "View":
      return "bg-[#fff1f6] text-[#eb5b92]";
    case "Manage":
      return "bg-[#efeafd] text-[#7c63d8]";
    case "Edit":
      return "bg-[#f2f2f2] text-[#656565]";
    default:
      return "bg-[#fff1f6] text-[#eb5b92]";
  }
}

function getServiceStatus(index, bookingStatus) {
  if (index === 0 && bookingStatus === "Completed") {
    return "Completed";
  }

  if (index === 0 && (bookingStatus === "CheckedIn" || bookingStatus === "In Progress")) {
    return "In Progress";
  }

  if (index <= 1 && bookingStatus === "Confirmed") {
    return "Confirmed";
  }

  return "Waiting";
}

function getServiceAction(status) {
  if (status === "In Progress") {
    return "Manage";
  }

  if (status === "Completed") {
    return "Edit";
  }

  return "View";
}

function getProgressPercent(booking) {
  const items = booking?.bookingItems ?? [];

  if (!items.length) {
    return 25;
  }

  const completedCount =
    booking?.status === "Completed"
      ? items.length
      : booking?.status === "CheckedIn" || booking?.status === "In Progress"
        ? 1
        : 0;

  return Math.max(20, Math.round((completedCount / items.length) * 100));
}

function canManualCheckIn(status) {
  return !["CheckedIn", "Completed", "Cancelled"].includes(status);
}

function DetailCard({ title, subtitle, badge, children, className = "" }) {
  return (
    <section
      className={`rounded-[24px] border border-[#f4d6e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#4a3741]">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-[#a48796]">{subtitle}</p> : null}
        </div>
        {badge ? (
          <span className="rounded-full border border-[#f4d6e2] bg-[#fff1f6] px-3 py-1 text-[10px] font-extrabold text-[#eb5b92]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const ACTION_CENTER = [
  {
    label: "Check In",
    subtitle: "Manual arrival check-in",
    icon: SquareCheckBig,
    cardTone: "bg-[linear-gradient(180deg,#fff1f6_0%,#ffe6f0_100%)]",
    iconTone: "bg-[#ffdcea] text-[#eb5b92]",
  },
  {
    label: "Start Service",
    subtitle: "Begin session",
    icon: Sparkles,
    cardTone: "bg-[linear-gradient(180deg,#f2edff_0%,#e9e1ff_100%)]",
    iconTone: "bg-[#dfd1ff] text-[#8160df]",
  },
  {
    label: "Reassign Artist",
    subtitle: "Change staff",
    icon: UserRound,
    cardTone: "bg-[linear-gradient(180deg,#fff8df_0%,#fff0bf_100%)]",
    iconTone: "bg-[#ffe6a1] text-[#d8a01c]",
  },
  {
    label: "Move Schedule",
    subtitle: "Reschedule time",
    icon: CalendarClock,
    cardTone: "bg-[linear-gradient(180deg,#ebf7ff_0%,#dff1ff_100%)]",
    iconTone: "bg-[#cfe8fb] text-[#4391c9]",
  },
  {
    label: "Add Service",
    subtitle: "Extra treatment",
    icon: Sparkles,
    cardTone: "bg-[linear-gradient(180deg,#e6f8ef_0%,#d8f2e5_100%)]",
    iconTone: "bg-[#cdeedb] text-[#2da466]",
  },
  {
    label: "Complete Booking",
    subtitle: "Finalize session",
    icon: CheckCircle2,
    cardTone: "bg-[linear-gradient(180deg,#f2edff_0%,#ebe3ff_100%)]",
    iconTone: "bg-[#ddd2ff] text-[#8260df]",
  },
  {
    label: "Cancel Booking",
    subtitle: "Void appointment",
    icon: XCircle,
    cardTone: "bg-[linear-gradient(180deg,#fff1f1_0%,#ffe9e9_100%)]",
    iconTone: "bg-[#ffd8d8] text-[#ef6b6b]",
  },
  {
    label: "Send Invoice",
    subtitle: "Email to client",
    icon: ReceiptText,
    cardTone: "bg-[linear-gradient(180deg,#fff9eb_0%,#fff2cd_100%)]",
    iconTone: "bg-[#ffe7ae] text-[#d19a15]",
  },
];

export function ReceptionistBookingDetailPage() {
  const { bookingId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isManualCheckInSubmitting, setIsManualCheckInSubmitting] = useState(false);
  const [notes, setNotes] = useState(
    "Customer notes not available from API yet. Use this area for receptionist-only reminders.",
  );

  useEffect(() => {
    if (!bookingId) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError("");

        try {
          const data = await fetchReceptionistBookingDetail(bookingId);
          setBooking(data);
          if (data?.customerId) {
            try {
              const customerData = await fetchReceptionistCustomerDetail(data.customerId);
              setCustomerProfile(customerData);
            } catch (customerError) {
              setCustomerProfile(null);
              const customerMessage =
                customerError instanceof Error
                  ? customerError.message
                  : "Failed to load customer profile.";
              toast.error(customerMessage);
            }
          } else {
            setCustomerProfile(null);
          }
        } catch (loadError) {
          const message = loadError instanceof Error ? loadError.message : "Failed to load booking detail.";
          setError(message);
          toast.error(message);
        } finally {
          setIsLoading(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [bookingId]);

  const qrImageSrc = useMemo(() => (
    booking?.qrCode ? `data:image/png;base64,${booking.qrCode}` : ""
  ), [booking]);
  const customerDisplayName = getCustomerDisplayName(customerProfile, booking);
  const customerInitials = getCustomerInitials(customerProfile, booking);

  const serviceRows = useMemo(() => (
    (booking?.bookingItems ?? []).map((item, index) => {
      const status = getServiceStatus(index, booking?.status);

      return {
        id: item.bookingItemId,
        time: `${formatTime(booking?.startTime)} - --`,
        service: item.serviceName || "--",
        serviceType: item.nailVariantName || item.customerNailName || "--",
        artist: booking?.artistName || "--",
        duration: item.duration ? formatDurationMinutes(item.duration) : "--",
        status,
        action: getServiceAction(status),
      };
    })
  ), [booking]);

  const totalAmount = formatCurrency(booking?.totalPrice);
  const depositPaid = "--";
  const remainingBalance = totalAmount;
  const progressPercent = getProgressPercent(booking);
  const isManualCheckInAllowed = canManualCheckIn(booking?.status);

  const handleRefresh = async () => {
    if (!bookingId) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await fetchReceptionistBookingDetail(bookingId);
      setBooking(data);
      if (data?.customerId) {
        try {
          const customerData = await fetchReceptionistCustomerDetail(data.customerId);
          setCustomerProfile(customerData);
        } catch (customerError) {
          setCustomerProfile(null);
          const customerMessage =
            customerError instanceof Error
              ? customerError.message
              : "Failed to load customer profile.";
          toast.error(customerMessage);
        }
      } else {
        setCustomerProfile(null);
      }
      toast.success("Booking detail refreshed.");
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to refresh booking detail.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockAction = (label) => {
    toast.success(`${label} is ready for receptionist flow.`);
  };

  const handleManualCheckIn = async () => {
    if (!bookingId || !isManualCheckInAllowed || isManualCheckInSubmitting) {
      return;
    }

    setIsManualCheckInSubmitting(true);

    try {
      const updatedBooking = await manualCheckInReceptionistBooking(bookingId);
      setBooking(updatedBooking);
      toast.success("Customer checked in successfully.");
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to check in booking.";
      toast.error(message);
    } finally {
      setIsManualCheckInSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
        <div className="flex items-center gap-3 text-sm font-medium text-[#b38a9f]">
          <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
          Loading booking detail...
        </div>
      </section>
    );
  }

  if (error || !booking) {
    return (
      <section className="rounded-[24px] border border-[#f6d8e5] bg-white p-6 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
        <p className="text-lg font-extrabold text-[#412643]">Booking detail unavailable</p>
        <p className="mt-2 text-sm text-[#b38a9f]">{error || "This booking could not be loaded."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="inline-flex items-center gap-2 rounded-full border border-[#f3cade] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
          >
            <RefreshCcw size={14} />
            Retry
          </button>
          <Link
            to={ROUTES.receptionistBookings}
            className="inline-flex items-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
          >
            Back to bookings
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-4 bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
      <div className="rounded-[24px] border border-[#f6d8e5] bg-white px-5 py-4 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-black text-[#412643]">Booking Details</p>
            <p className="mt-1 text-xs text-[#b38a9f]">Manage customer appointment and salon operations</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsQrOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[#f3cade] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <QrCode size={14} />
              View QR
            </button>
            <button
              type="button"
              onClick={() => void handleManualCheckIn()}
              disabled={!isManualCheckInAllowed || isManualCheckInSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isManualCheckInSubmitting ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <SquareCheckBig size={14} />
              )}
              Check In
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_300px]">
        <div className="space-y-4">
          <DetailCard
            title="Customer Overview"
            subtitle={`Booking ${booking.bookingId || "--"}`}
            badge="Active Booking"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-1 items-start gap-4">
                <div className="relative">
                  {customerProfile?.avatarUrl ? (
                    <img
                      src={customerProfile.avatarUrl}
                      alt={customerDisplayName}
                      className="h-20 w-20 rounded-[20px] border-2 border-[#f4d6e2] object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-[20px] border-2 border-[#f4d6e2] bg-[linear-gradient(180deg,#ffd6e5_0%,#ef5b94_100%)] text-lg font-black text-white">
                      {customerInitials}
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,#ef5b92_0%,#f58b77_100%)] px-2 py-0.5 text-[9px] font-extrabold text-white">
                    VIP
                  </span>
                </div>

                <div className="flex-1">
                  <p className="text-xl font-black text-[#4a3741]">{customerDisplayName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["VIP Member", "Sensitive Nails", "Frequent Customer"].map((tag, index) => (
                      <span
                        key={tag}
                        className={[
                          "rounded-full px-3 py-1 text-[10px] font-bold",
                          index === 0
                            ? "border border-[#f3d3df] bg-[#fff1f6] text-[#eb5b92]"
                            : index === 1
                              ? "border border-[#f6e1a7] bg-[#fff4cf] text-[#c89516]"
                              : "border border-[#e4dcff] bg-[#f2edff] text-[#7b68c8]",
                        ].join(" ")}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">Phone</p>
                        <p className="mt-1 text-sm font-medium text-[#4a3741]">{customerProfile?.phone || "--"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">Last Visit</p>
                        <p className="mt-1 text-sm font-medium text-[#4a3741]">--</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">Membership</p>
                        <p className="mt-1 text-sm font-extrabold text-[#eb5b92]">Gold Tier</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">Email</p>
                        <p className="mt-1 text-sm font-medium text-[#4a3741]">{customerProfile?.email || "--"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">Preferred Artist</p>
                        <p className="mt-1 text-sm font-medium text-[#4a3741]">{booking.artistName || "--"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68b98]">Total Visits</p>
                        <p className="mt-1 text-sm font-medium text-[#4a3741]">--</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:w-[160px]">
                <button
                  type="button"
                  onClick={() => handleMockAction("Call Customer")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff1f6] px-4 py-2.5 text-xs font-bold text-[#eb5b92]"
                >
                  <Phone size={14} />
                  Call Customer
                </button>
                <button
                  type="button"
                  onClick={() => handleMockAction("Send Message")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f2edff] px-4 py-2.5 text-xs font-bold text-[#7b68c8]"
                >
                  <MessageCircleMore size={14} />
                  Send Message
                </button>
                <button
                  type="button"
                  onClick={() => handleMockAction("View History")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff4cf] px-4 py-2.5 text-xs font-bold text-[#c89516]"
                >
                  <Sparkles size={14} />
                  View History
                </button>
              </div>
            </div>
          </DetailCard>

          <DetailCard
            title="Appointment Details"
            subtitle="Today's scheduled services"
            badge={`${serviceRows.length || 0} Services`}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#f7e2eb] text-left text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#aa8f9d]">
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3">Service</th>
                    <th className="px-3 py-3">Nail Artist</th>
                    <th className="px-3 py-3">Duration</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRows.length ? serviceRows.map((row) => (
                    <tr key={row.id} className="border-b border-[#fbeaf1] last:border-b-0">
                      <td className="px-3 py-4 text-xs font-bold text-[#eb5b92]">{row.time}</td>
                      <td className="px-3 py-4">
                        <p className="text-xs font-bold text-[#4a3741]">{row.service}</p>
                        <p className="mt-1 text-[10px] text-[#a48796]">{row.serviceType}</p>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ef5b94] text-[10px] font-extrabold text-white">
                            {(row.artist || "--")
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase() || "--"}
                          </div>
                          <span className="text-xs font-medium text-[#4a3741]">{row.artist}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-xs text-[#4a3741]">{row.duration}</td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ${getStatusTone(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleMockAction(`View ${row.service}`)}
                            className="rounded-xl bg-[#fff1f6] px-3 py-1.5 text-[10px] font-bold text-[#eb5b92]"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMockAction(`${row.action} ${row.service}`)}
                            className={`rounded-xl px-3 py-1.5 text-[10px] font-bold ${getActionTone(row.action)}`}
                          >
                            {row.action}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-3 py-8 text-center text-sm text-[#a48796]">
                        No appointment services available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DetailCard>

          <DetailCard
            title="Payment Summary"
            subtitle="Booking financial overview"
            badge="API Data"
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_250px]">
              <div>
                <div className="space-y-3 text-sm">
                  {[
                    ["Subtotal", totalAmount],
                    ["Gold Member Discount (10%)", "--"],
                    ["Deposit Paid", depositPaid],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-[#8f7b88]">{label}</span>
                      <span className="font-bold text-[#4a3741]">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-[#f3d7e2] pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[#8f7b88]">Remaining Balance</span>
                    <span className="text-sm font-extrabold text-[#eb5b92]">{remainingBalance}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#4a3741]">Total Amount</p>
                    <p className="mt-2 text-[1.8rem] font-black leading-none text-[#eb5b92]">{totalAmount}</p>
                  </div>
                  <div className="text-right text-[11px] text-[#a48796]">
                    <p>Deposit paid {depositPaid}</p>
                    <p className="mt-1">Remaining {remainingBalance}</p>
                  </div>
                </div>

                <div className="mt-4 h-2 rounded-full bg-[#f6d6e3]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#eb5b92_0%,#f4869f_100%)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleMockAction("Add Payment")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#cf3d82_0%,#ef5b92_100%)] px-4 py-3 text-xs font-extrabold text-white shadow-[0_12px_24px_rgba(235,91,146,0.22)]"
                >
                  <CreditCard size={14} />
                  Add Payment
                </button>
                <button
                  type="button"
                  onClick={() => handleMockAction("Print Receipt")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#f3d7e2] bg-[#fff3f8] px-4 py-3 text-xs font-extrabold text-[#eb5b92]"
                >
                  <Printer size={14} />
                  Print Receipt
                </button>
              </div>
            </div>
          </DetailCard>

          <DetailCard
            title="Receptionist Action Center"
            subtitle="Quick operational controls for this booking"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {ACTION_CENTER.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.label === "Check In") {
                        void handleManualCheckIn();
                        return;
                      }

                      handleMockAction(item.label);
                    }}
                    disabled={item.label === "Check In" && (!isManualCheckInAllowed || isManualCheckInSubmitting)}
                    className={`rounded-[18px] border border-[#f0d8e2] px-4 py-4 text-center shadow-[0_10px_22px_rgba(236,72,153,0.04)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${item.cardTone}`}
                  >
                    <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconTone}`}>
                      <Icon size={18} />
                    </span>
                    <p className="mt-3 text-xs font-extrabold text-[#4a3741]">{item.label}</p>
                    <p className="mt-1 text-[10px] text-[#9f8896]">{item.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </DetailCard>
        </div>

        <aside className="space-y-4">
          <DetailCard title="Quick Status">
            <div className="space-y-3 text-sm">
              {[
                ["Current Status", booking.status || "--"],
                ["Assigned Artist", booking.artistName || "--"],
                ["Chair Number", "--"],
                ["Remaining Time", booking.totalDuration ? formatDurationMinutes(booking.totalDuration) : "--"],
                ["Est. Finish", "--"],
                ["Check-in Time", booking.status === "CheckedIn" ? formatTime(booking.startTime) : "--"],
              ].map(([label, value], index) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-[#8f7b88]">{label}</span>
                  <span
                    className={
                      index === 0
                        ? `rounded-full px-2.5 py-1 text-[10px] font-extrabold ${getStatusTone(String(value))}`
                        : "font-bold text-[#4a3741]"
                    }
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[10px] text-[#a48796]">
                <span>Progress</span>
                <span>{serviceRows.length ? `1 of ${serviceRows.length} done` : "0 of 0 done"}</span>
              </div>
              <div className="h-2 rounded-full bg-[#f6d6e3]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#eb5b92_0%,#f4869f_100%)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </DetailCard>

          <DetailCard title="Latest Review">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffd6e5_0%,#ef5b94_100%)] text-xs font-extrabold text-white">
                {customerInitials}
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#4a3741]">{customerDisplayName}</p>
                <p className="mt-1 text-[10px] text-[#a48796]">{formatDate(booking.bookingDate)}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-1 text-[#f1aa2a]">
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={index}>*</span>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-[#7e6d77]">
              Customer review data is not available from the booking API yet. Keep this card as a receptionist-facing placeholder.
            </p>
          </DetailCard>

          <DetailCard title="Internal Notes">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-[120px] w-full rounded-2xl border border-[#f3d7e2] bg-[#fffafb] px-4 py-3 text-xs leading-6 text-[#4a3741] outline-none"
            />
            <button
              type="button"
              onClick={() => toast.success("Receptionist notes saved in local UI.")}
              className="mt-4 w-full rounded-xl border border-[#f3d7e2] bg-[#fff1f6] px-4 py-3 text-xs font-extrabold text-[#eb5b92]"
            >
              Save Notes
            </button>
          </DetailCard>

          <DetailCard title="Next Appointment">
            <div className="rounded-[20px] border border-[#f3d7e2] bg-[#fff7fb] px-4 py-4">
              <p className="text-xs font-extrabold text-[#eb5b92]">Next slot --</p>
              <p className="mt-2 text-sm font-bold text-[#4a3741]">{serviceRows[0]?.service || "--"}</p>
              <p className="mt-2 text-[11px] text-[#8f7b88]">with {booking.artistName || "--"} - Chair --</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleMockAction("View next appointment")}
                className="rounded-xl border border-[#f3d7e2] bg-[#fff1f6] px-4 py-2.5 text-xs font-extrabold text-[#eb5b92]"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => handleMockAction("Edit next appointment")}
                className="rounded-xl border border-[#e3dbff] bg-[#f2edff] px-4 py-2.5 text-xs font-extrabold text-[#7c63d8]"
              >
                Edit
              </button>
            </div>
          </DetailCard>
        </aside>
      </div>

      <Modal
        open={isQrOpen}
        onCancel={() => setIsQrOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsQrOpen(false)}>
            Close
          </Button>,
        ]}
        centered
        title="Customer Check-In QR Code"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          {qrImageSrc ? (
            <img
              src={qrImageSrc}
              alt={`QR code for booking ${booking.bookingId}`}
              className="h-72 w-72 rounded-2xl border border-[#f4d6e2] bg-white p-3 object-contain"
            />
          ) : (
            <div className="rounded-2xl border border-[#f4d6e2] bg-[#fff7fb] px-6 py-10 text-center text-sm text-[#8f7b88]">
              QR code not available for this booking.
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-bold text-[#4a3741]">{customerDisplayName}</p>
            <p className="mt-1 text-xs text-[#a48796]">{booking.bookingId || "--"}</p>
          </div>
        </div>
      </Modal>
    </section>
  );
}
