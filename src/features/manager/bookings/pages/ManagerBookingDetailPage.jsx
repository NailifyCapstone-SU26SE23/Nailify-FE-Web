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
  Banknote,
} from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
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
import { fetchTransactionsByBookingId, fetchTransactionById, processRefund, checkPaymentStatus } from "../../transaction-management/services/transactionService";
import { Spin, Alert, Modal, Input, Image, Select, Table } from "antd";
import toast from "react-hot-toast";
import { ConfirmBookingModal } from "../components/ConfirmBookingModal";
import { RejectBookingModal } from "../components/RejectBookingModal";
import { CancelBookingModal } from "../components/CancelBookingModal";
import { AssignArtistModal } from "../components/AssignArtistModal";
import { ProposeRescheduleModal } from "../components/ProposeRescheduleModal";
import { OnsiteAddonModal } from "../components/OnsiteAddonModal";
import { motion, AnimatePresence } from "framer-motion";
import { getSalonId } from "../../staff-artist-management/services/nailArtistsService";


const roleConfig = BOOKING_ROLE_CONFIG[ROLES.manager];
const SCHEDULE_SCROLL_SENSITIVITY = 0.5;

const VIETNAM_BANKS = [
  { code: "VCB", name: "Vietcombank" },
  { code: "TCB", name: "Techcombank" },
  { code: "BIDV", name: "BIDV" },
  { code: "CTG", name: "VietinBank" },
  { code: "MB", name: "MBBank" },
  { code: "VPB", name: "VPBank" },
  { code: "ACB", name: "ACB" },
  { code: "TPB", name: "TPBank" },
  { code: "VIB", name: "VIB" },
  { code: "HDB", name: "HDBank" },
  { code: "STB", name: "Sacombank" },
  { code: "SHB", name: "SHB" },
  { code: "EIB", name: "Eximbank" },
  { code: "MSB", name: "MSB" },
  { code: "OCB", name: "OCB" },
  { code: "LPB", name: "LienVietPostBank" },
  { code: "BAB", name: "Bac A Bank" },
  { code: "ABB", name: "ABBank" },
  { code: "VAB", name: "VietABank" },
  { code: "NAB", name: "Nam A Bank" },
  { code: "KLB", name: "Kienlongbank" },
  { code: "AGRIBANK", name: "Agribank" }
];

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

