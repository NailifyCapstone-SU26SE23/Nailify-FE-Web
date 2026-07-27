import {
  Calendar,
  Clock3,
  CreditCard,
  ScanQrCode,
  UserRound,
  Maximize2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROLES } from "../../../../shared/constants/roles";
import { BOOKING_ROLE_CONFIG } from "../services/mockBookings";
import { fetchBookingById, fetchUserById } from "../services/bookingsService";
import { Spin, Alert, Modal } from "antd";
import { ConfirmBookingModal } from "../components/ConfirmBookingModal";
import { RejectBookingModal } from "../components/RejectBookingModal";
import { CancelBookingModal } from "../components/CancelBookingModal";
import { motion, AnimatePresence } from "framer-motion";

const roleConfig = BOOKING_ROLE_CONFIG[ROLES.manager];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

function Card({ className = "", children }) {
  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={`rounded-[28px] border border-[#f1e7ed] bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_30px_50px_-15px_rgba(0,0,0,0.06)] md:p-7 ${className}`}
    >
      {children}
    </motion.article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionTitle({ children, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold tracking-tight text-[#2d1b35]">{children}</h2>
      {subtitle ? <p className="mt-2 text-sm leading-relaxed text-[#a88a9f]">{subtitle}</p> : null}
    </div>
  );
}

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
  subtitle: PropTypes.string,
};

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#a88a9f]">{label}</p>
      <div className="mt-2 text-sm font-medium text-[#2d1b35] break-all">{children}</div>
    </div>
  );
}

