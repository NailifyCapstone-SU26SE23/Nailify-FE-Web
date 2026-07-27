import {
  Calendar,
  Clock3,
  CreditCard,
  ScanQrCode,
  UserRound,
  Maximize2,
  X,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  Tag,
  DollarSign,
  Edit3,
  NotebookPen,
  Crown,
  FileText,
  Check,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../shared/constants/routes";
import { PropTypes } from "../../../../shared/utils/propTypes";
import { ROLES } from "../../../../shared/constants/roles";
import { BOOKING_ROLE_CONFIG } from "../services/mockBookings";
import {
  fetchBookingById,
  fetchUserById,
  managerSuggestTime,
  managerApproveReschedule,
  managerRejectReschedule,
} from "../services/bookingsService";
import { Spin, Alert, Modal, Input } from "antd";
import toast from "react-hot-toast";
import { ConfirmBookingModal } from "../components/ConfirmBookingModal";
import { RejectBookingModal } from "../components/RejectBookingModal";
import { CancelBookingModal } from "../components/CancelBookingModal";
import { AssignArtistModal } from "../components/AssignArtistModal";
import { ProposeRescheduleModal } from "../components/ProposeRescheduleModal";
import { OnsiteAddonModal } from "../components/OnsiteAddonModal";
import { motion, AnimatePresence } from "framer-motion";
import { getSalonId } from "../../staff-artist-management/services/nailArtistsService";
import {
  evaluateInterleavingOpportunity,
  autoAssignPrepArtist,
} from "../services/bookingProceduresService";

const roleConfig = BOOKING_ROLE_CONFIG[ROLES.manager];

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

function Card({ className = "", children }) {
  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={`rounded-[24px] border border-[#F3E2EC] bg-white p-6 shadow-[0_12px_32px_-8px_rgba(219,70,117,0.05)] transition-all duration-300 hover:shadow-[0_20px_40px_-8px_rgba(219,70,117,0.1)] hover:border-[#E8C5D8] md:p-7 ${className}`}
    >
      {children}
    </motion.article>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

function SectionTitle({ children, subtitle, icon: Icon, actionButton }) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFF0F5] to-[#FFE4EE] text-[#E84F93] shadow-xs">
            <Icon size={18} />
          </div>
        )}
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-[#2B182B]">{children}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-[#9E8497] font-medium leading-relaxed">{subtitle}</p> : null}
        </div>
      </div>
      {actionButton}
    </div>
  );
}

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  actionButton: PropTypes.node,
};

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#9E8497] mb-1">{label}</p>
      <div className="text-sm font-medium text-[#2B182B] break-all">{children}</div>
    </div>
  );
}