function formatStatusDisplay(status, language) {
  switch (status) {
    case "Checked In":
    case "CheckedIn":
      return language === "vi" ? "Đã check in" : "Checked In";
    case "In Progress":
    case "InProgress":
      return language === "vi" ? "Đang tiến hành" : "In Progress";
    case "Pending":
      return language === "vi" ? "Đang chờ" : "Pending";
    case "Confirmed":
    case "Approved":
      return language === "vi" ? "Đã xác nhận" : "Confirmed";
    case "Completed":
    case "ServiceCompleted":
      return language === "vi" ? "Đã hoàn thành" : "Completed";
    case "Rejected":
      return language === "vi" ? "Đã từ chối" : "Rejected";
    case "Cancelled":
    case "Canceled":
      return language === "vi" ? "Đã hủy" : "Cancelled";
    case "ReschedulePending":
      return language === "vi" ? "Đang chờ dời lịch" : "Reschedule Pending";
    case "RescheduleSuggested":
      return language === "vi" ? "Đã đề xuất dời lịch" : "Reschedule Proposed";
    case "Repaired":
      return language === "vi" ? "Đã sửa chữa" : "Repaired";
    default:
      return status;
  }
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
  const str = String(dateString).trim();
  if (str.includes("T")) {
    return new Date(str).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  const datePart = str.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return "N/A";
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(startTime, fallbackDateTime) {
  const str = String(startTime || "").trim();
  if (str.includes("T")) {
    return new Date(str).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const rawTime = str
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

// Module-level set to track which booking IDs have already shown the warning.
// Using module-level variable so it survives React StrictMode's double-mount in dev.
const _shownRefundWarningForBookings = new Set();

export function ManagerBookingDetailPage() {
  const { t, language } = useLanguage();
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const backRoute = location.state?.from || (location.pathname.startsWith("/admin/") ? ROUTES.adminBookings : ROUTES.managerBookings);
  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [isRefundWarningOpen, setIsRefundWarningOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);

  // Transaction Details Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState(null);
  const [isFetchingTransaction, setIsFetchingTransaction] = useState(false);

  // Refund Modal State
  const [isRefundBankModalOpen, setIsRefundBankModalOpen] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundForm, setRefundForm] = useState({ bankCode: "", accountNumber: "", accountName: "" });

  const handleRefundSubmit = async () => {
    if (!refundForm.bankCode || !refundForm.accountNumber || !refundForm.accountName) {
      toast.error(language === "vi" ? "Vui lòng nhập đầy đủ thông tin ngân hàng" : "Please fill in all bank details");
      return;
    }

    setIsRefunding(true);
    try {
      const refundPayload = {
        bankCode: refundForm.bankCode,
        accountNumber: refundForm.accountNumber,
        accountName: refundForm.accountName
      };

      await processRefund(normalizedBookingId, refundPayload);

      // Check Status
      const depositTx = transactions && transactions.length > 0 ? transactions[0] : null;
      if (depositTx && depositTx.orderCode) {
        await checkPaymentStatus(depositTx.orderCode);
      }

      toast.success(language === "vi" ? "Đã gửi yêu cầu hoàn tiền thành công!" : "Refund processed successfully!");
      setIsRefundBankModalOpen(false);
      loadBooking({ silent: true });
    } catch (err) {
      toast.error(err.message || (language === "vi" ? "Lỗi khi xử lý hoàn tiền" : "Failed to process refund"));
    } finally {
      setIsRefunding(false);
    }
  };

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
      depositTone: rawBooking.depositAmount ? "text-[#059669] font-bold" : "text-[#D97706] font-bold",
      status: rawBooking.status || "Pending",
      amountPaid: rawBooking.amountPaid ?? rawBooking.depositAmount ?? 0,
      isRefunded: rawBooking.isRefunded || false,
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
      notes: rawBooking.notes || rawBooking.customerNotes,
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

      // Fetch transactions for this booking
      try {
        const txs = await fetchTransactionsByBookingId(bookingId);
        setTransactions(txs);
      } catch (err) {
        console.warn("Failed to load transactions:", err);
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

  useEffect(() => {
    if (booking?.id) {
      const isCancelled = booking.status === "Rejected" || booking.status === "Cancelled" || booking.status === "Canceled";
      if (isCancelled && booking.amountPaid > 0 && !booking.isRefunded) {
        if (!_shownRefundWarningForBookings.has(booking.id)) {
          _shownRefundWarningForBookings.add(booking.id);
          setIsRefundWarningOpen(true);
        }
      }
    }
    return () => {
      // Clean up when leaving the page so warning shows again if user comes back later
      if (booking?.id) {
        _shownRefundWarningForBookings.delete(booking.id);
      }
    };
  }, [booking?.id, booking?.status, booking?.amountPaid, booking?.isRefunded]);

  const handleSaveNotes = () => {
    setBooking((prev) => (prev ? { ...prev, notes: bookingNotesText } : prev));
    toast.success("Booking notes updated successfully!", { icon: "📝" });
    setIsEditNotesModalOpen(false);
  };

  const handleTransactionClick = async (txId) => {
    setIsTransactionModalOpen(true);
    setIsFetchingTransaction(true);
    setSelectedTransactionDetail(null);
    try {
      const details = await fetchTransactionById(txId);
      setSelectedTransactionDetail(details);
    } catch (err) {
      toast.error(language === "vi" ? "Lỗi tải chi tiết giao dịch" : "Failed to load transaction details");
      setIsTransactionModalOpen(false);
    } finally {
      setIsFetchingTransaction(false);
    }
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
        <Link to={backRoute} className="inline-flex items-center gap-2 text-xs font-bold text-[#E84F93]">
          <ArrowLeft size={16} /> {t("manager.common.back")}
        </Link>
        <Alert message={t("manager.common.error")} description={error} type="error" showIcon className="rounded-2xl" />
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="flex min-h-[400px] items-center justify-center font-sans">
        <Spin size="large" tip={t("manager.common.loading")} />
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
      className="flex min-h-[100dvh] flex-col gap-6 font-sans"
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
                onClick={() => navigate(backRoute)}
                className="inline-flex items-center gap-2 rounded-full border border-[#F3D6E5] bg-white px-3.5 py-1.5 text-xs font-bold text-[#E84F93] hover:bg-[#FFF0F5] hover:border-[#E84F93] transition shadow-xs mb-3 group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>{t("manager.common.back")}</span>
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-[#2B182B] tracking-tight ">
                  {t("manager.bookings.bookingDetails")}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E5C687]/80 bg-gradient-to-r from-[#FFF9EE] to-[#FFF3DC] px-3.5 py-1 text-xs font-bold text-[#9E731A] shadow-2xs">
                  #{String(booking?.bookingId || bookingId).slice(0, 8).toUpperCase()}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-extrabold shadow-2xs ${getStatusTone(booking?.status)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {formatStatusDisplay(booking?.status, language)}
                </span>

                {/* Warning for unrefunded cancelled bookings */}
                {(booking?.status === "Rejected" || booking?.status === "Cancelled" || booking?.status === "Canceled") && booking?.amountPaid > 0 && !booking?.isRefunded && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FECDD3] bg-[#FEF2F2] px-3.5 py-1 text-xs font-extrabold text-[#E11D48] shadow-2xs">
                    {language === "vi" ? "CHƯA HOÀN TIỀN" : "NOT REFUNDED"}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-[#9E8497] font-medium max-w-xl">
                {t("manager.bookings.desc")}
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
                <span>{t("manager.common.edit")}</span>
              </motion.button>

              {/* Refund Button */}
              {(booking?.status === "Rejected" || booking?.status === "Cancelled" || booking?.status === "Canceled") && booking?.amountPaid > 0 && !booking?.isRefunded && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setIsRefundBankModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#FECDD3] bg-[#E11D48] px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-[#BE123C] hover:shadow-lg transition-all"
                >
                  <Banknote size={15} />
                  <span>{language === "vi" ? "Nhập TK Hoàn tiền" : "Refund Bank Info"}</span>
                </motion.button>
              )}

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
                  <span>{language === "vi" ? "Đề xuất giờ mới" : "Propose New Time"}</span>
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
                      <span>{t("manager.bookings.confirmBooking")}</span>
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
                    <span>{t("manager.bookings.assignArtistTitle")}</span>
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
                      <span>{t("manager.breaks.reject")}</span>
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
                      <span>{t("manager.bookings.cancelBooking")}</span>
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
                    <Calendar size={14} /> {t("manager.bookings.customerRequestedReschedule") || "Customer Requested Reschedule"}
                  </span>
                  <p className="text-sm font-extrabold text-[#1E1B4B] mt-1">
                    {t("manager.bookings.bookingDate") || "Date"}: <span className="text-[#4F46E5]">{booking.proposedBookingDate || "N/A"}</span> · {t("manager.bookings.time") || "Time"}: <span className="text-[#4F46E5]">{booking.proposedStartTime || "N/A"}</span>
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
                    <CheckCircle2 size={15} /> {t("manager.breaks.approve") || "Accept Request"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectCustomerReschedule}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#FECDD3] bg-white px-4 py-2 text-xs font-bold text-[#E11D48] hover:bg-[#FEF2F2] transition disabled:opacity-50"
                  >
                    <XCircle size={15} /> {t("manager.breaks.reject") || "Decline"}
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
              subtitle={language === "vi" ? "Thông tin khách hàng" : "Customer Profile"}
              icon={UserRound}
              actionButton={
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5C687]/60 bg-gradient-to-r from-[#FFF9EE] to-[#FFF3DC] px-3.5 py-1 text-xs font-extrabold text-[#9E731A] shadow-2xs">
                  <Crown size={14} className="text-[#C99635]" />
                  VIP Member
                </span>
              }
            >
              {language === "vi" ? "Thông tin khách hàng" : "Customer Profile"}
            </SectionTitle>

            <div className="flex items-center gap-4 mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF5FA] to-[#FFF0F5]/40 border border-[#F3D6E5]/60">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7AB8] to-[#E84F93] text-base font-extrabold text-white shadow-md">
                {(customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : booking?.customerName || "C").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold text-[#2B182B] truncate">
                  {customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : booking?.customerName}
                </h3>
                <p className="text-xs text-[#9E8497] font-medium">{language === "vi" ? "Khách hàng đã đăng ký" : "Registered Customer"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(booking?.phone || customer?.phone) && (
                <InfoItem label={language === "vi" ? "Số điện thoại" : "Phone"}>
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
                <InfoItem label={language === "vi" ? "Email" : "Email"}>
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
                  {language === "vi" ? "Ghi chú" : "Notes"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditNotesModalOpen(true)}
                  className="text-xs font-bold text-[#E84F93] hover:underline flex items-center gap-1"
                >
                  <Edit3 size={12} /> {t("manager.common.edit")}
                </button>
              </div>
              <div className="rounded-2xl border-l-4 border-l-[#E84F93] border-y border-r border-[#F3D6E5]/60 bg-gradient-to-r from-[#FFF5FA]/70 to-[#FFF0F5]/30 p-4 text-xs text-[#2B182B] leading-relaxed italic shadow-2xs">
                "{booking?.notes || language === "vi" ? "Không có ghi chú" : "No notes"}"
              </div>
            </div>

            {/* Check-in Photo */}
            {(booking?.checkInImageUrl || booking?.checkOutImagesUrl) && (
              <div className="mt-5 pt-4 border-t border-[#F3E2EC] space-y-3">
                {booking?.checkInImageUrl && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#9E8497] mb-2">{language === "vi" ? "Ảnh check-in" : "Check-in Photo"}</p>
                    <div
                      className="group relative overflow-hidden rounded-2xl border border-[#F3D6E5] bg-white p-1.5 max-w-md cursor-pointer hover:border-[#E84F93] transition shadow-xs"
                      onClick={() => setActiveImageModalUrl(booking.checkInImageUrl)}
                    >
                      <Image src={booking.checkInImageUrl} alt="Check-in" className="w-full h-44 object-cover rounded-xl group-hover:scale-102 transition duration-300" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-1.5">
                        <Maximize2 size={16} /> {language === "vi" ? "Xem ảnh" : "View Photo"}
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
              subtitle={language === "vi" ? "Thông tin dịch vụ" : "Service & Appointment Info"}
              icon={Sparkles}
              actionButton={
                booking?.artistName === "Unassigned" ? (
                  <button
                    type="button"
                    onClick={() => setIsAssignArtistModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] px-3.5 py-1.5 text-xs font-extrabold text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white transition shadow-2xs"
                  >
                    <UserCheck size={13} />
                    {language === "vi" ? "Chỉ định nghệ sĩ" : "Assign Artist"}
                  </button>
                ) : null
              }
            >
              {language === "vi" ? "Thông tin dịch vụ" : "Service & Appointment Info"}
            </SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFFDFE] p-4 shadow-2xs">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E8497] mb-1">{language === "vi" ? "Ngày đặt lịch" : "Booking Date"}</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2B182B]">
                  <Calendar size={15} className="text-[#E84F93] shrink-0" />
                  <span>{booking?.date}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFFDFE] p-4 shadow-2xs">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E8497] mb-1">{language === "vi" ? "Thời gian" : "Time"}</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2B182B]">
                  <Clock3 size={15} className="text-[#E84F93] shrink-0" />
                  <span>{booking?.time}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFFDFE] p-4 shadow-2xs">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9E8497] mb-1">{language === "vi" ? "Thời lượng" : "Duration"}</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2B182B]">
                  <Clock3 size={15} className="text-[#E84F93] shrink-0" />
                  <span>{booking?.totalDuration ? formatDuration(booking.totalDuration) : "60m"}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Service & Design Items List */}
          {booking?.bookingItems && booking.bookingItems.length > 0 && (
            <Card className="overflow-hidden">
              <SectionTitle subtitle={language === "vi" ? "Thông tin dịch vụ" : "Service & Appointment Info"} icon={Tag}>
                {language === "vi" ? "Thông tin dịch vụ" : "Service & Appointment Info"} ({booking.bookingItems.length})
              </SectionTitle>
              <div className="mt-4 rounded-xl border border-[#F3E2EC] overflow-hidden bg-white shadow-2xs">
                <Table
                  columns={[
                    {
                      title: language === "vi" ? "Dịch vụ" : "Service",
                      dataIndex: 'serviceName',
                      key: 'serviceName',
                      render: (text, item) => (
                        <div className="flex items-start gap-4">
                          {(item.nailVariantImageUrl || item.customerNailImageUrl) && (
                            <div
                              className="group relative w-[72px] h-[72px] rounded-xl border border-[#F3D6E5] overflow-hidden cursor-pointer hover:border-[#E84F93] transition-colors shrink-0 shadow-sm"
                              onClick={() => setActiveImageModalUrl((item.nailVariantImageUrl || item.customerNailImageUrl).replace(/`/g, ''))}
                            >
                              <img
                                src={(item.nailVariantImageUrl || item.customerNailImageUrl).replace(/`/g, '')}
                                alt="Design"
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Maximize2 size={16} />
                              </div>
                            </div>
                          )}
                          <div className="py-1">
                            <h4 className="text-[15px] font-extrabold text-[#2B182B] mb-1">{text || "Nail Service"}</h4>
                            {item.nailVariantName && (
                              <p className="text-xs font-bold text-[#E84F93] flex items-center gap-1.5 mb-0.5">
                                <Sparkles size={13} /> {item.nailVariantName}
                              </p>
                            )}
                            {item.customerNailName && (
                              <p className="text-xs font-medium text-[#9E8497] flex items-center gap-1.5">
                                <Edit3 size={12} /> Custom: {item.customerNailName}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: language === "vi" ? "Số lượng" : "QTY",
                      dataIndex: 'quantity',
                      key: 'quantity',
                      align: 'center',
                      width: 100,
                      render: (qty) => <span className="font-bold text-[#4B5563] text-sm">{qty !== undefined ? qty : "1"}</span>,
                    },
                    {
                      title: language === "vi" ? "Thời lượng" : "Duration",
                      dataIndex: 'duration',
                      key: 'duration',
                      align: 'center',
                      width: 120,
                      render: (dur) => <span className="font-bold text-[#4B5563] text-sm">{dur !== undefined ? formatDuration(dur) : "-"}</span>,
                    },
                    {
                      title: language === "vi" ? "Giá tiền" : "Price",
                      dataIndex: 'price',
                      key: 'price',
                      align: 'right',
                      width: 140,
                      render: (price) => <span className="font-extrabold text-[#E84F93] text-[15px]">{price !== undefined ? formatVND(price) : "-"}</span>,
                    },
                  ]}
                  dataSource={booking.bookingItems.map((item, index) => ({ ...item, key: item.id || index }))}
                  pagination={false}
                  rowClassName="hover:bg-[#FFF9FB]/50 transition-colors"
                />
              </div>
            </Card>
          )}
        </div>

        {/* Right Section: Assigned Artist, Payment Summary & Check-in QR */}
        <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
          {/* Assigned Artist Card */}
          <Card>
            <SectionTitle subtitle={language === "vi" ? "Thông tin thợ làm móng" : "Artist"} icon={UserCheck}>
              {language === "vi" ? "Thông tin thợ làm móng" : "Artist"}
            </SectionTitle>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF5FA] to-[#FFF0F5]/40 border border-[#F3D6E5]/70">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#818CF8] to-[#4F46E5] text-sm font-extrabold text-white shadow-xs">
                {(booking?.artistName && booking.artistName !== "Unassigned" ? booking.artistName : "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-extrabold truncate ${booking?.artistName === "Unassigned" ? "text-[#D97706]" : "text-[#2B182B]"}`}>
                  {booking?.artistName === "Unassigned" ? t("manager.bookings.unassigned") : booking?.artistName}
                </p>
                <p className="text-[11px] text-[#9E8497] font-medium">Nail Specialist</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignArtistModalOpen(true)}
                className="rounded-full bg-white border border-[#F3D6E5] px-3 py-1.5 text-[11px] font-bold text-[#4F46E5] hover:bg-[#EEF2FF] hover:border-[#C7D2FE] transition shadow-2xs"
              >
                {t("manager.common.edit")}
              </button>
            </div>
          </Card>

          {/* Payment & Confirmation Card */}
          <Card>
            <SectionTitle subtitle={language === "vi" ? "Thông tin thanh toán" : "Payment & Confirmation"} icon={CreditCard}>
              {language === "vi" ? "Thông tin thanh toán" : "Payment & Confirmation"}
            </SectionTitle>

            <div className="space-y-5">
              {(() => {
                const depositTx = transactions && transactions.length > 0 ? transactions[0] : null;
                const actualDeposit = depositTx?.amount || booking?.depositAmount || 0;
                const isPaid = depositTx?.status === "Paid" || (booking?.amountPaid > 0 && booking?.amountPaid >= actualDeposit);

                let depositText = "Pending";
                let depositTone = "text-[#D97706] font-bold";

                if (actualDeposit > 0) {
                  depositText = formatVND(actualDeposit);
                  depositTone = isPaid ? "text-[#059669] font-bold" : "text-[#D97706] font-bold";
                }

                return (
                  <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFF9FB] p-4 space-y-3">
                    {/* <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#9E8497]">{language === "vi" ? "Tiền cọc" : "Deposit"}:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${depositTone}`}>{depositText}</span>
                    </div> */}

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#9E8497]">{language === "vi" ? "Tổng tiền" : "Subtotal"}:</span>
                      <span className="font-bold text-[#2B182B]">{formatVND(booking?.totalPrice)}</span>
                    </div>

                    {booking?.discountAmount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#9E8497]">{language === "vi" ? "Giảm giá" : "Discount"}:</span>
                        <span className="font-bold text-[#059669]">-{formatVND(booking?.discountAmount)}</span>
                      </div>
                    )}

                    <div className="border-t border-[#F3E2EC] pt-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2B182B]">{language === "vi" ? "Tổng cộng" : "Total Amount"}:</span>
                      <span className="text-xl font-bold text-[#E84F93]">
                        {formatVND(booking?.discountAmount > 0 ? booking.finalPrice : booking.totalPrice)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Transactions List */}
              {transactions && transactions.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9E8497] mb-3">
                    {language === "vi" ? "Lịch sử giao dịch" : "Transaction History"}
                  </h4>
                  <div className="space-y-3">
                    {[...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((tx, idx) => {
                      const isDeposit = idx === 0 || tx.amount === booking?.depositAmount;
                      const txLabel = isDeposit ? (language === "vi" ? "Tiền cọc" : "Deposit") : (language === "vi" ? "Tiền trả còn lại" : "Remaining Balance");

                      const actualTotal = booking?.discountAmount > 0 ? booking.finalPrice : booking.totalPrice;
                      const percentage = actualTotal > 0 ? Math.round((tx.amount / actualTotal) * 100) : 0;

                      return (
                        <div
                          key={tx.transactionId}
                          onClick={() => handleTransactionClick(tx.transactionId)}
                          className="rounded-xl border border-[#F3E2EC] bg-white p-3 shadow-2xs hover:border-[#E84F93] transition-colors cursor-pointer group flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-[11px] font-bold text-[#2B182B]">{txLabel}</p>
                                {percentage > 0 && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-[#FFF0F5] text-[#E84F93] text-[9px] font-extrabold tracking-wider border border-[#F3D6E5]/60">
                                    {percentage}%
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#9E8497] mt-0.5 font-mono">#{tx.orderCode}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[13px] font-extrabold text-[#E84F93]">{formatVND(tx.amount)}</p>
                              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${String(tx.status).toLowerCase() === 'paid' ? 'bg-[#ECFDF5] text-[#059669]' :
                                String(tx.status).toLowerCase() === 'pending' ? 'bg-[#FFFBEB] text-[#D97706]' :
                                  'bg-[#F3F4F6] text-[#6B7280]'
                                }`}>
                                {tx.status}
                              </span>
                            </div>
                          </div>

                          <div className="mt-1 pt-2 border-t border-[#F3E2EC] border-dashed space-y-1">
                            {tx.createdAt && (
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-[#9E8497] font-medium">{language === "vi" ? "Tạo lúc" : "Created At"}</span>
                                <span className="font-medium text-[#2B182B]">{formatDate(tx.createdAt)} {formatTime(tx.createdAt)}</span>
                              </div>
                            )}
                            {tx.paidAt && (
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-[#9E8497] font-medium">{language === "vi" ? "Thanh toán lúc" : "Paid At"}</span>
                                <span className="font-medium text-[#059669]">{formatDate(tx.paidAt)} {formatTime(tx.paidAt)}</span>
                              </div>
                            )}
                            {!tx.paidAt && tx.expiresAt && (
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-[#9E8497] font-medium">{language === "vi" ? "Hết hạn lúc" : "Expires At"}</span>
                                <span className="font-medium text-[#E11D48]">{formatDate(tx.expiresAt)} {formatTime(tx.expiresAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* QR & QT Confirmation Code */}
              {(booking?.qrCode || booking?.qtCode) && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <ScanQrCode size={16} className="text-[#E84F93]" />
                    <p className="text-xs font-bold text-[#2B182B] uppercase tracking-wider">{language === "vi" ? "Mã xác thực" : "Verification Codes"}</p>
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
                          crossOrigin="anonymous"
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
              <Edit3 size={18} className="text-[#E84F93]" /> {language === "vi" ? "Ghi chú đặt lịch" : "Edit Booking Notes"}
            </h3>
            <button type="button" onClick={() => setIsEditNotesModalOpen(false)} className="text-[#9E8497] hover:text-[#E84F93]">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4">
            <p className="text-xs text-[#9E8497]">
              {language === "vi" ? "Cập nhật ghi chú nội bộ của salon hoặc sở thích của khách hàng cho lần đặt lịch này." : "Update internal salon notes or customer preferences for this booking."}
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
                {language === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="rounded-xl bg-gradient-to-r from-[#E84F93] to-[#F43F5E] px-4 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg flex items-center gap-1.5"
              >
                <Check size={14} /> {language === "vi" ? "Lưu ghi chú" : "Save Notes"}
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
            <p className="text-sm font-bold text-[#2B182B]">{language === "vi" ? "Ảnh xem trước" : "Image Preview"}</p>
            <button type="button" onClick={() => setActiveImageModalUrl(null)} className="text-[#9E8497] hover:text-[#E84F93]">
              <X size={18} />
            </button>
          </div>
          {activeImageModalUrl && (
            <img src={activeImageModalUrl} alt="Preview" className="max-w-full h-auto mx-auto rounded-xl shadow-md" />
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

      {/* Refund Warning Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-[#E11D48]">
            <AlertTriangle size={20} />
            <span>{language === "vi" ? "Cần hoàn tiền" : "Refund Required"}</span>
          </div>
        }
        open={isRefundWarningOpen}
        onCancel={() => setIsRefundWarningOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => setIsRefundWarningOpen(false)}
            className="px-4 py-2 bg-[#E84F93] hover:bg-[#D43F7D] text-white rounded-xl font-bold transition-colors"
          >
            {language === "vi" ? "Đã hiểu" : "Got it"}
          </button>
        }
        centered
      >
        <p className="text-[#4B5563]">
          {language === "vi"
            ? "Đơn đặt lịch này đã bị hủy nhưng chưa hoàn tiền cho khách. Vui lòng tiến hành hoàn tiền!"
            : "This booking was cancelled but the customer hasn't been refunded yet. Please process the refund!"}
        </p>
      </Modal>

      {/* Transaction Details Modal */}
      <Modal
        open={isTransactionModalOpen}
        onCancel={() => setIsTransactionModalOpen(false)}
        footer={null}
        closable={false}
        centered
        width={400}
        styles={{ content: { padding: 0, borderRadius: 24, overflow: "hidden" } }}
      >
        <div className="bg-[#FAF6F8] font-sans max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-[#F3E2EC] bg-white sticky top-0 z-10">
            <h3 className="text-base font-extrabold text-[#2B182B] flex items-center gap-2">
              <CreditCard size={18} className="text-[#E84F93]" /> {language === "vi" ? "Chi tiết giao dịch" : "Transaction Details"}
            </h3>
            <button type="button" onClick={() => setIsTransactionModalOpen(false)} className="text-[#9E8497] hover:text-[#E84F93]">
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            {isFetchingTransaction ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#9E8497]">
                <Spin size="large" />
                <p className="mt-3 text-xs font-medium">{language === "vi" ? "Đang tải..." : "Loading..."}</p>
              </div>
            ) : selectedTransactionDetail ? (
              <div className="space-y-4">
                <div className="text-center pb-4 border-b border-[#F3E2EC]">
                  <p className="text-[10px] uppercase font-bold text-[#9E8497] mb-1">{language === "vi" ? "Số tiền" : "Amount"}</p>
                  <p className="text-3xl font-extrabold text-[#E84F93] mb-2">{formatVND(selectedTransactionDetail.amount)}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${String(selectedTransactionDetail.status).toLowerCase() === 'paid' ? 'bg-[#ECFDF5] text-[#059669]' :
                    String(selectedTransactionDetail.status).toLowerCase() === 'pending' ? 'bg-[#FFFBEB] text-[#D97706]' :
                      'bg-[#F3F4F6] text-[#6B7280]'
                    }`}>
                    {selectedTransactionDetail.status}
                  </span>
                </div>

                <div className="space-y-3 bg-white p-4 rounded-xl border border-[#F3E2EC] shadow-2xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9E8497] font-medium">{language === "vi" ? "Mã đơn hàng" : "Order Code"}</span>
                    <span className="font-mono font-bold text-[#2B182B]">#{selectedTransactionDetail.orderCode}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#9E8497] font-medium">{language === "vi" ? "Thời gian tạo" : "Created At"}</span>
                    <span className="font-medium text-[#2B182B]">{formatDate(selectedTransactionDetail.createdAt)} {formatTime(selectedTransactionDetail.createdAt)}</span>
                  </div>

                  {selectedTransactionDetail.paidAt && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#9E8497] font-medium">{language === "vi" ? "Thời gian trả" : "Paid At"}</span>
                      <span className="font-medium text-[#059669]">{formatDate(selectedTransactionDetail.paidAt)} {formatTime(selectedTransactionDetail.paidAt)}</span>
                    </div>
                  )}

                  {!selectedTransactionDetail.paidAt && selectedTransactionDetail.expiresAt && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#9E8497] font-medium">{language === "vi" ? "Thời gian hết hạn" : "Expires At"}</span>
                      <span className="font-medium text-[#E11D48]">{formatDate(selectedTransactionDetail.expiresAt)} {formatTime(selectedTransactionDetail.expiresAt)}</span>
                    </div>
                  )}

                  {selectedTransactionDetail.customerName && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#9E8497] font-medium">{language === "vi" ? "Khách hàng" : "Customer"}</span>
                      <span className="font-bold text-[#2B182B]">{selectedTransactionDetail.customerName}</span>
                    </div>
                  )}

                  {selectedTransactionDetail.salonName && (
                    <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-[#F3E2EC] border-dashed">
                      <span className="text-[#9E8497] font-medium">Salon</span>
                      <span className="font-medium text-[#E84F93]">{selectedTransactionDetail.salonName}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#9E8497] text-xs">
                {language === "vi" ? "Không tìm thấy dữ liệu" : "No data found"}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Refund Bank Info Modal */}
      <Modal
        open={isRefundBankModalOpen}
        onCancel={() => setIsRefundBankModalOpen(false)}
        footer={null}
        closable={false}
        centered
        width={400}
        styles={{ content: { padding: 0, borderRadius: 24, overflow: "hidden" } }}
      >
        <div className="bg-white p-6 font-sans">
          <div className="flex items-center justify-between mb-4 border-b border-[#F3E2EC] pb-3">
            <h3 className="text-base font-extrabold text-[#E11D48] flex items-center gap-2">
              <Banknote size={18} /> {language === "vi" ? "Thông tin TK Hoàn tiền" : "Refund Bank Details"}
            </h3>
            <button type="button" onClick={() => setIsRefundBankModalOpen(false)} className="text-[#9E8497] hover:text-[#E84F93]">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4">
            <p className="text-xs text-[#9E8497] leading-relaxed">
              {language === "vi" ? "Khách hàng đã thanh toán cọc nhưng lịch hẹn đã bị hủy. Vui lòng nhập tài khoản ngân hàng của khách để tiến hành hoàn tiền." : "Customer has paid a deposit but the booking was cancelled. Please enter their bank account details to process the refund."}
            </p>

            <div>
              <label className="block text-xs font-bold text-[#2B182B] mb-1.5">{language === "vi" ? "Ngân hàng" : "Bank"}</label>
              <Select
                showSearch
                value={refundForm.bankCode || undefined}
                placeholder={language === "vi" ? "Chọn ngân hàng..." : "Select bank..."}
                optionFilterProp="children"
                onChange={(value) => setRefundForm({ ...refundForm, bankCode: value })}
                options={VIETNAM_BANKS.map(bank => ({
                  value: bank.code,
                  label: (
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-6 flex items-center justify-center bg-white rounded border border-[#F3E2EC] p-0.5 overflow-hidden">
                        <img
                          src={`https://api.vietqr.io/img/${bank.code}.png`}
                          alt={bank.code}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#2B182B]">{bank.code} - {bank.name}</span>
                    </div>
                  ),
                  searchtext: `${bank.code} ${bank.name}`.toLowerCase()
                }))}
                filterOption={(input, option) => option?.searchtext?.includes(input.toLowerCase())}
                className="w-full h-10"
                style={{ borderRadius: 12 }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2B182B] mb-1.5">{language === "vi" ? "Số tài khoản" : "Account Number"}</label>
              <Input
                value={refundForm.accountNumber}
                onChange={(e) => setRefundForm({ ...refundForm, accountNumber: e.target.value })}
                placeholder="Nhập số tài khoản..."
                className="rounded-xl border-[#F3D7E4] focus:border-[#E84F93]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2B182B] mb-1.5">{language === "vi" ? "Tên chủ tài khoản" : "Account Holder Name"}</label>
              <Input
                value={refundForm.accountName}
                onChange={(e) => setRefundForm({ ...refundForm, accountName: e.target.value.toUpperCase() })}
                placeholder="VD: NGUYEN VAN A"
                className="rounded-xl border-[#F3D7E4] focus:border-[#E84F93]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRefundBankModalOpen(false)}
                className="rounded-xl border border-[#F3D7E4] px-4 py-2 text-xs font-bold text-[#2B182B] hover:bg-[#FAF0F5]"
              >
                {language === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleRefundSubmit}
                disabled={isRefunding}
                className="rounded-xl bg-gradient-to-r from-[#E11D48] to-[#BE123C] px-4 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRefunding ? <Spin size="small" className="text-white" /> : <Check size={14} />}
                {language === "vi" ? "Xác nhận & Hoàn tiền" : "Submit Refund"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </motion.section>
  );
}

