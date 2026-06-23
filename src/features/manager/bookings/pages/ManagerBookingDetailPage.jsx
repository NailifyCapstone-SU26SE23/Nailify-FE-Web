import {
  ChevronLeft,
  Clock3,
} from "lucide-react";
import { useEffect,useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import { formatDurationLabel } from "../../../../shared/utils/formatDuration";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROLES } from "../../../../shared/constants/roles";
import { BOOKING_ROLE_CONFIG } from "../services/mockBookings";
import { fetchBookingById } from "../services/bookingsService";
import { Spin, Alert } from "antd";

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

function SummaryField({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c08aa4]">{label}</p>
      <div className="mt-1.5 text-sm font-semibold text-[#402542]">{children}</div>
    </div>
  );
}

SummaryField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
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
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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
  const [error, setError] = useState("");

  const loadBooking = async () => {
    try {
      setIsLoading(true);
      setError("");
      const rawBooking = await fetchBookingById(bookingId);
      console.log("Raw booking from API:", rawBooking);
      const artistName = getArtistDisplayName(rawBooking);
      const artistId = rawBooking.staffId || rawBooking.nailArtistId || rawBooking.staffArtistId || rawBooking.artistId || null;
      const mappedBooking = {
        ...rawBooking,
        id: rawBooking.bookingId || rawBooking.id,
        bookingId: rawBooking.bookingId || rawBooking.id,
        date: formatDate(rawBooking.bookingDate || rawBooking.createdAt),
        time: formatTime(rawBooking.bookingDate || rawBooking.createdAt),
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
      console.log("Mapped booking:", mappedBooking);
      setBooking(mappedBooking);
    } catch (err) {
      console.error("Failed to load booking:", err);
      setError(err.message || "Failed to load booking details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

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

  const customerInitials = (booking?.customerName || "Unknown")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <section className="flex min-h-full flex-col gap-4">
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

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => navigate(roleConfig.listRoute)}
          className="inline-flex items-center gap-1 rounded-full border border-[#f4c1d8] bg-white px-3 py-1.5 text-xs font-bold text-[#ea4f93] transition hover:bg-[#fff7fb]"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] text-xl font-bold text-white">
            <Clock3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#402542]">Booking Detail</h1>
            <p className="text-sm font-semibold text-[#ea4f93]">{booking?.bookingId}</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Booking Information</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Booking ID</p>
            <p className="text-sm font-semibold text-[#402542]">{booking?.bookingId}</p>
          </div>
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Date</p>
            <p className="text-sm font-semibold text-[#402542]">{booking?.date}</p>
          </div>
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Time</p>
            <p className="text-sm font-semibold text-[#402542]">{booking?.time}</p>
          </div>
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Start Time</p>
            <p className="text-sm font-semibold text-[#402542]">{booking?.startTime || "N/A"}</p>
          </div>
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Duration</p>
            <p className="text-sm font-semibold text-[#402542]">{booking?.totalDuration ? formatDuration(booking.totalDuration) : "N/A"}</p>
          </div>
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Status</p>
            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${getStatusTone(booking?.status)}`}>
              {booking?.status}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Customer Information</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Customer Name</p>
            <p className="text-sm font-semibold text-[#402542]">{booking?.customerName}</p>
          </div>
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Customer ID</p>
            <p className="text-sm font-semibold text-[#402542]">{booking?.customerId || "N/A"}</p>
          </div>
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Phone</p>
            <p className="text-sm font-semibold text-[#402542]">{booking?.phone}</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Artist Information</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Artist Name</p>
            <p className="text-sm font-semibold text-[#402542]">{booking?.artistName}</p>
          </div>
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Artist ID</p>
            <p className="text-sm font-semibold text-[#402542]">{booking?.artistId || "N/A"}</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Pricing</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Total Price</p>
            <p className="text-sm font-semibold text-[#402542]">{formatVND(booking?.totalPrice)}</p>
          </div>
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-1">Deposit</p>
            <p className={`text-sm font-semibold ${booking?.depositTone}`}>{booking?.deposit}</p>
          </div>
        </div>
      </Card>

      {booking?.bookingItems && booking.bookingItems.length > 0 && (
        <Card>
          <SectionTitle>Booking Items</SectionTitle>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#f4c7da] pb-3 mb-3">
              <div className="flex-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">Service Name</div>
              <div className="flex gap-4 mt-2 sm:mt-0 text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4]">
                <span className="w-16 text-right">Quantity</span>
                <span className="w-24 text-right">Duration</span>
                <span className="w-32 text-right">Price</span>
              </div>
            </div>
            {booking.bookingItems.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-xl bg-[#fffafb] p-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#402542]">{item.serviceName || "Nail Service"}</p>
                  {item.nailVariantName && <p className="text-[11px] text-[#c08aa4] mt-1">Variant: {item.nailVariantName}</p>}
                  {item.customerNailName && <p className="text-[11px] text-[#c08aa4]">Customer Nail: {item.customerNailName}</p>}
                </div>
                <div className="flex gap-4 mt-3 sm:mt-0 text-sm text-[#402542] font-semibold">
                  <span className="w-16 text-right">{item.quantity !== undefined ? item.quantity : "-"}</span>
                  <span className="w-24 text-right">{item.duration !== undefined ? formatDuration(item.duration) : "-"}</span>
                  <span className="w-32 text-right">{item.price !== undefined ? formatVND(item.price) : "-"}</span>
                </div>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row justify-end items-end border-t border-[#f4c7da] pt-3 mt-3">
              <div className="flex gap-4 text-sm">
                <span className="w-40 sm:w-auto font-bold text-[#402542]">Total Price:</span>
                <span className="w-32 text-right font-extrabold text-[#ea4f93] text-lg">{formatVND(booking?.totalPrice)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {(booking?.qrCode || booking?.qtCode) && (
        <Card>
          <SectionTitle>Codes</SectionTitle>
          <div className="space-y-3">
            {booking.qrCode && (
              <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-2">QR Code</p>
                <img 
                  src={
                    typeof booking.qrCode === 'string' && booking.qrCode.startsWith('data:') 
                      ? booking.qrCode 
                      : typeof booking.qrCode === 'string' && booking.qrCode.length > 100
                        ? `data:image/png;base64,${booking.qrCode}`
                        : booking.qrCode
                  } 
                  alt="QR Code" 
                  className="max-w-[200px] rounded-lg" 
                  onError={(e) => {
                    console.error('QR Code image failed to load:', booking.qrCode);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            {booking.qtCode && (
              <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c08aa4] mb-2">QT Code</p>
                <p className="text-sm font-semibold text-[#402542] break-all">{booking.qtCode}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {booking?.checkInImageUrl && (
        <Card>
          <SectionTitle>Check-in Image</SectionTitle>
          <div className="rounded-xl border border-[#f4c7da] bg-[#fffafb] p-3">
            <img src={booking.checkInImageUrl} alt="Check-in" className="max-w-full rounded-lg" />
          </div>
        </Card>
      )}

    </section>
  );
}
