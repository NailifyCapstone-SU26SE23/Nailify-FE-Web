import {
  Calendar,
  ChevronLeft,
  Clock3,
  CreditCard,
  ScanQrCode,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROLES } from "../../../../shared/constants/roles";
import { BOOKING_ROLE_CONFIG } from "../services/mockBookings";
import { fetchBookingById } from "../services/bookingsService";
import { Spin, Alert } from "antd";
import { ConfirmBookingModal } from "../components/ConfirmBookingModal";
import { RejectBookingModal } from "../components/RejectBookingModal";
import { CancelBookingModal } from "../components/CancelBookingModal";

const roleConfig = BOOKING_ROLE_CONFIG[ROLES.manager];

function Card({ className = "", children }) {
  return (
    <article
      className={`rounded-[18px] border border-[#f8deea] bg-white p-5 shadow-[0_10px_24px_rgba(236,72,153,0.06)] md:p-6 ${className}`}
    >
      {children}
    </article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-extrabold text-[#402542]">{children}</h2>
      {subtitle ? <p className="mt-1 text-sm text-[#c08aa4]">{subtitle}</p> : null}
    </div>
  );
}

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
  subtitle: PropTypes.string,
};

function InfoTile({ label, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[#f4d6e3] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] p-4 shadow-[0_8px_20px_rgba(236,72,153,0.05)] ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">{label}</p>
      <div className="mt-2 text-sm font-semibold text-[#402542]">{children}</div>
    </div>
  );
}

InfoTile.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
};