InfoItem.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function InfoTile({ label, children, className = "" }) {
  return (
    <div className={`rounded-[18px] border border-[#f1e7ed] bg-gradient-to-br from-white to-[#fffafb] p-5 shadow-sm hover:shadow-md transition-shadow duration-300 min-w-0 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-[#a88a9f] truncate">{label}</p>
      <div className="mt-3 text-sm font-semibold text-[#2d1b35] truncate break-all">{children}</div>
    </div>
  );
}

InfoTile.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
};

function formatStatusDisplay(status) {
  if (status === "CheckedIn") return "Checked In";
  if (status === "InProgress") return "In Progress";
  if (status === "RescheduleReq") return "Reschedule Req";
  if (status === "ServiceCompleted") return "Completed";
  return status;
}

function getStatusTone(status) {
  switch (status) {
    case "CheckedIn":
    case "Checked In":
      return "bg-[#4755b8] text-white border-[#4755b8]";
    case "InProgress":
    case "In Progress":
      return "bg-[#7e4fe6] text-white border-[#7e4fe6]";
    case "Pending":
      return "bg-[#db8520] text-white border-[#db8520]";
    case "Confirmed":
    case "Approved":
      return "bg-[#2fa25f] text-white border-[#2fa25f]";
    case "Completed":
    case "ServiceCompleted":
      return "bg-[#2fa25f] text-white border-[#2fa25f]";
    case "Rejected":
      return "bg-[#e1447f] text-white border-[#e1447f]";
    case "RescheduleReq":
    case "Reschedule Req":
      return "bg-[#db8520] text-white border-[#db8520]";
    default:
      return "bg-[#6b7280] text-white border-[#6b7280]";
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

function formatTimeRange(startTime, durationMinutes, fallbackDateTime) {
  const formattedStart = formatTime(startTime, fallbackDateTime);
  if (!durationMinutes || formattedStart === "N/A") {
    return formattedStart;
  }

  // Parse start time
  const normalizedTime = String(startTime || "").trim();
  let rawTime = normalizedTime
    || String(fallbackDateTime || "")
      .trim()
      .split("T")[1]
      ?.replace("Z", "")
      ?.split(".")[0];

  if (!rawTime) {
    return formattedStart;
  }

  let [hours, minutes = 0] = rawTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return formattedStart;
  }

  // Calculate end time
  const totalStartMinutes = hours * 60 + minutes;
  const totalEndMinutes = totalStartMinutes + durationMinutes;
  const endHours = Math.floor(totalEndMinutes / 60) % 24;
  const endMinutes = totalEndMinutes % 60;

  const formattedEnd = new Date(2000, 0, 1, endHours, endMinutes).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${formattedStart} - ${formattedEnd}`;
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
  const name = booking?.nailArtistName || booking?.artistName || booking?.fullName || booking?.name;
  return name === "Chưa chỉ định" ? "Unassigned" : name || "Unassigned";
}

// Helper to properly format QR code src
function getQrCodeSrc(qrCode) {
  if (!qrCode) return null;
  const trimmed = String(qrCode).trim();

  // If it's already a data URL, use as-is
  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  // If it's a URL (starts with http/https), use as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // If it's a valid base64 string (without prefix), add data URL prefix
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 50) {
    return `data:image/png;base64,${trimmed}`;
  }

  return trimmed;
}

export function ManagerBookingDetailPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isQrExpanded, setIsQrExpanded] = useState(false);

  const mapBooking = useCallback((rawBooking) => {
    const artistName = getArtistDisplayName(rawBooking);
    const artistId =
      rawBooking.staffId ||
      rawBooking.nailArtistId ||
      rawBooking.staffArtistId ||
      rawBooking.artistId ||
      null;

    // Discount calculation (handles negative/positive values from API)
    let totalDiscount = Math.abs(rawBooking?.discount || rawBooking?.discountAmount || 0);
    if (rawBooking?.discounts && Array.isArray(rawBooking.discounts)) {
      const discountSum = rawBooking.discounts.reduce((sum, d) => sum + Math.abs(d?.amount || 0), 0);
      if (discountSum > 0) {
        totalDiscount = discountSum;
      }
    }

    // Original base price (total price before discount)
    const basePrice = rawBooking?.price || (rawBooking?.totalPrice ? (rawBooking.totalPrice + totalDiscount) : 0);
    // Final price the customer pays (totalPrice from API is the final price)
    const finalPrice = rawBooking?.totalPrice || (basePrice - totalDiscount);

    return {
      ...rawBooking,
      id: rawBooking.bookingId || rawBooking.id,
      bookingId: rawBooking.bookingId || rawBooking.id,
      date: formatDate(rawBooking.bookingDate || rawBooking.createdAt),
      time: formatTimeRange(rawBooking.startTime, rawBooking.totalDuration, rawBooking.bookingDate || rawBooking.createdAt),
      customerName: rawBooking.customerName || (rawBooking.customer ? `${rawBooking.customer.firstName} ${rawBooking.customer.lastName}` : "Unknown Customer"),
      customerId: rawBooking.customerId,
      phone: rawBooking.customerPhone || rawBooking.phone || (rawBooking.customer ? rawBooking.customer.phone : ""),
      email: rawBooking.email || (rawBooking.customer ? rawBooking.customer.email : ""),
      avatarUrl: rawBooking.avatarUrl || (rawBooking.customer ? rawBooking.customer.avatarUrl : ""),
      serviceName: rawBooking.serviceName || "Nail Service",
      artistName,
      artistId,
      deposit: rawBooking.depositAmount ? formatVND(rawBooking.depositAmount) : "Pending",
      depositAmount: rawBooking.depositAmount,
      depositTone: rawBooking.depositAmount ? "text-[#2fa25f]" : "text-[#db8520]",
      status: rawBooking.status || "Pending",
      totalPrice: basePrice,
      discounts: rawBooking?.discounts,
      discountAmount: totalDiscount,
      discountPercentage: rawBooking?.discountPercentage,
      discountCode: rawBooking?.discountCode,
      finalPrice,
      qrCode: rawBooking.qrCode,
      qtCode: rawBooking.qtCode,
      checkInImageUrl: rawBooking.checkInImageUrl,
      checkOutImagesUrl: rawBooking.checkOutImagesUrl,
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
      const mappedBooking = mapBooking(rawBooking);
      setBooking(mappedBooking);

      if (mappedBooking.customerId) {
        try {
          const rawCustomer = await fetchUserById(mappedBooking.customerId);
          setCustomer(rawCustomer);
        } catch (err) {
          console.warn("Failed to load customer details:", err);
        }
      }
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
    normalizedStatus.includes("complete") ||
    normalizedStatus.includes("confirmed") ||
    normalizedStatus.includes("approved");

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="flex min-h-[100dvh] flex-col gap-6 p-4 lg:p-8"
    >
      <motion.div variants={fadeInUp}>
        <Card className="overflow-hidden border-none bg-gradient-to-br from-[#fff3f8] via-[#fffafb] to-[#fff5fb] p-0 shadow-[0_20px_40px_-15px_rgba(234,79,147,0.12)]">
          <div className="flex flex-col gap-6 p-7 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-[#ff8ebb] to-[#ea4f93] text-white shadow-[0_10px_24px_rgba(234,79,147,0.35)]"
              >
                <Clock3 size={28} />
              </motion.div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-[#2d1b35]">Booking Detail</h1>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold ${getStatusTone(booking?.status)}`}>
                    {booking?.status === "InProgress" || booking?.status === "In Progress" ? (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="h-2 w-2 rounded-full bg-current"
                      />
                    ) : null}
                    {formatStatusDisplay(booking?.status)}
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#8b7382]">
                  Manage booking information, customer details, assigned staff, payment summary, and confirmation codes.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <motion.div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${isRefreshing ? "bg-white text-[#ea4f93] shadow-md" : "bg-white text-[#8b7382]"}`}
              >
                <span className={`h-2 w-2 rounded-full ${isRefreshing ? "bg-[#ea4f93] animate-pulse" : "bg-[#d9bfd0]"}`} />
                {isRefreshing ? "Refreshing..." : "Live"}
              </motion.div>

              {/* Action Buttons Container - Responsive Layout */}
              <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:w-auto">

                {/* Only show action buttons if not final, not checked in, and not in progress */}
                {!isFinalStatus &&
                  booking?.status !== "CheckedIn" &&
                  booking?.status !== "Checked In" &&
                  booking?.status !== "InProgress" &&
                  booking?.status !== "In Progress" ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setIsConfirmModalOpen(true)}
                      disabled={!normalizedBookingId || isRefreshing}
                      className="inline-flex items-center justify-center rounded-full bg-[#2fa25f] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap flex-1 sm:flex-none"
                    >
                      Confirm
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setIsCancelModalOpen(true)}
                      disabled={!normalizedBookingId || isRefreshing}
                      className="inline-flex items-center justify-center rounded-full border border-[#f1e7ed] bg-white px-5 py-2.5 text-xs font-semibold text-[#8b7382] transition-all duration-300 hover:border-[#ea4f93] hover:bg-[#fff7fb] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap flex-1 sm:flex-none"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      disabled={!normalizedBookingId || isRefreshing}
                      className="inline-flex items-center justify-center rounded-full border border-[#f1e7ed] bg-white px-5 py-2.5 text-xs font-semibold text-[#e1447f] transition-all duration-300 hover:border-[#e1447f] hover:bg-[#fff4f8] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap flex-1 sm:flex-none"
                    >
                      Reject
                    </motion.button>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-[#f1e7ed] bg-gradient-to-b from-[#fff9fb] to-white p-6 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile label="Customer">
              <div className="flex items-center gap-2">
                <UserRound size={16} className="text-[#ea4f93]" />
                <span className="truncate font-medium">{booking?.customerName}</span>
              </div>
            </InfoTile>
            <InfoTile label="Schedule">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#ea4f93]" />
                <span className="truncate font-medium">{booking?.date} · {booking?.time}</span>
              </div>
            </InfoTile>
            <InfoTile label="Duration">
              <span className="font-medium">{booking?.totalDuration ? formatDuration(booking.totalDuration) : "N/A"}</span>
            </InfoTile>
            <InfoTile label="Total Price" className="bg-gradient-to-br from-[#fff7fb] to-white">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-[#ea4f93] font-semibold">
                  <CreditCard size={16} />
                  <span className="truncate">{formatVND(booking?.discountAmount > 0 ? booking.finalPrice : booking.totalPrice)}</span>
                </div>
                {booking?.discountAmount > 0 && (
                  <span className="text-xs text-[#a88a9f] line-through mt-1">
                    {formatVND(booking?.totalPrice)}
                  </span>
                )}
              </div>
            </InfoTile>
          </div>
        </Card>
      </motion.div>

      {/* Main Content Grid with Sticky Sidebar */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] items-start">
        {/* Left Column: Customer Info, Service Info, Booking Items */}
        <div className="space-y-5">
          <Card>
            <SectionTitle subtitle="Basic customer information.">
              Customer Information
            </SectionTitle>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InfoItem label="Customer Name">
                {customer
                  ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                  : booking?.customerName}
              </InfoItem>
              {(booking?.phone || customer?.phone) && (
                <InfoItem label="Phone Number">
                  {customer?.phone || booking?.phone}
                </InfoItem>
              )}
              {(booking?.email || customer?.email) && (
                <InfoItem label="Email">
                  {customer?.email || booking?.email}
                </InfoItem>
              )}
            </div>
            {(booking?.checkInImageUrl || booking?.checkOutImagesUrl) && (
              <div className="mt-6 pt-6 border-t border-[#f1e7ed] space-y-6">
                {booking?.checkInImageUrl && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#a88a9f] mb-3">Check-in Photo</p>
                    <div className="overflow-hidden rounded-[18px] border border-[#f1e7ed] bg-gradient-to-br from-white to-[#fffafb] p-2">
                      <img
                        crossOrigin="anonymous"
                        src={booking.checkInImageUrl}
                        alt="Check-in"
                        className="max-w-full rounded-lg w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
                {booking?.checkOutImagesUrl && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#a88a9f] mb-3">Check-out Photos</p>
                    <div className="overflow-hidden rounded-[18px] border border-[#f1e7ed] bg-gradient-to-br from-white to-[#fffafb] p-2">
                      {Array.isArray(booking.checkOutImagesUrl) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {booking.checkOutImagesUrl.map((url, idx) => (
                            <img
                              key={idx}
                              crossOrigin="anonymous"
                              src={url}
                              alt={`Check-out ${idx + 1}`}
                              className="rounded-lg w-full h-40 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ))}
                        </div>
                      ) : (
                        <img
                          crossOrigin="anonymous"
                          src={booking.checkOutImagesUrl}
                          alt="Check-out"
                          className="max-w-full rounded-lg w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle subtitle="Details about the booked service.">
              Service Information
            </SectionTitle>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InfoItem label="Date">{booking?.date}</InfoItem>
              <InfoItem label="Time">{booking?.time}</InfoItem>
              <InfoItem label="Estimated Duration">{booking?.totalDuration ? formatDuration(booking.totalDuration) : "N/A"}</InfoItem>
              <InfoItem label="Nail Artist">{booking?.artistName}</InfoItem>
              <div className="md:col-span-2">
                <InfoItem label="Status">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${getStatusTone(booking?.status)}`}>
                    {(booking?.status === "InProgress" || booking?.status === "In Progress") && (
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="h-2 w-2 rounded-full bg-white"
                      />
                    )}
                    {formatStatusDisplay(booking?.status)}
                  </span>
                </InfoItem>
              </div>
            </div>
          </Card>

          {booking?.bookingItems && booking.bookingItems.length > 0 && (
            <Card>
              <SectionTitle subtitle="List of booked services.">
                Service List
              </SectionTitle>
              <div className="space-y-4">
                {booking.bookingItems.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-[18px] border border-[#f1e7ed] bg-gradient-to-br from-white to-[#fffafb] p-5 hover:shadow-[0_10px_24px_rgba(234,79,147,0.08)] transition-all duration-300"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-[#2d1b35]">{item.serviceName || "Nail Service"}</p>
                        {item.nailVariantName && (
                          <p className="mt-1 text-sm text-[#a88a9f]">Nail Variant: {item.nailVariantName}</p>
                        )}
                        {item.customerNailName && (
                          <p className="text-sm text-[#a88a9f]">Customer Nail Set: {item.customerNailName}</p>
                        )}

                        {/* Nail variant image and customer nail image */}
                        {(item.nailVariantImageUrl || item.customerNailImageUrl) && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {item.nailVariantImageUrl && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-[#a88a9f] mb-2">Nail Variant</p>
                                <div className="rounded-lg border border-[#f1e7ed] overflow-hidden">
                                  <img
                                    src={item.nailVariantImageUrl.replace(/`/g, '')}
                                    alt={item.nailVariantName}
                                    className="w-full h-40 object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                              </div>
                            )}
                            {item.customerNailImageUrl && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-[#a88a9f] mb-2">Customer Nail</p>
                                <div className="rounded-lg border border-[#f1e7ed] overflow-hidden">
                                  <img
                                    src={item.customerNailImageUrl.replace(/`/g, '')}
                                    alt={item.customerNailName}
                                    className="w-full h-40 object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="grid min-w-[260px] gap-4 sm:grid-cols-3">
                        <InfoItem label="Quantity">{item.quantity !== undefined ? item.quantity : "-"}</InfoItem>
                        <InfoItem label="Duration">{item.duration !== undefined ? formatDuration(item.duration) : "-"}</InfoItem>
                        <InfoItem label="Price">
                          <div className="flex flex-col">
                            <span className={item?.discountAmount > 0 ? "text-[#a88a9f] line-through text-xs" : ""}>
                              {item.price !== undefined ? formatVND(item.price) : "-"}
                            </span>
                            {item?.discountAmount > 0 && (
                              <>
                                <span className="text-[#2fa25f] text-xs">-{formatVND(item.discountAmount)}</span>
                                <span className="font-semibold text-[#2d1b35]">{formatVND(item.finalPrice)}</span>
                              </>
                            )}
                            {item?.discountAmount === 0 && (
                              <span className="font-semibold text-[#2d1b35]">{formatVND(item.price)}</span>
                            )}
                          </div>
                        </InfoItem>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Payment & codes (Sticky) */}
        <div className="space-y-5 xl:sticky xl:top-5 xl:h-fit">
          <Card>
            <SectionTitle subtitle="Payment information and confirmation codes.">
              Payment & codes
            </SectionTitle>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <InfoItem label="Deposit status">
                  <span className={booking?.depositTone}>{booking?.deposit}</span>
                </InfoItem>
                <InfoItem label="Total">{formatVND(booking?.totalPrice)}</InfoItem>
                {booking?.discountAmount > 0 && (
                  <>
                    {booking?.discounts && booking.discounts.length > 0 ? (
                      booking.discounts.map((discount, index) => (
                        <InfoItem key={index} label={`Discount · ${discount.type || 'Discount'}`}>
                          <div className="flex flex-col">
                            <span className="text-[#2fa25f] font-semibold">
                              {discount.name} · -{formatVND(discount.amount)}
                            </span>
                            {discount.amountDisplay && (
                              <span className="text-xs text-[#a88a9f]">
                                {discount.amountDisplay}
                              </span>
                            )}
                          </div>
                        </InfoItem>
                      ))
                    ) : (
                      <InfoItem label="Discount">
                        <span className="text-[#2fa25f] font-semibold">
                          -{formatVND(booking?.discountAmount)}
                          {booking?.discountPercentage ? ` (${booking.discountPercentage}%)` : ''}
                          {booking?.discountCode ? ` · Code: ${booking.discountCode}` : ''}
                        </span>
                      </InfoItem>
                    )}
                    <InfoItem label="Final amount">
                      <span className="text-[#ea4f93] font-bold text-lg">
                        {formatVND(booking?.finalPrice)}
                      </span>
                    </InfoItem>
                  </>
                )}
                {!(booking?.discountAmount > 0) && (
                  <InfoItem label="Final amount">{formatVND(booking?.totalPrice)}</InfoItem>
                )}
              </div>

              {(booking?.qrCode || booking?.qtCode) && (
                <div className="pt-3 mt-3 border-t border-[#f5e2ec]">
                  <p className="text-[11px] font-semibold text-[#a88a9f] mb-3">Confirmation codes</p>
                  <div className="space-y-4">
                    {booking.qrCode && (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="rounded-[16px] border border-[#f5d6e4] bg-white p-4 cursor-pointer hover:border-[#ea4f93] hover:shadow-md transition-all duration-300"
                        onClick={() => setIsQrExpanded(true)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[11px] font-semibold text-[#a88a9f]">QR code</p>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setIsQrExpanded(true); }}
                            className="text-[#ea4f93] hover:text-[#c9366b] transition-colors"
                          >
                            <Maximize2 size={16} />
                          </motion.button>
                        </div>
                        <img
                          crossOrigin="anonymous"
                          src={getQrCodeSrc(booking.qrCode)}
                          alt="QR Code"
                          className="max-w-[120px] mx-auto rounded-xl"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            console.error("QR Code image failed to load:", booking.qrCode);
                            e.target.style.display = "none";
                          }}
                        />
                      </motion.div>
                    )}
                    {booking.qtCode && (
                      <div className="rounded-[16px] border border-[#f5d6e4] bg-white p-4">
                        <p className="mb-2 text-[11px] font-semibold text-[#a88a9f]">QT code</p>
                        <p className="break-all text-sm font-medium text-[#2d1b35]">{booking.qtCode}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* QR Code Expand Modal */}
      <Modal
        open={isQrExpanded}
        onCancel={() => setIsQrExpanded(false)}
        footer={null}
        closable={false}
        centered
        width={420}
        styles={{
          content: { padding: 0, borderRadius: 28, overflow: "hidden", boxShadow: "0_30px_60px_-15px_rgba(0,0,0,0.25)" },
          mask: { backdropFilter: "blur(8px)" },
        }}
      >
        <div className="bg-white p-6 text-center">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-semibold text-[#2d1b35]">QR Code</p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setIsQrExpanded(false)}
              className="text-[#a88a9f] hover:text-[#ea4f93] transition-colors"
            >
              <X size={20} />
            </motion.button>
          </div>
          <img
            crossOrigin="anonymous"
            src={getQrCodeSrc(booking?.qrCode)}
            alt="QR Code"
            className="max-w-[280px] mx-auto rounded-[18px]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              console.error("QR Code image failed to load:", booking?.qrCode);
              e.target.style.display = "none";
            }}
          />
        </div>
      </Modal>

      <ConfirmBookingModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        bookingId={normalizedBookingId}
        onSuccess={() => loadBooking({ silent: true })}
        booking={booking}
      />
      <CancelBookingModal
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        bookingId={normalizedBookingId}
        onSuccess={() => loadBooking({ silent: true })}
        booking={booking}
      />
      <RejectBookingModal
        open={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        bookingId={normalizedBookingId}
        onSuccess={() => loadBooking({ silent: true })}
        booking={booking}
      />

    </motion.section>
  );
}