InfoItem.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function InfoTile({ label, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[#F3E2EC] bg-gradient-to-br from-white to-[#FFF9FB] p-4 shadow-2xs hover:shadow-xs transition-shadow duration-300 min-w-0 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497] truncate">{label}</p>
      <div className="mt-1.5 text-sm font-extrabold text-[#2B182B] truncate break-all">{children}</div>
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
  if (status === "RescheduleReq" || status === "ReschedulePending") return "Reschedule Requested";
  if (status === "RescheduleSuggested") return "Reschedule Proposed";
  if (status === "ServiceCompleted") return "Completed";
  return status;
}

function getStatusTone(status) {
  switch (status) {
    case "CheckedIn":
    case "Checked In":
      return "bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] text-[#4338CA] border-[#A5B4FC]/80 shadow-xs";
    case "InProgress":
    case "In Progress":
      return "bg-gradient-to-r from-[#F5F3FF] to-[#EDE9FE] text-[#6D28D9] border-[#C4B5FD]/80 shadow-xs";
    case "Pending":
      return "bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] text-[#B45309] border-[#FCD34D]/80 shadow-xs";
    case "Confirmed":
    case "Approved":
      return "bg-gradient-to-r from-[#ECFDF5] to-[#D1FAE5] text-[#047857] border-[#6EE7B7]/80 shadow-xs";
    case "Completed":
    case "ServiceCompleted":
      return "bg-gradient-to-r from-[#ECFDF5] to-[#D1FAE5] text-[#065F46] border-[#34D399]/80 shadow-xs";
    case "Rejected":
      return "bg-gradient-to-r from-[#FEF2F2] to-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]/80 shadow-xs";
    case "RescheduleReq":
    case "Reschedule Req":
    case "ReschedulePending":
    case "RescheduleSuggested":
      return "bg-gradient-to-r from-[#FFF7ED] to-[#FFEDD5] text-[#C2410C] border-[#FDBA74]/80 shadow-xs";
    default:
      return "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]";
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
  if (formattedStart === "N/A") return "N/A";

  const normalizedTime = String(startTime || "").trim();
  const rawTime = normalizedTime
    || String(fallbackDateTime || "")
      .trim()
      .split("T")[1]
      ?.replace("Z", "")
      ?.split(".")[0];

  if (!rawTime) return formattedStart;
  let [hours, minutes = 0] = rawTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return formattedStart;

  const totalStartMinutes = hours * 60 + minutes;
  const totalEndMinutes = totalStartMinutes + (durationMinutes || 60);
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
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function getArtistDisplayName(booking) {
  const name = booking?.nailArtistName || booking?.artistName || booking?.fullName || booking?.name;
  return name === "Chưa chỉ định" ? "Unassigned" : name || "Unassigned";
}

function getQrCodeSrc(qrCode) {
  if (!qrCode) return null;
  const trimmed = String(qrCode).trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 50) {
    return `data:image/png;base64,${trimmed}`;
  }
  return trimmed;
}

export function ManagerBookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Modals state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isAssignArtistModalOpen, setIsAssignArtistModalOpen] = useState(false);
  const [isProposeRescheduleModalOpen, setIsProposeRescheduleModalOpen] = useState(false);
  const [isQrExpanded, setIsQrExpanded] = useState(false);
  const [activeImageModalUrl, setActiveImageModalUrl] = useState(null);

  // Edit Notes Modal State
  const [isEditNotesModalOpen, setIsEditNotesModalOpen] = useState(false);
  const [bookingNotesText, setBookingNotesText] = useState("");

  // On-site Add-on & Interleaving State (BR-01 & BR-03)
  const [isOnsiteAddonModalOpen, setIsOnsiteAddonModalOpen] = useState(false);
  const [interleavingData, setInterleavingData] = useState(null);
  const [evaluatingInterleaving, setEvaluatingInterleaving] = useState(false);
  const [assigningPrep, setAssigningPrep] = useState(false);

  const mapBooking = useCallback((rawBooking) => {
    const artistName = getArtistDisplayName(rawBooking);
    const artistId =
      rawBooking.staffId ||
      rawBooking.nailArtistId ||
      rawBooking.staffArtistId ||
      rawBooking.artistId ||
      null;

    let totalDiscount = rawBooking?.discountAmount || 0;
    if (rawBooking?.discounts && Array.isArray(rawBooking.discounts)) {
      totalDiscount = rawBooking.discounts.reduce((sum, discount) => sum + (discount?.amount || 0), 0);
    }
    const finalPrice = rawBooking?.totalPrice ? (rawBooking.totalPrice - totalDiscount) : 0;

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
      depositTone: rawBooking.depositAmount ? "text-[#059669] font-bold" : "text-[#D97706] font-bold",
      status: rawBooking.status || "Pending",
      totalPrice: rawBooking.totalPrice,
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
      notes: rawBooking.notes || rawBooking.customerNotes || "Customer prefers extra cuticle care and soft blush pink gel shade.",
      proposedBookingDate: rawBooking.proposedBookingDate ? formatDate(rawBooking.proposedBookingDate) : null,
      proposedStartTime: rawBooking.proposedStartTime ? formatTime(rawBooking.proposedStartTime) : null,
      proposedBy: rawBooking.proposedBy || null,
      rescheduleReason: rawBooking.rescheduleReason || null,
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
      setBookingNotesText(mappedBooking.notes);

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

  const handleSaveNotes = () => {
    setBooking((prev) => (prev ? { ...prev, notes: bookingNotesText } : prev));
    toast.success("Booking notes updated successfully!", { icon: "📝" });
    setIsEditNotesModalOpen(false);
  };

  const handleApproveCustomerReschedule = async () => {
    try {
      setIsRefreshing(true);
      await managerApproveReschedule(normalizedBookingId);
      toast.success("Customer's reschedule request approved!", { icon: "✅" });
      await loadBooking({ silent: true });
    } catch (err) {
      console.error("Failed to approve reschedule:", err);
      toast.error(err.message || "Failed to approve reschedule.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRejectCustomerReschedule = async () => {
    try {
      setIsRefreshing(true);
      await managerRejectReschedule(normalizedBookingId);
      toast.success("Customer's reschedule request rejected.", { icon: "❌" });
      await loadBooking({ silent: true });
    } catch (err) {
      console.error("Failed to reject reschedule:", err);
      toast.error(err.message || "Failed to reject reschedule.");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isLoading && error) {
    return (
      <section className="flex min-h-full flex-col gap-4 p-6 font-sans">
        <Link to="/manager/bookings" className="inline-flex items-center gap-2 text-xs font-bold text-[#E84F93]">
          <ArrowLeft size={16} /> Back to bookings list
        </Link>
        <Alert message="Error Loading Booking" description={error} type="error" showIcon className="rounded-2xl" />
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="flex min-h-[400px] items-center justify-center font-sans">
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
      className="flex min-h-[100dvh] flex-col gap-6 p-4 lg:p-8 font-sans bg-[#FAF6F8]"
    >
      {/* Top Hero Banner */}
      <motion.div variants={fadeInUp}>
        <div className="relative overflow-hidden rounded-[28px] border border-[#F3D6E5]/80 bg-gradient-to-r from-[#FFF0F5] via-[#FFFFFF] to-[#FFF0F5] p-6 lg:p-7 shadow-[0_16px_36px_-10px_rgba(234,79,147,0.12)]">
          {/* Subtle Shimmer Background Blur */}
          <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[#E84F93]/10 blur-3xl" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
            <div>
              <button
                type="button"
                onClick={() => navigate("/manager/bookings")}
                className="inline-flex items-center gap-2 rounded-full border border-[#F3D6E5] bg-white px-3.5 py-1.5 text-xs font-bold text-[#E84F93] hover:bg-[#FFF0F5] hover:border-[#E84F93] transition shadow-xs mb-3 group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Bookings</span>
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-[#2B182B] tracking-tight font-serif">
                  Booking Detail
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E5C687]/80 bg-gradient-to-r from-[#FFF9EE] to-[#FFF3DC] px-3.5 py-1 text-xs font-bold text-[#9E731A] shadow-2xs">
                  #{String(booking?.bookingId || bookingId).slice(0, 8).toUpperCase()}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-extrabold shadow-2xs ${getStatusTone(booking?.status)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {formatStatusDisplay(booking?.status)}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[#9E8497] font-medium max-w-xl">
                Comprehensive booking overview, customer preferences, assigned nail staff, and payment breakdown.
              </p>
            </div>

            {/* Header Action Buttons Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setIsEditNotesModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#F3D7E4] bg-white px-4 py-2.5 text-xs font-bold text-[#2B182B] hover:border-[#E84F93] hover:text-[#E84F93] hover:bg-[#FFF5FA] transition-all shadow-xs"
              >
                <Edit3 size={15} className="text-[#E84F93]" />
                <span>Edit Notes</span>
              </motion.button>

              {/* Propose Reschedule Button */}
              {!isFinalStatus && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setIsProposeRescheduleModalOpen(true)}
                  disabled={!normalizedBookingId || isRefreshing}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E84F93] bg-[#FFF0F5] px-5 py-2.5 text-xs font-extrabold text-[#E84F93] hover:bg-[#E84F93] hover:text-white transition-all disabled:opacity-50"
                >
                  <Calendar size={15} />
                  <span>Propose New Time</span>
                </motion.button>
              )}

              {!isFinalStatus &&
                booking?.status !== "CheckedIn" &&
                booking?.status !== "Checked In" &&
                booking?.status !== "InProgress" &&
                booking?.status !== "In Progress" ? (
                <>
                  {(booking?.status === "Pending") && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => setIsConfirmModalOpen(true)}
                      disabled={!normalizedBookingId || isRefreshing}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#10B981] to-[#047857] px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      <span>Confirm</span>
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setIsAssignArtistModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6366F1] to-[#4F46E5] px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <UserCheck size={16} />
                    <span>Assign Artist</span>
                  </motion.button>

                  {booking?.status === "Pending" ? (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      disabled={!normalizedBookingId || isRefreshing}
                      className="inline-flex items-center gap-2 rounded-full border border-[#FECDD3] bg-[#FEF2F2] px-4 py-2.5 text-xs font-bold text-[#E11D48] hover:bg-[#FEE2E2] transition-all disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      <span>Reject</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => setIsCancelModalOpen(true)}
                      disabled={!normalizedBookingId || isRefreshing}
                      className="inline-flex items-center gap-2 rounded-full border border-[#F3D7E4] bg-white px-4 py-2.5 text-xs font-bold text-[#E84F93] hover:bg-[#FFF5FA] transition-all disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      <span>Cancel Booking</span>
                    </motion.button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Details 2-Column Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)] items-start">
        {/* Left Section: Customer Info, Service Appointment & Items */}
        <div className="space-y-6">
          {/* Customer Reschedule Request Alert Banner */}
          {(booking?.status === "ReschedulePending" || booking?.status === "RescheduleReq" || booking?.proposedBy === "Customer") && (
            <motion.div variants={fadeInUp} className="rounded-[24px] border-2 border-[#6366F1]/50 bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#EEF2FF] p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4F46E5]">
                    <Calendar size={14} /> Customer Requested Reschedule
                  </span>
                  <p className="text-sm font-extrabold text-[#1E1B4B] mt-1">
                    Requested Date: <span className="text-[#4F46E5]">{booking.proposedBookingDate || "N/A"}</span> · Time: <span className="text-[#4F46E5]">{booking.proposedStartTime || "N/A"}</span>
                  </p>
                  {booking.rescheduleReason && (
                    <p className="text-xs text-[#4338CA] italic mt-0.5">"{booking.rescheduleReason}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleApproveCustomerReschedule}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#047857] px-4 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} /> Accept Request
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectCustomerReschedule}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#FECDD3] bg-white px-4 py-2 text-xs font-bold text-[#E11D48] hover:bg-[#FEF2F2] transition disabled:opacity-50"
                  >
                    <XCircle size={15} /> Decline
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manager Reschedule Proposal Sent Banner */}
          {(booking?.status === "RescheduleSuggested" && booking?.proposedBy === "Manager") && (
            <motion.div variants={fadeInUp} className="rounded-[24px] border border-[#FCD34D] bg-[#FFFBEB] p-4.5 text-xs text-[#B45309] flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <Clock3 size={16} className="text-[#D97706] shrink-0" />
                <div>
                  <p className="font-extrabold text-[#92400E]">Reschedule Proposal Sent to Customer</p>
                  <p className="mt-0.5 text-[#B45309]">
                    Proposed Date: <strong>{booking.proposedBookingDate || "N/A"}</strong> · Time: <strong>{booking.proposedStartTime || "N/A"}</strong> (Awaiting customer response)
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Card 1: Customer Profile */}
          <Card>
            <SectionTitle
              subtitle="Contact details & customer profile"
              icon={UserRound}
              actionButton={
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5C687]/60 bg-gradient-to-r from-[#FFF9EE] to-[#FFF3DC] px-3.5 py-1 text-xs font-extrabold text-[#9E731A] shadow-2xs">
                  <Crown size={14} className="text-[#C99635]" />
                  VIP Member
                </span>
              }
            >
              Customer Profile
            </SectionTitle>

            <div className="flex items-center gap-4 mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF5FA] to-[#FFF0F5]/40 border border-[#F3D6E5]/60">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7AB8] to-[#E84F93] text-base font-extrabold text-white shadow-md">
                {(customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : booking?.customerName || "C").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold text-[#2B182B] truncate">
                  {customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : booking?.customerName}
                </h3>
                <p className="text-xs text-[#9E8497] font-medium">Registered Customer</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(booking?.phone || customer?.phone) && (
                <InfoItem label="Phone Number">
                  <a
                    href={`tel:${customer?.phone || booking?.phone}`}
                    className="inline-flex items-center gap-2 font-extrabold text-[#E84F93] hover:underline bg-[#FFF5FA] px-3 py-1.5 rounded-xl border border-[#F3D6E5]/60 text-xs w-full"
                  >
                    <Phone size={13} className="shrink-0 text-[#E84F93]" />
                    <span>{customer?.phone || booking?.phone}</span>
                  </a>
                </InfoItem>
              )}

              {(booking?.email || customer?.email) && (
                <InfoItem label="Email Address">
                  <a
                    href={`mailto:${customer?.email || booking?.email}`}
                    className="inline-flex items-center gap-2 font-medium text-[#2B182B] hover:text-[#E84F93] bg-[#FAF6F8] px-3 py-1.5 rounded-xl border border-[#F3E2EC] text-xs w-full truncate"
                  >
                    <Mail size={13} className="shrink-0 text-[#9E8497]" />
                    <span className="truncate">{customer?.email || booking?.email}</span>
                  </a>
                </InfoItem>
              )}
            </div>

            {/* Customer Notes & Special Requests */}
            <div className="mt-5 pt-4 border-t border-[#F3E2EC]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E8497] flex items-center gap-1.5">
                  <NotebookPen size={13} className="text-[#E84F93]" />
                  Customer Notes & Special Requests
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditNotesModalOpen(true)}
                  className="text-xs font-bold text-[#E84F93] hover:underline flex items-center gap-1"
                >
                  <Edit3 size={12} /> Edit Notes
                </button>
              </div>
              <div className="rounded-2xl border-l-4 border-l-[#E84F93] border-y border-r border-[#F3D6E5]/60 bg-gradient-to-r from-[#FFF5FA]/70 to-[#FFF0F5]/30 p-4 text-xs text-[#2B182B] leading-relaxed italic shadow-2xs">
                "{booking?.notes || "No special instructions provided by customer."}"
              </div>
            </div>

            {/* Check-in Photo */}
            {(booking?.checkInImageUrl || booking?.checkOutImagesUrl) && (
              <div className="mt-5 pt-4 border-t border-[#F3E2EC] space-y-3">
                {booking?.checkInImageUrl && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#9E8497] mb-2">Arrival Check-in Photo</p>
                    <div
                      className="group relative overflow-hidden rounded-2xl border border-[#F3D6E5] bg-white p-1.5 max-w-md cursor-pointer hover:border-[#E84F93] transition shadow-xs"
                      onClick={() => setActiveImageModalUrl(booking.checkInImageUrl)}
                    >
                      <img src={booking.checkInImageUrl} alt="Check-in" className="w-full h-44 object-cover rounded-xl group-hover:scale-102 transition duration-300" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-1.5">
                        <Maximize2 size={16} /> View Photo
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Card 2: Service & Appointment Info */}
          <Card>
            <SectionTitle
              subtitle="Scheduled appointment details & assigned artist"
              icon={Sparkles}
              actionButton={
                booking?.artistName === "Unassigned" ? (
                  <button
                    type="button"
                    onClick={() => setIsAssignArtistModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] px-3.5 py-1.5 text-xs font-extrabold text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white transition shadow-2xs"
                  >
                    <UserCheck size={13} />
                    Assign Artist Now
                  </button>
                ) : null
              }
            >
              Appointment Schedule
            </SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFFDFE] p-4 shadow-2xs">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E8497] mb-1">Booking Date</p>
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#2B182B]">
                  <Calendar size={15} className="text-[#E84F93] shrink-0" />
                  <span>{booking?.date}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFFDFE] p-4 shadow-2xs">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E8497] mb-1">Time Slot</p>
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#2B182B]">
                  <Clock3 size={15} className="text-[#E84F93] shrink-0" />
                  <span>{booking?.time}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFFDFE] p-4 shadow-2xs">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E8497] mb-1">Total Duration</p>
                <div className="flex items-center gap-2 text-sm font-extrabold text-[#2B182B]">
                  <Clock3 size={15} className="text-[#E84F93] shrink-0" />
                  <span>{booking?.totalDuration ? formatDuration(booking.totalDuration) : "60m"}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Service & Design Items List */}
          {booking?.bookingItems && booking.bookingItems.length > 0 && (
            <Card>
              <SectionTitle subtitle="Selected nail services & custom design try-ons" icon={Tag}>
                Booked Services ({booking.bookingItems.length})
              </SectionTitle>
              <div className="space-y-4">
                {booking.bookingItems.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-2xl border border-[#F3E2EC] bg-gradient-to-br from-white to-[#FFF9FB] p-5 shadow-2xs hover:border-[#E8C5D8] transition-all"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-extrabold text-[#2B182B]">{item.serviceName || "Nail Service"}</h4>
                        {item.nailVariantName && (
                          <p className="mt-1 text-xs font-bold text-[#E84F93] flex items-center gap-1">
                            <Sparkles size={12} /> Nail Variant: {item.nailVariantName}
                          </p>
                        )}
                        {item.customerNailName && (
                          <p className="text-xs text-[#9E8497] mt-0.5">Customer Nail Set: {item.customerNailName}</p>
                        )}

                        {/* Nail Variant Image Preview */}
                        {(item.nailVariantImageUrl || item.customerNailImageUrl) && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {item.nailVariantImageUrl && (
                              <div
                                className="group relative rounded-2xl border border-[#F3D6E5] overflow-hidden bg-white cursor-pointer hover:border-[#E84F93] transition shadow-2xs"
                                onClick={() => setActiveImageModalUrl(item.nailVariantImageUrl.replace(/`/g, ''))}
                              >
                                <img
                                  src={item.nailVariantImageUrl.replace(/`/g, '')}
                                  alt={item.nailVariantName || "Nail design"}
                                  className="w-full h-36 object-cover group-hover:scale-105 transition duration-300"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                  <Maximize2 size={16} /> View Design
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid min-w-[240px] gap-3 sm:grid-cols-3 bg-[#FAF0F5]/80 border border-[#F3D6E5]/60 p-3.5 rounded-2xl">
                        <InfoItem label="Quantity">{item.quantity !== undefined ? item.quantity : "1"}</InfoItem>
                        <InfoItem label="Duration">{item.duration !== undefined ? formatDuration(item.duration) : "-"}</InfoItem>
                        <InfoItem label="Price">
                          <span className="font-extrabold text-[#E84F93]">
                            {item.price !== undefined ? formatVND(item.price) : "-"}
                          </span>
                        </InfoItem>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Section: Assigned Artist, Payment Summary & Check-in QR */}
        <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
          {/* Assigned Artist Card */}
          <Card>
            <SectionTitle subtitle="Staff member assigned to perform service" icon={UserCheck}>
              Assigned Artist
            </SectionTitle>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF5FA] to-[#FFF0F5]/40 border border-[#F3D6E5]/70">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#818CF8] to-[#4F46E5] text-sm font-extrabold text-white shadow-xs">
                {(booking?.artistName && booking.artistName !== "Unassigned" ? booking.artistName : "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-extrabold truncate ${booking?.artistName === "Unassigned" ? "text-[#D97706]" : "text-[#2B182B]"}`}>
                  {booking?.artistName === "Unassigned" ? "Unassigned Artist" : booking?.artistName}
                </p>
                <p className="text-[11px] text-[#9E8497] font-medium">Nail Specialist</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignArtistModalOpen(true)}
                className="rounded-full bg-white border border-[#F3D6E5] px-3 py-1.5 text-[11px] font-bold text-[#4F46E5] hover:bg-[#EEF2FF] hover:border-[#C7D2FE] transition shadow-2xs"
              >
                Change
              </button>
            </div>
          </Card>

          {/* Payment & Confirmation Card */}
          <Card>
            <SectionTitle subtitle="Payment summary and confirmation codes" icon={CreditCard}>
              Payment & Confirmation
            </SectionTitle>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFF9FB] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#9E8497]">Deposit Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${booking?.depositTone}`}>{booking?.deposit}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#9E8497]">Original Total:</span>
                  <span className="font-bold text-[#2B182B]">{formatVND(booking?.totalPrice)}</span>
                </div>

                {booking?.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#9E8497]">Discounts & Offers:</span>
                    <span className="font-bold text-[#059669]">-{formatVND(booking?.discountAmount)}</span>
                  </div>
                )}

                <div className="border-t border-[#F3E2EC] pt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2B182B]">Final Amount:</span>
                  <span className="text-xl font-bold text-[#E84F93]">
                    {formatVND(booking?.discountAmount > 0 ? booking.finalPrice : booking.totalPrice)}
                  </span>
                </div>
              </div>

              {/* QR & QT Confirmation Code */}
              {(booking?.qrCode || booking?.qtCode) && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <ScanQrCode size={16} className="text-[#E84F93]" />
                    <p className="text-xs font-bold text-[#2B182B] uppercase tracking-wider">Verification Codes</p>
                  </div>

                  <div className="space-y-3">
                    {booking.qrCode && (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="rounded-2xl border border-[#E5C687]/60 bg-gradient-to-br from-[#FFF9EE] to-white p-4 text-center cursor-pointer hover:border-[#C99635] transition shadow-xs"
                        onClick={() => setIsQrExpanded(true)}
                      >
                        <div className="flex items-center justify-between mb-2 text-xs font-bold text-[#9E731A]">
                          <span>Check-in QR Code</span>
                          <Maximize2 size={14} />
                        </div>
                        <img
                          src={getQrCodeSrc(booking.qrCode)}
                          alt="QR Code"
                          className="max-w-[130px] mx-auto rounded-xl shadow-xs"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      </motion.div>
                    )}

                    {booking.qtCode && (
                      <div className="rounded-2xl border border-[#F3E2EC] bg-white p-3 flex items-center justify-between shadow-2xs">
                        <div>
                          <p className="text-[10px] font-bold text-[#9E8497] uppercase tracking-wider">QT Check-in Code</p>
                          <p className="font-mono text-sm font-bold text-[#2B182B] tracking-wider mt-0.5">{booking.qtCode}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(booking.qtCode);
                            toast.success("QT Code copied to clipboard!");
                          }}
                          className="rounded-xl border border-[#F3D6E5] bg-[#FFF5FA] px-3 py-1.5 text-xs font-bold text-[#E84F93] hover:bg-[#E84F93] hover:text-white transition shadow-2xs"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Notes Modal */}
      <Modal
        open={isEditNotesModalOpen}
        onCancel={() => setIsEditNotesModalOpen(false)}
        footer={null}
        centered
        width={450}
        styles={{ content: { padding: 0, borderRadius: 24, overflow: "hidden" } }}
      >
        <div className="bg-white p-6 font-sans">
          <div className="flex items-center justify-between mb-4 border-b border-[#F3E2EC] pb-3">
            <h3 className="text-base font-extrabold text-[#2B182B] flex items-center gap-2">
              <Edit3 size={18} className="text-[#E84F93]" /> Edit Booking Notes
            </h3>
            <button type="button" onClick={() => setIsEditNotesModalOpen(false)} className="text-[#9E8497] hover:text-[#E84F93]">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4">
            <p className="text-xs text-[#9E8497]">
              Update internal salon notes or customer preferences for this booking.
            </p>
            <Input.TextArea
              value={bookingNotesText}
              onChange={(e) => setBookingNotesText(e.target.value)}
              rows={4}
              placeholder="Enter special instructions or notes..."
              className="rounded-xl border-[#F3D7E4] focus:border-[#E84F93] text-xs font-medium"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditNotesModalOpen(false)}
                className="rounded-xl border border-[#F3D7E4] px-4 py-2 text-xs font-bold text-[#2B182B] hover:bg-[#FAF0F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="rounded-xl bg-gradient-to-r from-[#E84F93] to-[#F43F5E] px-4 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg flex items-center gap-1.5"
              >
                <Check size={14} /> Save Notes
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Image View Modal */}
      <Modal
        open={!!activeImageModalUrl}
        onCancel={() => setActiveImageModalUrl(null)}
        footer={null}
        closable={false}
        centered
        width={500}
        styles={{ content: { padding: 0, borderRadius: 24, overflow: "hidden" } }}
      >
        <div className="bg-white p-6 text-center">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-bold text-[#2B182B]">Image Preview</p>
            <button type="button" onClick={() => setActiveImageModalUrl(null)} className="text-[#9E8497] hover:text-[#E84F93]">
              <X size={18} />
            </button>
          </div>
          {activeImageModalUrl && (
            <img src={activeImageModalUrl} alt="Preview" className="max-w-full max-h-[420px] mx-auto rounded-xl shadow-md" />
          )}
        </div>
      </Modal>

      {/* QR Code Zoom Modal */}
      <Modal
        open={isQrExpanded}
        onCancel={() => setIsQrExpanded(false)}
        footer={null}
        closable={false}
        centered
        width={380}
        styles={{ content: { padding: 0, borderRadius: 24, overflow: "hidden" } }}
      >
        <div className="bg-white p-6 text-center">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-[#2B182B]">Customer Check-in QR Code</p>
            <button type="button" onClick={() => setIsQrExpanded(false)} className="text-[#9E8497] hover:text-[#E84F93]">
              <X size={18} />
            </button>
          </div>
          {booking?.qrCode && (
            <img
              src={getQrCodeSrc(booking.qrCode)}
              alt="QR Code"
              className="max-w-[260px] mx-auto rounded-xl shadow-md border border-[#F3E2EC]"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
        </div>
      </Modal>

      {/* Action Modals */}
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
      {booking && (
        <AssignArtistModal
          open={isAssignArtistModalOpen}
          onClose={() => setIsAssignArtistModalOpen(false)}
          bookingId={normalizedBookingId}
          salonId={booking.salonId ? String(booking.salonId) : (getSalonId() || "")}
          booking={booking}
          onSuccess={() => loadBooking({ silent: true })}
        />
      )}
      {booking && (
        <ProposeRescheduleModal
          open={isProposeRescheduleModalOpen}
          onClose={() => setIsProposeRescheduleModalOpen(false)}
          bookingId={normalizedBookingId}
          booking={booking}
          onSuccess={() => loadBooking({ silent: true })}
        />
      )}
    </motion.section>
  );
}