function getStatusTone(status) {
  switch (status) {
    case "Checked In":
      return "bg-[#e7ecff] text-[#4755b8]";
    case "In Progress":
      return "bg-[#f3ebff] text-[#7e4fe6]";
    case "Pending":
      return "bg-[#fff0dd] text-[#db8520]";
    case "Confirmed":
      return "bg-[#eaf9ee] text-[#2fa25f]";
    case "Reschedule Req":
      return "bg-[#fff0dd] text-[#db8520]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const normalized = String(dateString).trim();
  const datePart = normalized.includes("T") ? normalized.split("T")[0] : normalized;
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) return "N/A";

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(startTime, fallbackDateTime) {
  const normalizedTime = String(startTime || "").trim();
  const rawTime = normalizedTime
    || String(fallbackDateTime || "")
      .trim()
      .split("T")[1]
      ?.replace("Z", "")
      ?.split(".")[0];

  if (!rawTime) return "N/A";

  const [hours, minutes = 0, seconds = 0] = rawTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return "N/A";
  }

  return new Date(2000, 0, 1, hours, minutes, seconds).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatVND(amount) {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

function formatDuration(totalMinutes) {
  if (!totalMinutes) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

function getArtistDisplayName(booking) {
  const name = booking?.nailArtistName || booking?.artistName || booking?.fullName;
  return name === "Chưa chỉ định" ? "Unassigned" : name || "Unassigned";
}

export function ManagerBookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const mapBooking = useCallback((rawBooking) => {
    const artistName = getArtistDisplayName(rawBooking);
    const artistId =
      rawBooking.staffId ||
      rawBooking.nailArtistId ||
      rawBooking.staffArtistId ||
      rawBooking.artistId ||
      null;

    return {
      ...rawBooking,
      id: rawBooking.bookingId || rawBooking.id,
      bookingId: rawBooking.bookingId || rawBooking.id,
      date: formatDate(rawBooking.bookingDate || rawBooking.createdAt),
        time: formatTime(rawBooking.startTime, rawBooking.bookingDate || rawBooking.createdAt),
      customerName: rawBooking.customerName || "Unknown Customer",
      customerId: rawBooking.customerId,
      phone: rawBooking.customerPhone || "N/A",
      serviceName: rawBooking.serviceName || "Nail Service",
      artistName,
      artistId,
      deposit: rawBooking.depositAmount ? formatVND(rawBooking.depositAmount) : "Pending",
      depositAmount: rawBooking.depositAmount,
      depositTone: rawBooking.depositAmount ? "text-[#2fa25f]" : "text-[#db8520]",
      status: rawBooking.status || "Pending",
      totalPrice: rawBooking.totalPrice,
      qrCode: rawBooking.qrCode,
      qtCode: rawBooking.qtCode,
      checkInImageUrl: rawBooking.checkInImageUrl,
      bookingItems: rawBooking.bookingItems || [],
      totalDuration: rawBooking.totalDuration,
      startTime: rawBooking.startTime,
      salonId: rawBooking.salonId,
    };
  }, []);

  const loadBooking = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      setError("");
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const rawBooking = await fetchBookingById(bookingId);
      setBooking(mapBooking(rawBooking));
    } catch (err) {
      console.error("Failed to load booking:", err);
      setError(err.message || "Failed to load booking details.");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [bookingId, mapBooking]);

  useEffect(() => {
    if (bookingId) {
      Promise.resolve().then(() => loadBooking());
    }
  }, [bookingId, loadBooking]);

  if (!isLoading && error) {
    return (
      <section className="flex min-h-full flex-col gap-4 p-4">
        <Alert
          message="Error Loading Booking"
          description={error}
          type="error"
          showIcon
        />
        <Link
          to={roleConfig.listRoute}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#ea4f93] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#df4588] w-fit"
        >
          <ChevronLeft size={14} />
          Back to Bookings
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="flex min-h-full items-center justify-center">
        <Spin size="large" tip="Loading booking detail..." />
      </section>
    );
  }

  const normalizedBookingId = String(booking?.bookingId || bookingId || "").trim();
  const normalizedStatus = String(booking?.status || "").trim().toLowerCase();
  const isFinalStatus =
    normalizedStatus.includes("cancel") ||
    normalizedStatus.includes("reject") ||
    normalizedStatus.includes("complete");

  return (
    <section className="flex min-h-full flex-col gap-5">
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <Link to={ROUTES.managerDashboard} className="text-[#c08aa4] transition hover:text-[#ea4f93]">
          Dashboard
        </Link>
        <span className="text-[#e8c4d4]">/</span>
        <Link to={roleConfig.listRoute} className="text-[#c08aa4] transition hover:text-[#ea4f93]">
          Bookings
        </Link>
        <span className="text-[#e8c4d4]">/</span>
        <span className="font-semibold text-[#7f6478]">Booking Detail</span>
      </nav>

      <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,#fff0f8_0%,#fffafb_58%,#fff5fb_100%)] p-0 shadow-[0_18px_36px_rgba(236,72,153,0.12)]">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_16px_30px_rgba(234,79,147,0.24)]">
              <Clock3 size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold text-[#402542]">Booking Detail</h1>
                <span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold ${getStatusTone(booking?.status)}`}>
                  {booking?.status}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-[#ea4f93]">{booking?.bookingId}</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#956f84]">
                Review booking information, customer details, assigned staff, payment summary, and operational codes from one place.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${isRefreshing ? "bg-white text-[#ea4f93] shadow-[0_8px_18px_rgba(234,79,147,0.12)]" : "bg-white/80 text-[#9b7b8f]"}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${isRefreshing ? "bg-[#ea4f93]" : "bg-[#d9bfd0]"}`} />
              {isRefreshing ? "Refreshing..." : "Detail view"}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(roleConfig.listRoute)}
                className="inline-flex items-center gap-1 rounded-full border border-[#f4c1d8] bg-white px-4 py-2.5 text-xs font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
              >
                <ChevronLeft size={14} />
                Back
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={!normalizedBookingId || isFinalStatus || isRefreshing}
                className="inline-flex items-center justify-center rounded-full bg-[#2fa25f] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1e8a4e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                disabled={!normalizedBookingId || isFinalStatus || isRefreshing}
                className="inline-flex items-center justify-center rounded-full bg-[#db8520] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#c8781d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                disabled={!normalizedBookingId || isFinalStatus || isRefreshing}
                className="inline-flex items-center justify-center rounded-full bg-[#e1447f] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#c9366b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-white/70 bg-white/40 p-6 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Customer">
            <div className="flex items-center gap-2">
              <UserRound size={16} className="text-[#ea4f93]" />
              <span>{booking?.customerName}</span>
            </div>
          </InfoTile>
          <InfoTile label="Schedule">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#ea4f93]" />
              <span>{booking?.date} · {booking?.time}</span>
            </div>
          </InfoTile>
          <InfoTile label="Duration">
            {booking?.totalDuration ? formatDuration(booking.totalDuration) : "N/A"}
          </InfoTile>
          <InfoTile label="Total Price" className="bg-[linear-gradient(180deg,#fff7fb_0%,#fff2f8_100%)]">
            <div className="flex items-center gap-2 text-[#ea4f93]">
              <CreditCard size={16} />
              <span>{formatVND(booking?.totalPrice)}</span>
            </div>
          </InfoTile>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          <Card>
            <SectionTitle subtitle="Core appointment timing, customer, and artist assignment details.">
              Booking Overview
            </SectionTitle>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoTile label="Booking ID">{booking?.bookingId}</InfoTile>
              <InfoTile label="Status">
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${getStatusTone(booking?.status)}`}>
                  {booking?.status}
                </span>
              </InfoTile>
              <InfoTile label="Date">{booking?.date}</InfoTile>
              <InfoTile label="Time">{booking?.time}</InfoTile>
              <InfoTile label="Start Time">{booking?.startTime || "N/A"}</InfoTile>
              <InfoTile label="Duration">{booking?.totalDuration ? formatDuration(booking.totalDuration) : "N/A"}</InfoTile>
              <InfoTile label="Customer Name">{booking?.customerName}</InfoTile>
              <InfoTile label="Phone">{booking?.phone}</InfoTile>
              <InfoTile label="Customer ID">{booking?.customerId || "N/A"}</InfoTile>
              <InfoTile label="Artist Name">{booking?.artistName}</InfoTile>
              <InfoTile label="Artist ID">{booking?.artistId || "N/A"}</InfoTile>
              <InfoTile label="Primary Service">{booking?.serviceName}</InfoTile>
            </div>
          </Card>

          {booking?.bookingItems && booking.bookingItems.length > 0 && (
            <Card>
              <SectionTitle subtitle="Service-level breakdown including quantity, duration, and price.">
                Booking Items
              </SectionTitle>
              <div className="space-y-3">
                {booking.bookingItems.map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-[#f4d6e3] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] p-4 shadow-[0_8px_20px_rgba(236,72,153,0.04)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-extrabold text-[#402542]">{item.serviceName || "Nail Service"}</p>
                        {item.nailVariantName ? (
                          <p className="mt-1 text-[11px] text-[#c08aa4]">Variant: {item.nailVariantName}</p>
                        ) : null}
                        {item.customerNailName ? (
                          <p className="text-[11px] text-[#c08aa4]">Customer Nail: {item.customerNailName}</p>
                        ) : null}
                      </div>
                      <div className="grid min-w-[260px] gap-3 sm:grid-cols-3">
                        <InfoTile label="Quantity" className="p-3">{item.quantity !== undefined ? item.quantity : "-"}</InfoTile>
                        <InfoTile label="Duration" className="p-3">{item.duration !== undefined ? formatDuration(item.duration) : "-"}</InfoTile>
                        <InfoTile label="Price" className="p-3">{item.price !== undefined ? formatVND(item.price) : "-"}</InfoTile>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <div className="rounded-2xl border border-[#f5d4e3] bg-[linear-gradient(180deg,#fff8fc_0%,#fff0f7_100%)] px-5 py-4 text-right shadow-[0_10px_20px_rgba(236,72,153,0.05)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">Total Price</p>
                    <p className="mt-2 text-xl font-extrabold text-[#ea4f93]">{formatVND(booking?.totalPrice)}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <SectionTitle subtitle="Payment and identification assets for this booking.">
              Payment & Codes
            </SectionTitle>
            <div className="space-y-4">
              <InfoTile label="Deposit">
                <span className={booking?.depositTone}>{booking?.deposit}</span>
              </InfoTile>
              <InfoTile label="Total Price">{formatVND(booking?.totalPrice)}</InfoTile>
              {(booking?.qrCode || booking?.qtCode) ? (
                <div className="rounded-2xl border border-[#f4d6e3] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] p-4 shadow-[0_8px_20px_rgba(236,72,153,0.04)]">
                  <div className="mb-3 flex items-center gap-2">
                    <ScanQrCode size={16} className="text-[#ea4f93]" />
                    <p className="text-sm font-bold text-[#402542]">Codes</p>
                  </div>
                  <div className="space-y-3">
                    {booking.qrCode ? (
                      <div className="rounded-xl border border-[#f4d6e3] bg-white p-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">QR Code</p>
                        <img
                          src={
                            typeof booking.qrCode === "string" && booking.qrCode.startsWith("data:")
                              ? booking.qrCode
                              : typeof booking.qrCode === "string" && booking.qrCode.length > 100
                                ? `data:image/png;base64,${booking.qrCode}`
                                : booking.qrCode
                          }
                          alt="QR Code"
                          className="max-w-[220px] rounded-xl"
                          onError={(e) => {
                            console.error("QR Code image failed to load:", booking.qrCode);
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    ) : null}
                    {booking.qtCode ? (
                      <div className="rounded-xl border border-[#f4d6e3] bg-white p-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">QT Code</p>
                        <p className="break-all text-sm font-semibold text-[#402542]">{booking.qtCode}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          {booking?.checkInImageUrl ? (
            <Card>
              <SectionTitle subtitle="Customer arrival proof captured at check-in.">
                Check-in Image
              </SectionTitle>
              <div className="overflow-hidden rounded-2xl border border-[#f4d6e3] bg-[linear-gradient(180deg,#fffafb_0%,#fff5f9_100%)] p-3">
                <img src={booking.checkInImageUrl} alt="Check-in" className="max-w-full rounded-xl" />
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <ConfirmBookingModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        bookingId={normalizedBookingId}
        onSuccess={() => loadBooking({ silent: true })}
      />
      <CancelBookingModal
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        bookingId={normalizedBookingId}
        onSuccess={() => loadBooking({ silent: true })}
      />
      <RejectBookingModal
        open={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        bookingId={normalizedBookingId}
        onSuccess={() => loadBooking({ silent: true })}
      />

    </section>
  );
}
