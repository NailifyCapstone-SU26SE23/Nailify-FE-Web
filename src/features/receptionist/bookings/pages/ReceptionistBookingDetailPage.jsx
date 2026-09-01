import { Button, Modal, Table, Descriptions, Image, Divider, Timeline, Card, Tag, Badge, List, Avatar, Popover, Spin } from "antd";
import {
  AlarmClock,
  Armchair,
  Bell,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Clock3,
  CreditCard,
  Eye,
  ImageIcon,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  MessageCircleMore,
  Phone,
  Printer,
  QrCode,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  SquareCheckBig,
  Star,
  UserCheck,
  UserPlus,
  UserRound,
  X,
  XCircle,
  Zap, Hourglass
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../../../shared/hooks/useLanguage";
import { ROUTES, getReceptionistBookingCheckoutRoute } from "../../../../shared/constants/routes";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";
import { AssignReceptionistArtistModal } from "../components/AssignReceptionistArtistModal";
import { OnsiteAddonModal } from "../../../manager/bookings/components/OnsiteAddonModal";
import { ProposeRescheduleModal } from "../../../manager/bookings/components/ProposeRescheduleModal";
import { AssignChairModal } from "../components/AssignChairModal";
import {

  checkoutReceptionistBooking,
  fetchReceptionistBookingDetail,
  fetchReceptionistBookingProcedures,
  fetchReceptionistProcedureAvailableArtists,
  manualCheckInReceptionistBooking,
  updateReceptionistProcedureArtist,
  getBookingHistories,
  getUserById,
} from "../services/receptionistBookingService";
import { fetchReceptionistCustomerDetail, fetchLoyaltyTiers } from "../../customers/services/receptionistCustomerService";
import { createPayment } from "../../payments/services/receptionistPaymentService";
import { fetchTransactionsByBookingId, fetchTransactionById } from "../../../manager/transaction-management/services/transactionService";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return '!border-slate-200 !bg-slate-50 !text-slate-600';
    case 'Approved':
      return '!border-emerald-200 !bg-emerald-50 !text-emerald-600';
    case 'Rejected':
    case 'Cancelled':
      return '!border-red-200 !bg-red-50 !text-red-600';
    case 'CheckedIn':
      return '!border-purple-200 !bg-purple-50 !text-purple-600';
    case 'InProgress':
      return '!border-blue-200 !bg-blue-50 !text-blue-600';
    case 'ServiceCompleted':
      return '!border-yellow-200 !bg-yellow-50 !text-yellow-700';
    case 'Completed':
      return '!border-green-200 !bg-green-50 !text-green-700';
    case 'Repaired':
      return '!border-orange-200 !bg-orange-50 !text-orange-600';
    case 'ReschedulePending':
    case 'RescheduleSuggested':
      return '!border-indigo-200 !bg-indigo-50 !text-indigo-600';
    default:
      return '!border-[#f3ddab] !bg-[#fff8df] !text-[#d39a1d]';
  }
};

function formatCurrency(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "--";
  }

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(amount)} VND`;
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
  return fullName || booking?.customerName || "";
}

function getCustomerInitials(customerProfile, booking) {
  const displayName = getCustomerDisplayName(customerProfile, booking);
  if (!displayName) return "NA";
  return displayName
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

function getProcedureStatusTone(status) {
  switch (String(status || "").trim().toLowerCase()) {
    case "completed":
      return "bg-[#e7f8ee] text-[#309e63]";
    case "inprogress":
    case "in progress":
      return "bg-[#efeafd] text-[#7c63d8]";
    case "pending":
      return "bg-[#fff4e3] text-[#e09a27]";
    case "cancelled":
      return "bg-[#ffe7ef] text-[#e04d86]";
    default:
      return "bg-[#fff1f6] text-[#eb5b92]";
  }
}

function getProcedureArtistTone(isFree, isQualified) {
  if (isFree && isQualified) {
    return "border-[#cfead9] bg-[#f3fcf6] text-[#249a5c]";
  }

  if (isQualified) {
    return "border-[#e3dbff] bg-[#f7f4ff] text-[#7c63d8]";
  }

  if (isFree) {
    return "border-[#ffe2b5] bg-[#fff8ea] text-[#d59218]";
  }

  return "border-[#f3d7e2] bg-[#fff7fb] text-[#8f7b88]";
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

  return "Pending";
}

function CircularProgressRing({ percent = 65, remainingTime = "45 min" }) {
  const radius = 42;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const { language } = useLanguage();
  const isVi = language === "vi";

  return (
    <div className="relative flex items-center justify-center my-2">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <defs>
          <linearGradient id="gradientRingSaaS" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E84F93" />
            <stop offset="50%" stopColor="#D93B7D" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle
          stroke="#F3D6E5"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="url(#gradientRingSaaS)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
        <span className="text-sm font-bold text-[#2B182B] leading-none">{remainingTime}</span>
        <span className="text-[9px] font-bold text-[#E84F93] mt-1">{percent}% {isVi ? "Hoàn thành" : "Done"}</span>
      </div>
    </div>
  );
}

function getServiceAction(status, isVi) {
  if (status === "In Progress") {
    return isVi ? "Quản lý" : "Manage";
  }

  if (status === "Completed") {
    return isVi ? "Chỉnh sửa" : "Edit";
  }

  return isVi ? "Xem" : "View";
}

function getServiceActionItems(row, handleViewService, handleViewProcedures, isVi) {
  return [
    {
      key: `view-${row.id}`,
      label: isVi ? "Xem" : "View",
      icon: Eye,
      onSelect: () => handleViewService(row),
    },
    {
      key: `view-procedures-${row.id}`,
      label: isVi ? "Xem quy trình" : "View Procedures",
      icon: ClipboardList,
      className: "text-[#7c63d8]",
      onSelect: () => handleViewProcedures(row),
    },
  ];
}

function getProgressPercent(booking) {
  if (!booking) return 0;

  const status = String(booking.status || "").trim();

  if (status === "Completed") {
    return 100;
  }

  if (["Pending", "Confirmed", "CheckedIn", "Cancelled"].includes(status)) {
    return 0;
  }

  const startTimeStr = booking.startTime;
  const totalDuration = Number(booking.totalDuration) || 45;

  if (!startTimeStr) {
    return 20;
  }

  try {
    const [hours, minutes] = startTimeStr.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const diffMs = now - startDate;
    const diffMins = Math.floor(diffMs / 1000 / 60);

    if (diffMins < 0) {
      return 0;
    }

    const percent = Math.round((diffMins / totalDuration) * 100);
    return Math.min(95, Math.max(10, percent));
  } catch (e) {
    return 50;
  }
}

function getRemainingTime(booking, language) {
  if (!booking) return "0 min";

  const status = String(booking.status || "").trim();
  const totalDuration = Number(booking.totalDuration) || 0;
  const isVi = language === "vi";

  const formatMinutes = (mins) => {
    if (mins < 60) {
      return `${mins} ${isVi ? "phút" : "min"}`;
    }
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) {
      return `${h}h`;
    }
    return `${h}h ${m}m`;
  };

  if (status === "Completed") {
    return isVi ? "Đã xong" : "Completed";
  }

  if (["Pending", "Confirmed", "CheckedIn", "Cancelled"].includes(status)) {
    return totalDuration ? formatMinutes(totalDuration) : (isVi ? "Chưa rõ" : "Unknown");
  }

  const startTimeStr = booking.startTime;
  if (!startTimeStr) {
    return totalDuration ? formatMinutes(totalDuration) : (isVi ? "Chưa rõ" : "Unknown");
  }

  try {
    const [hours, minutes] = startTimeStr.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const diffMs = now - startDate;
    const diffMins = Math.floor(diffMs / 1000 / 60);

    if (diffMins < 0) {
      return totalDuration ? formatMinutes(totalDuration) : (isVi ? "Chưa rõ" : "Unknown");
    }

    const remaining = Math.max(1, totalDuration - diffMins);
    return formatMinutes(remaining);
  } catch (e) {
    return totalDuration ? formatMinutes(totalDuration) : (isVi ? "Chưa rõ" : "Unknown");
  }
}

function sanitizeImageUrl(value) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue.replace(/`/g, "");
}

function isNailBookingItem(item) {
  return Boolean(
    item?.nailVariantId ||
    item?.customerNailId ||
    String(item?.nailVariantName || "").trim() ||
    String(item?.customerNailName || "").trim() ||
    sanitizeImageUrl(item?.nailVariantImageUrl) ||
    sanitizeImageUrl(item?.customerNailImageUrl),
  );
}

function canManualCheckIn(status) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  return normalizedStatus === "approved";
}

function normalizeBookingStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function getReceptionistActionAvailability(status) {
  const normalizedStatus = normalizeBookingStatus(status);

  return {
    canCheckIn: normalizedStatus === "approved",
    canStartService: normalizedStatus === "checkedin",
    canReassignArtist: ["pending", "confirmed", "approved", "checkedin"].includes(normalizedStatus),
    canMoveSchedule: ["pending", "confirmed", "approved"].includes(normalizedStatus),
    canAddService: ["checkedin", "in progress", "inprogress"].includes(normalizedStatus),
    canCompleteBooking: ["in progress", "inprogress"].includes(normalizedStatus),
    canCancelBooking: ["pending", "confirmed", "approved"].includes(normalizedStatus),
    canSendInvoice: ["servicecompleted", "completed"].includes(normalizedStatus),
    canCheckout: normalizedStatus === "servicecompleted",
    canAddPayment: normalizedStatus === "servicecompleted",
    canPrintReceipt: ["servicecompleted", "completed"].includes(normalizedStatus),
  };
}

function DetailCard({ title, subtitle, badge, children, className = "" }) {
  return (
    <section
      className={`rounded-[26px] border border-[#F3E2EC] bg-white/95 backdrop-blur-md p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-md font-bold text-pink-600 tracking-tight">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-[#9E8497] font-medium">{subtitle}</p> : null}
        </div>
        {badge ? (
          <div className="flex items-center gap-2">
            <Tag className={`m-0 ${getStatusColor(badge)}`} style={{ padding: "4px 12px", borderRadius: "20px", fontWeight: "700", fontSize: "11px" }}>
              <Clock size={11} className="mr-1 inline-block" />
              {badge}
            </Tag>
          </div>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ReceptionistBookingDetailPage() {
  const { t, language } = useLanguage();
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isAssignArtistOpen, setIsAssignArtistOpen] = useState(false);
  const [isMoveScheduleOpen, setIsMoveScheduleOpen] = useState(false);
  const [isAssignChairModalOpen, setIsAssignChairModalOpen] = useState(false);
  const [isOnsiteAddonModalOpen, setIsOnsiteAddonModalOpen] = useState(false);
  const [selectedServiceRow, setSelectedServiceRow] = useState(null);
  const [selectedProcedureRow, setSelectedProcedureRow] = useState(null);
  const [bookingProcedures, setBookingProcedures] = useState([]);
  const [isProceduresLoading, setIsProceduresLoading] = useState(false);
  const [proceduresError, setProceduresError] = useState("");
  const [artistPickerProcedure, setArtistPickerProcedure] = useState(null);
  const [procedureArtists, setProcedureArtists] = useState([]);
  const [isProcedureArtistsLoading, setIsProcedureArtistsLoading] = useState(false);
  const [procedureArtistsError, setProcedureArtistsError] = useState("");
  const [assigningProcedureArtistId, setAssigningProcedureArtistId] = useState("");
  const [isManualCheckInSubmitting, setIsManualCheckInSubmitting] = useState(false);
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false);
  const [notes, setNotes] = useState(
    "Customer notes not available from API yet. Use this area for receptionist-only reminders.",
  );
  const [bookingHistories, setBookingHistories] = useState([]);
  const [isBookingHistoriesLoading, setIsBookingHistoriesLoading] = useState(true);
  
  const [transactions, setTransactions] = useState([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState(null);
  const [isFetchingTransaction, setIsFetchingTransaction] = useState(false);

  const isVi = language === "vi";

  const loadBookingHistories = useCallback(async () => {
    if (!bookingId) return;
    try {
      setIsBookingHistoriesLoading(true);
      const historyData = await getBookingHistories(bookingId);
      const histories = historyData?.items || [];
      const actorIds = [...new Set(histories.map(h => h.actorId).filter(Boolean))];
      const userInfos = await Promise.all(
        actorIds.map(async (id) => {
          try { return await getUserById(id); } catch (e) { return null; }
        })
      );
      const roleMap = {};
      actorIds.forEach((id, index) => {
        if (userInfos[index]) roleMap[id] = userInfos[index].role;
      });
      const enrichedHistories = histories.map(h => ({
        ...h,
        actorRole: roleMap[h.actorId] || (h.actorName?.includes("Khách") ? "Customer" : (h.actorId ? "Unknown" : "System"))
      }));
      setBookingHistories(enrichedHistories);
    } catch (error) {
      console.error("Failed to fetch booking histories", error);
      setBookingHistories([]);
    } finally {
      setIsBookingHistoriesLoading(false);
    }
  }, [bookingId]);

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

          console.log("Booking Detail Fetched:", data);

          const custId = data?.customerId || data?.customer?.id || data?.customer?.userId || data?.customerUserId;
          console.log("Extracted Customer ID:", custId);

          if (custId) {
            try {
              const customerData = await fetchReceptionistCustomerDetail(custId);
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
          
          // Fetch transactions
          try {
            const txs = await fetchTransactionsByBookingId(bookingId);
            setTransactions(txs);
          } catch (err) {
            console.warn("Failed to load transactions:", err);
          }
        } catch (loadError) {
          const message = loadError instanceof Error ? loadError.message : "Failed to load booking detail.";
          setError(message);
          toast.error(message);
        } finally {
          setIsLoading(false);
        }

        await loadBookingHistories();
      })();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [bookingId]);

  function addMinutes(time, minutes) {
    if (!time) return "--:--";
    const [h, m, s] = String(time).split(":").map(Number);

    const date = new Date();
    date.setHours(h, m, s || 0, 0);

    date.setMinutes(date.getMinutes() + minutes);

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const qrImageSrc = useMemo(() => (
    booking?.qrCode ? `data:image/png;base64,${booking.qrCode}` : ""
  ), [booking]);
  const customerDisplayName = getCustomerDisplayName(customerProfile, booking);

  const { data: loyaltyTiers } = useQuery({
    queryKey: ['loyaltyTiers'],
    queryFn: async () => {
      return await fetchLoyaltyTiers();
    }
  });

  const { customerTier, customerPoints } = useMemo(() => {
    if (!customerProfile) return { customerTier: null, customerPoints: 0 };
    const points = customerProfile.loyaltyPoint || 0;
    if (!loyaltyTiers?.length) return { customerTier: null, customerPoints: points };

    const tier = loyaltyTiers.find(t =>
      points >= t.minLifetimePoints &&
      (t.maxLifetimePoints === null || points <= t.maxLifetimePoints)
    );
    return { customerTier: tier, customerPoints: points };
  }, [customerProfile, loyaltyTiers]);

  console.log("customer", customerTier);
  console.log("point", customerPoints);

  const customerInitials = getCustomerInitials(customerProfile, booking);
  const isSelectedRowNail = isNailBookingItem(selectedServiceRow?.sourceItem);

  const serviceRows = useMemo(() => {
    const rawItems = booking?.bookingItems ?? [];
    if (rawItems.length === 0) return [];

    const grouped = [];
    const itemMap = new Map();

    rawItems.forEach((item, index) => {
      const sName = item.serviceName || (item.nailVariantName ? (language === "vi" ? "Dịch vụ làm móng: " : "Nail service: ") + item.nailVariantName : language === "vi" ? "Dịch vụ làm móng" : "Nail Service");
      const vName = item.nailVariantName || item.customerNailName || "";
      const uPrice = Number(item.price) || 0;
      const uDur = Number(item.duration) || 0;
      const key = `${sName}_${vName}_${uPrice}_${uDur}`;

      if (!itemMap.has(key)) {
        const groupObj = {
          id: item.bookingItemId || `${item.serviceId || "service"}-${index}`,
          key,
          serviceName: sName,
          nailVariantName: vName,
          count: 1,
          unitDuration: uDur,
          totalDuration: uDur,
          unitPrice: uPrice,
          totalPrice: uPrice,
          artist: booking?.artistName,
          sourceItem: item,
        };
        itemMap.set(key, groupObj);
        grouped.push(groupObj);
      } else {
        const existing = itemMap.get(key);
        existing.count += 1;
        existing.totalDuration += uDur;
        existing.totalPrice += uPrice;
      }
    });

    let cursor = booking?.startTime || "00:00:00";
    return grouped.map((group, index) => {
      const status = getServiceStatus(index, booking?.status);
      const displayName = group.count > 1 ? `x${group.count} ${group.serviceName}` : group.serviceName;
      const slotStart = cursor;
      const slotEnd = addMinutes(cursor, group.totalDuration);
      cursor = slotEnd; // advance cursor for next row

      return {
        id: group.id,
        time: `${formatTime(slotStart)} - ${slotEnd}`,
        service: displayName,
        serviceType: group.nailVariantName,
        artist: group.artist,
        duration: group.totalDuration ? formatDurationMinutes(group.totalDuration) : "--",
        price: group.totalPrice ? formatCurrency(group.totalPrice) : "--",
        status,
        actionLabel: getServiceAction(status, language === "vi"),
        sourceItem: group.sourceItem,
        count: group.count,
      };
    });

  }, [language, booking]);

  const totalAmount = formatCurrency(booking?.totalPrice);
  const price = formatCurrency(booking?.price);
  const discount = formatCurrency(booking?.discount);
  const depositPaid = formatCurrency(booking?.amountPaid);
  const remainingBalance = formatCurrency(booking?.amountDue);
  // const depositPaid = formatCurrency(booking?.amountDue);
  // const remainingBalance = formatCurrency(booking?.amountPaid);
  const progressPercent = getProgressPercent(booking);
  const isManualCheckInAllowed = canManualCheckIn(booking?.status);
  const actionAvailability = useMemo(
    () => getReceptionistActionAvailability(booking?.status),
    [booking?.status],
  );
  const primaryHeaderAction = actionAvailability.canCheckout ? (t("receptionist.dashboard.checkoutBtn") || "Checkout") : (t("receptionist.dashboard.checkinBtn") || "Check In");
  const isPrimaryHeaderActionDisabled =
    actionAvailability.canCheckout
      ? isCheckoutSubmitting
      : !isManualCheckInAllowed || isManualCheckInSubmitting;

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
      
      // Fetch transactions
      try {
        const txs = await fetchTransactionsByBookingId(bookingId);
        setTransactions(txs);
      } catch (err) {
        console.warn("Failed to load transactions:", err);
      }
      
      toast.success(isVi ? "Làm mới chi tiết đơn hàng thành công" : "Booking detail refreshed.");
      await loadBookingHistories();
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to refresh booking detail.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockAction = useCallback((label) => {
    toast.success(`${label} ${isVi ? `đã sẵn sàng cho quy trình tiếp nhận.` : `is ready for receptionist flow.`}`);
  }, []);

  const handleViewService = useCallback((row) => {
    setSelectedServiceRow(row);
  }, []);

  const handleViewProcedures = useCallback(async (row) => {
    const bookingItemId = String(row?.sourceItem?.bookingItemId || "").trim();

    if (!bookingItemId) {
      toast.error(isVi ? "Không tìm thấy ID đơn hàng" : "Booking item ID is not available for this service.");
      return;
    }

    setSelectedProcedureRow(row);
    setBookingProcedures([]);
    setProceduresError("");
    setIsProceduresLoading(true);

    try {
      const procedures = await fetchReceptionistBookingProcedures(bookingItemId);
      setBookingProcedures(Array.isArray(procedures) ? procedures : []);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load booking procedures.";
      setProceduresError(message);
      toast.error(message);
    } finally {
      setIsProceduresLoading(false);
    }
  }, []);

  const handleOpenProcedureArtistPicker = useCallback(async (procedure) => {
    const bookingProcedureId = String(procedure?.bookingProcedureId || "").trim();

    if (!bookingProcedureId) {
      toast.error(isVi ? "Không tìm thấy ID đơn hàng" : "Booking procedure ID is not available.");
      return;
    }

    setArtistPickerProcedure(procedure);
    setProcedureArtists([]);
    setProcedureArtistsError("");
    setIsProcedureArtistsLoading(true);

    try {
      const artists = await fetchReceptionistProcedureAvailableArtists(bookingProcedureId);
      setProcedureArtists(Array.isArray(artists) ? artists : []);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load available artists.";
      setProcedureArtistsError(message);
      toast.error(message);
    } finally {
      setIsProcedureArtistsLoading(false);
    }
  }, []);

  const handleAssignProcedureArtist = useCallback(async (procedure, artist) => {
    const bookingProcedureId = String(procedure?.bookingProcedureId || "").trim();
    const artistId = String(artist?.nailArtistId || "").trim();

    if (!bookingProcedureId || !artistId) {
      toast.error(isVi ? "Không tìm thấy ID đơn hàng" : "Artist assignment data is incomplete.");
      return;
    }

    setAssigningProcedureArtistId(artistId);

    try {
      const updatedProcedure = await updateReceptionistProcedureArtist(bookingProcedureId, artistId);

      setBookingProcedures((currentProcedures) => currentProcedures.map((item) => (
        item?.bookingProcedureId === updatedProcedure?.bookingProcedureId ? updatedProcedure : item
      )));

      setArtistPickerProcedure(null);
      setProcedureArtists([]);
      setProcedureArtistsError("");
      toast.success(
        procedure?.assignedArtistName
          ? isVi ? "Thợ làm móng đã được gán lại thành công." : "Procedure artist reassigned successfully."
          : isVi ? "Thợ làm móng đã được gán thành công." : "Procedure artist assigned successfully.",
      );
      await loadBookingHistories();
    } catch (assignError) {
      const message =
        assignError instanceof Error ? assignError.message : "Failed to assign artist to procedure.";
      toast.error(message);
    } finally {
      setAssigningProcedureArtistId("");
    }
  }, [loadBookingHistories]);

  const serviceColumns = useMemo(() => ([
    {
      title: isVi ? "Thời gian" : "Time",
      dataIndex: "time",
      key: "time",
      render: (value) => <span className="text-xs font-bold text-[#E84F93]">{value}</span>,
    },
    {
      title: isVi ? "Tên dịch vụ" : "Service Name & Design",
      key: "service",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.count > 1 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#FFF0F6] border border-[#F3D7E4] text-[#E84F93] text-[11px] font-bold shrink-0 shadow-2xs">
              x{row.count}
            </span>
          )}
          <p className="text-xs font-bold text-[#2B182B]">
            {row.service ? row.service.replace(/^x\d+\s*/, "") : `Nail service: Christmas Snow Sparkle - Đỏ Nhung Kiều Kỳ`}
          </p>
        </div>
      ),
    },
    {
      title: isVi ? "Thợ làm móng" : "Assigned Artist",
      key: "artist",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-[9px] font-bold text-white shadow-2xs">
            {(row.artist)
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()}
          </div>
          <span className="text-xs font-bold text-[#2B182B]">{row.artist || "Aria Nguyen"}</span>
        </div>
      ),
    },
    {
      title: isVi ? "Thời gian" : "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (value) => <span className="text-xs font-semibold text-[#6B5B68]">{value}</span>,
    },
    {
      title: isVi ? "Giá tiền" : "Price",
      dataIndex: "price",
      key: "price",
      render: (value) => <span className="text-xs font-bold text-[#047857]">{value}</span>,
    },
    {
      title: isVi ? "Thao tác" : "Action",
      key: "action",
      render: (_, row) => (
        <ActionDropdown
          items={getServiceActionItems(row, handleViewService, handleViewProcedures, isVi)}
          buttonClassName="bg-[#FFF0F6] text-[#E84F93] hover:bg-pink-400 hover:text-white transition-all font-bold rounded-full px-3 py-1 text-xs border border-[#F3D6E5] cursor-pointer shadow-2xs"
          label={isVi ? "Thao tác" : "Actions"}
        />
      ),
    },
  ]), [isVi, handleViewProcedures, handleViewService]);

  const handleTransactionClick = async (txId) => {
    setIsTransactionModalOpen(true);
    setIsFetchingTransaction(true);
    setSelectedTransactionDetail(null);
    try {
      const details = await fetchTransactionById(txId);
      setSelectedTransactionDetail(details);
    } catch (err) {
      toast.error(isVi ? "Lỗi tải chi tiết giao dịch" : "Failed to load transaction details");
      setIsTransactionModalOpen(false);
    } finally {
      setIsFetchingTransaction(false);
    }
  };

  const handleManualCheckIn = useCallback(async () => {
    if (!bookingId || !isManualCheckInAllowed || isManualCheckInSubmitting) {
      return;
    }

    setIsManualCheckInSubmitting(true);

    try {
      const updatedBooking = await manualCheckInReceptionistBooking(bookingId);
      setBooking(updatedBooking);
      toast.success(isVi ? "Khách hàng đã được check in thành công." : "Customer checked in successfully.");
      await loadBookingHistories();
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to check in booking.";
      toast.error(message);
    } finally {
      setIsManualCheckInSubmitting(false);
    }
  }, [bookingId, isManualCheckInAllowed, isManualCheckInSubmitting, loadBookingHistories]);

  const handleCheckout = useCallback(() => {
    if (!bookingId || !actionAvailability.canCheckout) {
      return;
    }

    navigate(getReceptionistBookingCheckoutRoute(bookingId));
  }, [actionAvailability.canCheckout, bookingId, navigate]);

  const handlePrimaryHeaderAction = useCallback(async () => {
    if (actionAvailability.canCheckout) {
      await handleCheckout();
      return;
    }

    await handleManualCheckIn();
  }, [actionAvailability.canCheckout, handleCheckout, handleManualCheckIn]);

  const receptionistActionCenterItems = useMemo(
    () => [
      {
        label: actionAvailability.canCheckout ? (t("receptionist.dashboard.checkoutBtn") || "Checkout") : (t("receptionist.dashboard.checkinBtn") || "Check In"),
        subtitle: actionAvailability.canCheckout ? (t("receptionist.payments.checkoutDesc") || "Collect payment and finalize") : (t("receptionist.bookings.manualCheckInBtn") || "Manual arrival check-in"),
        icon: actionAvailability.canCheckout ? CreditCard : SquareCheckBig,
        cardTone: "bg-[linear-gradient(180deg,#fff1f6_0%,#ffe6f0_100%)]",
        iconTone: "bg-[#ffdcea] text-[#eb5b92]",
        disabled: !(actionAvailability.canCheckIn || actionAvailability.canCheckout),
        loading:
          actionAvailability.canCheckout ? isCheckoutSubmitting : isManualCheckInSubmitting,
        onClick: () => void handlePrimaryHeaderAction(),
      },
      ...(actionAvailability.canStartService ? [{
        label: t("receptionist.bookings.assignChairTitle") || "Assign Chair",
        subtitle: t("receptionist.bookings.assignToSeat") || "Assign to seat",
        icon: Armchair,
        cardTone: "bg-[linear-gradient(180deg,#f2edff_0%,#e9e1ff_100%)]",
        iconTone: "bg-[#dfd1ff] text-[#8160df]",
        disabled: false,
        onClick: () => setIsAssignChairModalOpen(true),
      }] : []),
      {
        label: t("receptionist.bookings.reassignArtist") || "Reassign Artist",
        subtitle: t("receptionist.bookings.changeStaff") || "Change staff",
        icon: UserRound,
        cardTone: "bg-[linear-gradient(180deg,#fff8df_0%,#fff0bf_100%)]",
        iconTone: "bg-[#ffe6a1] text-[#d8a01c]",
        disabled: !actionAvailability.canReassignArtist,
        onClick: () => setIsAssignArtistOpen(true),
      },
      {
        label: t("receptionist.bookings.moveSchedule") || "Move Schedule",
        subtitle: t("receptionist.bookings.rescheduleTime") || "Reschedule time",
        icon: CalendarClock,
        cardTone: "bg-[linear-gradient(180deg,#ebf7ff_0%,#dff1ff_100%)]",
        iconTone: "bg-[#cfe8fb] text-[#4391c9]",
        disabled: !actionAvailability.canMoveSchedule,
        onClick: () => setIsMoveScheduleOpen(true),
      },
      {
        label: t("receptionist.bookings.addService") || "Add Service",
        subtitle: t("receptionist.bookings.extraTreatment") || "Extra treatment",
        icon: Sparkles,
        cardTone: "bg-[linear-gradient(180deg,#e6f8ef_0%,#d8f2e5_100%)]",
        iconTone: "bg-[#cdeedb] text-[#2da466]",
        disabled: !actionAvailability.canAddService,
        onClick: () => setIsOnsiteAddonModalOpen(true),
      },
      // {
      //   label: t("receptionist.bookings.completeBooking") || "Complete Booking",
      //   subtitle: t("receptionist.bookings.finalizeSession") || "Finalize session",
      //   icon: CheckCircle2,
      //   cardTone: "bg-[linear-gradient(180deg,#f2edff_0%,#ebe3ff_100%)]",
      //   iconTone: "bg-[#ddd2ff] text-[#8260df]",
      //   disabled: !actionAvailability.canCompleteBooking,
      //   onClick: () => handleMockAction("Complete Booking"),
      // },
      // {
      //   label: t("receptionist.bookings.cancelBooking") || "Cancel Booking",
      //   subtitle: t("receptionist.bookings.voidAppointment") || "Void appointment",
      //   icon: XCircle,
      //   cardTone: "bg-[linear-gradient(180deg,#fff1f1_0%,#ffe9e9_100%)]",
      //   iconTone: "bg-[#ffd8d8] text-[#ef6b6b]",
      //   disabled: !actionAvailability.canCancelBooking,
      //   onClick: () => handleMockAction("Cancel Booking"),
      // },
      // {
      //   label: t("receptionist.bookings.sendInvoice") || "Send Invoice",
      //   subtitle: t("receptionist.bookings.emailToClient") || "Email to client",
      //   icon: ReceiptText,
      //   cardTone: "bg-[linear-gradient(180deg,#fff9eb_0%,#fff2cd_100%)]",
      //   iconTone: "bg-[#ffe7ae] text-[#d19a15]",
      //   disabled: !actionAvailability.canSendInvoice,
      //   onClick: () => handleMockAction("Send Invoice"),
      // },
    ],
    [
      actionAvailability,
      handlePrimaryHeaderAction,
      isCheckoutSubmitting,
      isManualCheckInSubmitting,
    ],
  );

  if (isLoading) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
        <div className="flex items-center gap-3 text-sm font-medium text-[#b38a9f]">
          <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
          {isVi ? "Đang tải thông tin chi tiết đơn hàng..." : "Loading booking detail..."}
        </div>
      </section>
    );
  }

  if (error || !booking) {
    return (
      <section className="rounded-[24px] border border-[#f6d8e5] bg-white p-6 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
        <p className="text-lg font-bold text-[#412643]">{isVi ? "Không thể tải thông tin chi tiết đơn hàng" : "Booking detail unavailable"}</p>
        <p className="mt-2 text-sm text-[#b38a9f]">{error || "This booking could not be loaded."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="inline-flex items-center gap-2 rounded-full border border-[#f3cade] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
          >
            <RefreshCcw size={14} />
            {isVi ? "Thử lại" : "Retry"}
          </button>
          <Link
            to={ROUTES.receptionistBookings}
            className="inline-flex items-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
          >
            {t("receptionist.payments.backToBookings") || "Back to bookings"}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-5 bg-[linear-gradient(180deg,#FFF9FC_0%,#FFF4F8_100%)] p-2">
      {/* 1. TOP HEADER BAR */}
      <div className="rounded-[26px] border border-[#F3E2EC] bg-white/90 backdrop-blur-md px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-[#2B182B]">{t("receptionist.bookings.title") || "Booking Details"}</h1>
            </div>
            <p className="mt-0.5 text-xs font-medium text-[#9E8497]">{t("receptionist.bookings.desc") || "Real-time salon operations & customer check-in"}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsQrOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#F3E2EC] bg-[#FFF9FB] hover:bg-[#FFF0F6] px-3.5 py-1.5 text-xs font-bold text-[#E84F93] transition shadow-2xs cursor-pointer"
            >
              <QrCode size={14} />
              {t("receptionist.dashboard.scanQr") || "QR Code"}
            </button>

            {/* Primary Gradient Quick Check-In Button */}
            <button
              type="button"
              onClick={() => void handlePrimaryHeaderAction()}
              disabled={isPrimaryHeaderActionDisabled}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E84F93] via-[#D93B7D] to-[#8B5CF6] px-5 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(232,79,147,0.28)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isManualCheckInSubmitting || isCheckoutSubmitting ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <SquareCheckBig size={14} />
              )}
              {primaryHeaderAction}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_320px]">
        <div className="space-y-5">
          {/* 2. CUSTOMER OVERVIEW CARD (TOP-LEFT) */}
          <DetailCard
            title={t("receptionist.payments.customerInfo") || "Customer Overview"}
            badge={booking.status || null}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-1 items-start gap-4">
                {/* High-contrast VIP avatar badge */}
                <div className="relative shrink-0">
                  {customerProfile?.avatarUrl ? (
                    <img
                      crossOrigin="anonymous"
                      src={customerProfile.avatarUrl}
                      alt={customerDisplayName}
                      className="h-20 w-20 rounded-[22px] border-2 border-[#E84F93] object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-[22px] border-2 border-[#E84F93] bg-gradient-to-br from-[#E84F93] via-[#D93B7D] to-[#8B5CF6] text-xl font-bold text-white shadow-md">
                      {customerInitials}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">

                  <div className="flex flex-row justify-between">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-xl font-bold text-[#2B182B] truncate">{customerDisplayName}</p>
                      {customerTier ? (
                        <span
                          className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1"
                          style={{
                            backgroundColor: customerTier.backgroundColor + '15',
                            borderColor: customerTier.backgroundColor + '40',
                            color: customerTier.backgroundColor
                          }}
                        >
                          <Star size={10} className="fill-current" />
                          {customerTier.name} ({customerPoints} pts)
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-[10px] font-bold text-gray-500 flex items-center gap-1">
                          <Star size={10} className="fill-current" />
                          {customerPoints} pts
                        </span>
                      )}
                    </div>

                    {/* Quick Actions rounded icon buttons */}
                    <div className="flex items-center gap-2 lg:items-end shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMockAction("Call Customer")}
                        title="Call Customer"
                        className="p-3 rounded-2xl bg-[#FFF0F6] border border-[#F3D6E5] text-[#E84F93] hover:bg-[#E84F93] hover:text-white transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold"
                      >
                        <Phone size={16} />
                        <span className="hidden sm:inline lg:hidden">Call</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMockAction("Send SMS / Chat")}
                        title="Send SMS / Chat"
                        className="p-3 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold"
                      >
                        <MessageCircleMore size={16} />
                        <span className="hidden sm:inline lg:hidden">SMS</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMockAction("View VTO History")}
                        title="View VTO Try-On History"
                        className="p-3 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] hover:bg-[#F59E0B] hover:text-white transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold"
                      >
                        <Sparkles size={16} />
                        <span className="hidden sm:inline lg:hidden">VTO</span>
                      </button>
                    </div>
                  </div>

                  {/* Clean 2-column key-value grid */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F3E2EC]">
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">{t("profile.phone") || "Phone Number"}</p>
                        <p className="mt-0.5 font-bold text-[#2B182B]">{customerProfile?.phone || booking.customerPhone || "0987 654 321"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">{t("receptionist.customers.tier") || "Membership Tier"}</p>
                        <div className="mt-0.5 font-bold text-[#E84F93]"><div className="flex items-center gap-2.5 flex-wrap">
                          {customerTier ? (
                            <span
                              className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1"
                              style={{
                                backgroundColor: customerTier.backgroundColor + '15',
                                borderColor: customerTier.backgroundColor + '40',
                                color: customerTier.backgroundColor
                              }}
                            >
                              <Star size={10} className="fill-current" />
                              {customerTier.name} ({customerPoints} pts)
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-[10px] font-bold text-gray-500 flex items-center gap-1">
                              <Star size={10} className="fill-current" />
                              {customerPoints} pts
                            </span>
                          )}
                        </div></div>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">{t("profile.email") || "Email Address"}</p>
                        <p className="mt-0.5 font-medium text-[#2B182B] truncate">{customerProfile?.email || booking.customerEmail}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E8497]">{t("receptionist.bookings.artist")}</p>
                        <p className="mt-0.5 font-bold text-[#8B5CF6]">{booking.artistName || customerProfile?.preferredArtist}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DetailCard>

          {/* 3. APPOINTMENT & SERVICE DETAILS (CENTER BLOCK) */}
          <DetailCard
            title={t("receptionist.bookings.title") || "Appointment & Service Details"}
            subtitle={t("receptionist.bookings.desc") || "Scheduled treatments & selected nail designs"}
            badge={language === "vi" ? `${serviceRows.length || 0} Dịch vụ` : `${serviceRows.length || 0} Services`}
          >
            <Table
              rowKey="id"
              columns={serviceColumns}
              dataSource={serviceRows}
              pagination={false}
              scroll={{ x: 860 }}
              locale={{ emptyText: t("receptionist.bookings.noBookings") || "No appointment services available." }}
            />
          </DetailCard>

          {/* 5. FINANCIAL & PAYMENT SUMMARY (BOTTOM BLOCK) */}
          <DetailCard
            title={t("receptionist.payments.summaryTitle") || "Financial & Payment Summary"}
            subtitle={t("receptionist.payments.checkoutDesc") || "Itemized price breakdown, deposit, and total balance"}
            badge="API Validated"
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
              <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-[#F3E2EC] space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#9E8497]">{t("receptionist.payments.subtotal") || "Itemized Service Price"}:</span>
                    <span className="font-bold text-[#2B182B]">{price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#9E8497]">{t("receptionist.payments.promotion") || "Promotional Discount"}:</span>
                    <span className="font-bold text-[#EF4444]">{discount}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#F3E2EC] pt-2">
                    <span className="font-medium text-[#9E8497]">{t("receptionist.payments.deposit") || "Deposit Paid"}:</span>
                    <span className="font-bold text-[#2B182B]">{depositPaid}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#9E8497]">{t("receptionist.payments.totalAmount") || "Remaining Balance"}:</span>
                    <span className="font-bold text-[#8B5CF6]">{remainingBalance}</span>
                  </div>
                </div>

                {/* Fresh Emerald Green Highlighted Total */}
                <div className="border-2 border-emerald-300 pt-3.5 pb-3 px-4 flex items-center justify-between bg-gradient-to-r from-[#ECFDF5] to-[#D1FAE5] rounded-2xl shadow-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#047857]">{t("receptionist.payments.totalAmount") || "Total Amount Payable"}</p>
                    <p className="text-3xl font-bold text-[#047857] leading-none mt-1">{remainingBalance}</p>
                  </div>
                  {/* <span className="rounded-full bg-[#10B981] text-white px-3.5 py-1 text-xs font-bold shadow-xs flex items-center gap-1">
                    <ShieldCheck size={14} /> {language === "vi" ? "ĐÃ THANH TOÁN" : "PAID"}
                  </span> */}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3.5">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!actionAvailability.canCheckout}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E84F93] via-[#D93B7D] to-[#8B5CF6] px-5 py-3.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(232,79,147,0.3)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard size={16} />
                  {t("receptionist.payments.checkoutTitle") || "Add Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => handleMockAction("Print Receipt")}
                  disabled={!actionAvailability.canPrintReceipt}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#F3E2EC] bg-[#FFF5F8] hover:bg-[#FCE2EE] px-5 py-3.5 text-xs font-bold text-[#E84F93] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                >
                  <Printer size={16} />
                  {language === "vi" ? "In Hóa đơn" : "Print Receipt"}
                </button>
              </div>
            </div>
          </DetailCard>

          {/* 6. RECEPTIONIST QUICK ACTION CENTER (BOTTOM GRID) */}
          <DetailCard
            title={t("receptionist.bookings.actions") || "Receptionist Quick Action Center"}
            subtitle={t("receptionist.bookings.desc") || "Interactive operational controls for this customer session"}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {receptionistActionCenterItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    disabled={item.disabled || item.loading}
                    className={`rounded-2xl border border-[#F3E2EC] p-4 text-center shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${item.cardTone}`}
                  >
                    <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl shadow-2xs ${item.iconTone}`}>
                      {item.loading ? <LoaderCircle size={18} className="animate-spin" /> : <Icon size={18} />}
                    </span>
                    <p className="mt-3 text-xs font-bold text-[#2B182B]">{item.label}</p>
                    <p className="mt-1 text-[10px] text-[#9E8497] font-medium leading-tight">{item.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </DetailCard>
        </div>

        {/* SIDEBAR RIGHT COLUMN */}
        <aside className="space-y-5">
          {/* QUICK STATUS & LIVE TRACKER (TOP-RIGHT) */}
          <DetailCard title={t("receptionist.common.status") || "Quick Status & Live Tracker"}>
            <div className="flex flex-col items-center">
              <div className="self-stretch flex items-center justify-between pb-2 border-b border-[#F3E2EC]">
                <span className="font-medium text-xs text-[#9E8497]">{t("receptionist.common.status") || "Live Status"}</span>
                <span className={`rounded-full px-3 py-0.5 text-xs font-bold shadow-2xs ${getStatusTone(String(booking.status || ""))}`}>
                  {booking.status || "Checked In"}
                </span>
              </div>

              {/* Gradient Circular Progress Ring */}
              <CircularProgressRing
                percent={progressPercent}
                remainingTime={getRemainingTime(booking, language)}
              />

              <div className="self-stretch space-y-2.5 text-xs pt-1">
                <div className="flex items-center justify-between bg-[#FFF9FB] p-2.5 rounded-xl border border-[#F3E2EC]">
                  <span className="font-medium text-[#9E8497]">{t("receptionist.bookings.artist") || "Assigned Artist"}</span>
                  <span className="font-bold text-[#2B182B]">{booking.artistName}</span>
                </div>
                <div className="flex items-center justify-between bg-[#FFF9FB] p-2.5 rounded-xl border border-[#F3E2EC]">
                  <span className="font-medium text-[#9E8497]">{t("receptionist.bookings.assignChairTitle") || "Chair / Station"}</span>
                  <span className="font-bold text-[#8B5CF6]">{booking.chairName || (language === "vi" ? "Chưa xếp ghế" : "Not Assigned")}</span>
                </div>
                <div className="flex items-center justify-between bg-[#FFF9FB] p-2.5 rounded-xl border border-[#F3E2EC]">
                  <span className="font-medium text-[#9E8497]">{t("receptionist.bookings.time") || "Check-in Time"}</span>
                  <span className="font-bold text-[#2B182B]">
                    {["CheckedIn", "In Progress", "ServiceCompleted", "Completed"].includes(String(booking.status || "")) ? formatTime(booking.startTime) : "10:00 AM"}
                  </span>
                </div>
              </div>
            </div>
          </DetailCard>

          {/* TRANSACTIONS LIST */}
          <DetailCard title={language === "vi" ? "Lịch sử giao dịch" : "Transaction History"}>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3 mt-2">
                {[...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((tx, idx) => {
                  const isDeposit = idx === 0 || tx.amount === booking?.depositAmount;
                  return (
                    <div
                      key={tx.transactionId}
                      onClick={() => handleTransactionClick(tx.transactionId)}
                      className="rounded-xl border border-[#F3E2EC] bg-white p-3 shadow-2xs hover:border-[#E84F93] transition-colors cursor-pointer group flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] text-[#9E8497] mt-0.5 font-mono">#{tx.orderCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-extrabold text-[#E84F93]">{formatCurrency(tx.amount)}</p>
                       
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
            ) : (
              <div className="rounded-2xl border border-dashed border-[#F3E2EC] bg-[#FFFBFD] p-6 text-center text-xs text-[#9E8497] italic mt-2">
                {language === "vi" ? "Chưa có giao dịch nào cho đơn đặt lịch này." : "No transactions found for this booking yet."}
              </div>
            )}
          </DetailCard>

          {/* CUSTOMER REVIEW WIDGET */}
          <DetailCard title={language === "vi" ? "Đánh giá khách hàng" : "Customer Review Widget"}>
            <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F3E2EC] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#E84F93] to-[#8B5CF6] text-xs font-bold text-white shadow-2xs">
                    {customerInitials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#2B182B]">{customerDisplayName}</p>
                    <p className="text-[10px] text-[#9E8497] font-medium">{formatDate(booking.bookingDate)}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 text-[#F59E0B]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={12} className="fill-current text-[#F59E0B]" />
                  ))}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-[#6B5B68] italic pt-1">
                {language === "vi" ? "Dịch vụ làm móng đính đá mẫu Giáng Sinh rất tỉ mỉ và đẹp tuyệt vời! Thợ làm rất dịu dàng." : "Christmas nail art service is very meticulous and beautiful! The technician is very gentle."}
              </p>
            </div>
          </DetailCard>

          {/* BOOKING OPERATIONS TIMELINE */}
          <DetailCard
            title={language === "vi" ? "Dòng thời gian hoạt động đặt lịch" : "Booking Operations Timeline"}
            subtitle={language === "vi" ? "Nhật ký kiểm tra theo thời gian thực" : "Real-time timestamped audit log"}
            badge={isBookingHistoriesLoading ? "Loading..." : `${bookingHistories.length} Events`}
          >
            {isBookingHistoriesLoading ? (
              <div className="flex justify-center p-8"><LoaderCircle className="animate-spin text-[#E84F93]" /></div>
            ) : bookingHistories.length > 0 ? (
              <div className="mt-4 flex flex-col max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {[...bookingHistories].reverse().map((history, idx) => (
                  <div key={history.bookingHistoryId || idx} className="flex gap-3" title={dayjs(history.createdAt).format("DD/MM/YYYY HH:mm")}>
                    <div className="w-[100px] shrink-0 pt-0.5 text-right">
                      <span className="text-[11px] font-bold text-[#F59E0B]">
                        {dayjs(history.createdAt).format("DD/MM/YY")}
                      </span>
                      <span className="mx-1 text-[#C8B0BF]">|</span>
                      <span className="text-[11px] font-bold text-[#10B981]">
                        {dayjs(history.createdAt).format("HH:mm")}
                      </span>
                    </div>

                    <div className="relative flex flex-col items-center">
                      <div className="h-2.5 w-2.5 mt-1 rounded-full border-2 border-[#E84F93] bg-white z-10 shrink-0 shadow-xs" />
                      {idx !== bookingHistories.length - 1 && (
                        <div className="w-[2px] h-full bg-[#F3E2EC] absolute top-2.5" />
                      )}
                    </div>

                    <div className="flex-1 pb-4 text-xs">
                      {(() => {
                        let roleText = history.actorRole;
                        if (history.actorRole === "Customer") roleText = "Khách Hàng";
                        else if (history.actorRole === "Manager") roleText = "Quản lý";
                        else if (history.actorRole === "Receptionist") roleText = "Lễ tân";
                        else if (history.actorRole === "Staff_Artist" || history.actorRole === "Artist") roleText = "Thợ làm móng";
                        else roleText = "Hệ thống";

                        const actorDisplayName = (history.actorName && history.actorName.trim() !== "" && history.actorName !== "Unknown") ? history.actorName.trim() : null;

                        let rawPayload = history.payload || "";
                        rawPayload = rawPayload.replace(/\s?Mã QR \(Base64\) đã được khởi tạo\./g, "");
                        rawPayload = rawPayload.replace(/Quản lý Salon\s?/gi, "");

                        const urlRegex = /(https?:\/\/[^\s]+)/g;
                        let imageUrl = null;
                        const match = rawPayload.match(urlRegex);
                        if (match) {
                          imageUrl = match[0];
                          rawPayload = rawPayload.replace(urlRegex, "").trim();
                        }

                        let formattedAction = "";
                        if (rawPayload.includes("tự động hủy do khách trễ") || rawPayload.includes("trễ quá 15 phút")) {
                          formattedAction = "đã tự động hủy lịch hẹn do khách hàng trễ quá 15 phút không check-in.";
                        } else if (rawPayload.includes("Hủy đơn từ trạng thái") || rawPayload.toLowerCase().includes("hủy đơn")) {
                          const reasonMatch = rawPayload.match(/Lý do:\s*(.*)/i);
                          if (reasonMatch && reasonMatch[1]) {
                            let cleanReason = reasonMatch[1].trim();
                            if (cleanReason.toLowerCase().includes("hệ thống tự động hủy do")) {
                              formattedAction = "đã tự động hủy lịch hẹn do khách hàng trễ quá 15 phút không check-in.";
                            } else {
                              formattedAction = `đã hủy lịch hẹn. Lý do: ${cleanReason.charAt(0).toUpperCase() + cleanReason.slice(1)}.`;
                            }
                          } else {
                            formattedAction = "đã hủy lịch hẹn.";
                          }
                        } else if (rawPayload.includes("Đơn đặt lịch được tạo thành công") || rawPayload.includes("tạo thành công")) {
                          formattedAction = "đã tạo đơn đặt lịch thành công.";
                        } else if (rawPayload.includes("xác nhận duyệt đơn đặt lịch")) {
                          formattedAction = "đã xác nhận duyệt đơn đặt lịch.";
                        } else if (rawPayload.includes("Khách hàng đã check-in") || rawPayload === "Khách hàng đã check-in." || rawPayload.includes("check-in cho khách")) {
                          formattedAction = "đã thực hiện check-in thành công.";
                        } else if (rawPayload.includes("Check-in thành công")) {
                          formattedAction = "đã hoàn tất thủ tục check-in.";
                        } else if (rawPayload.includes("thanh toán") || rawPayload.includes("check-out")) {
                          formattedAction = "đã hoàn tất thủ tục thanh toán & check-out.";
                        } else if (rawPayload.includes("Đơn đặt lịch được cập nhật")) {
                          formattedAction = "đã cập nhật thông tin đơn đặt lịch.";
                        } else if (rawPayload.startsWith("đã ")) {
                          formattedAction = rawPayload;
                        } else {
                          formattedAction = `đã ${rawPayload.toLowerCase()}`;
                        }

                        return (
                          <>
                            <p className="text-[#6B5B68] leading-relaxed">
                              <span className="font-bold text-[#2B182B]">
                                {roleText}
                              </span>{" "}
                              {actorDisplayName && (
                                <>
                                  <span className="font-bold text-[#E84F93]">
                                    "{actorDisplayName}"
                                  </span>{" "}
                                </>
                              )}
                              {formattedAction}
                            </p>
                            {imageUrl && (
                              <div className="mt-2">
                                <Image
                                  crossOrigin="anonymous"
                                  src={imageUrl}
                                  alt="Hình ảnh"
                                  className="h-12 w-12 rounded-xl border border-[#F3E2EC] object-cover shadow-2xs"
                                  style={{ height: "48px", width: "48px" }}
                                />
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#F3E2EC] bg-[#FFFBFD] p-6 text-center text-xs text-[#9E8497] italic">
                {language === "vi" ? "Không có sự kiện lịch sử nào được tìm thấy cho đơn đặt lịch này." : "No history events found for this booking yet."}
              </div>
            )}
          </DetailCard>
        </aside>
      </div>

      <AssignChairModal
        isOpen={isAssignChairModalOpen}
        onClose={() => setIsAssignChairModalOpen(false)}
        booking={booking}
        onSuccess={() => handleRefresh()}
      />

      <Modal
        open={Boolean(selectedServiceRow)}
        onCancel={() => setSelectedServiceRow(null)}
        footer={null}
        closable={false}
        centered
        width={720}
        styles={{ content: { padding: 0, borderRadius: 28, overflow: "hidden" } }}
      >
        {selectedServiceRow ? (() => {
          const item = selectedServiceRow.sourceItem;
          const isNail = isNailBookingItem(item);
          const hasImages = Boolean(
            sanitizeImageUrl(item?.nailVariantImageUrl) || sanitizeImageUrl(item?.customerNailImageUrl)
          );

          return (
            <div className="bg-white p-6 md:p-7 relative font-sans">
              {/* Ambient Top Glow */}
              <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#E84F93]/10 blur-3xl" />

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#F3E2EC] pb-4 mb-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#E84F93] via-[#D93B7D] to-[#8B5CF6] text-white shadow-xs">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2B182B] tracking-tight">{language === "vi" ? "Chi Tiết Dịch Vụ & Mẫu Móng" : "Service & Nail Art Details"}</h3>
                    <p className="text-xs text-[#9E8497] font-medium">{language === "vi" ? "Thông tin thực tế dịch vụ và mẫu móng khách chọn" : "Actual service and nail art details selected by the customer"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedServiceRow(null)}
                  className="rounded-full p-2 text-[#9E8497] hover:bg-[#FFF0F6] hover:text-[#E84F93] transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Service Hero Banner Card */}
              <div className="mb-5 rounded-2xl border border-[#F3D6E5] bg-gradient-to-r from-[#FFF0F6] via-[#FDF2F8] to-[#F5F3FF] p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[#E84F93] px-3 py-0.5 text-[10px] font-bold uppercase text-white shadow-2xs">
                    {isNail ? language === "vi" ? <span className="flex items-center gap-1"><Sparkles size={12} /> Dịch Vụ Móng Nail</span> : <span className="flex items-center gap-1"><Sparkles size={12} /> Nail Services</span> : language === "vi" ? "💅 Dịch Vụ Salon" : "💅 Salon Services"}
                  </span>
                  <span className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#E84F93]">
                    <AlarmClock size={12} /> {language === "vi" ? "Tổng thời gian:" : "Total duration:"} {selectedServiceRow.duration}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-bold text-[#2B182B]">
                  {item?.serviceName || selectedServiceRow.service || item?.nailVariantName || language === "vi" ? "Dịch Vụ Làm Móng" : "Nail Service"}
                </h3>
              </div>

              {/* Metadata Details Unified Single Block Card */}
              <div className="rounded-2xl border border-[#F3E2EC] bg-[#FFF9FB] p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#E84F93] border-b border-[#F3E2EC] pb-3 mb-3 flex items-center gap-1.5">
                  <Sparkles size={14} /> {language === "vi" ? "Thông Tin Chi Tiết Dịch Vụ" : "Service Details"}
                </h4>

                <div className="divide-y divide-[#F3E2EC]/70 text-xs">
                  {/* Tên mẫu nail */}
                  {Boolean(item?.nailVariantName) && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 gap-1">
                      <span className="font-bold text-[#9E8497]">{language === "vi" ? "Tên Mẫu Nail" : "Nail Variant Name"}</span>
                      <span className="font-bold text-[#2B182B] text-sm sm:text-right">{item.nailVariantName}</span>
                    </div>
                  )}

                  {/* Mẫu móng khách yêu cầu (Only shown if present) */}
                  {Boolean(item?.customerNailName) && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 gap-1">
                      <span className="font-bold text-[#9E8497]">{language === "vi" ? "Mẫu Nail Khách Yêu Cầu" : "Customer's Nail Style Request"}</span>
                      <span className="font-bold text-[#2B182B] text-sm sm:text-right">{item.customerNailName}</span>
                    </div>
                  )}

                  {/* Tên dịch vụ (Only shown if no nailVariantName or if different) */}
                  {Boolean(
                    (!item?.nailVariantName && (item?.serviceName || selectedServiceRow.service || selectedServiceRow.serviceType)) ||
                    (item?.serviceName && !item.serviceName.includes(item?.nailVariantName))
                  ) && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 gap-1">
                        <span className="font-bold text-[#9E8497]">{language === "vi" ? "Tên Dịch Vụ" : "Service Name"}</span>
                        <span className="font-bold text-[#2B182B] sm:text-right">
                          {item?.serviceName || selectedServiceRow.service || selectedServiceRow.serviceType}
                        </span>
                      </div>
                    )}

                  {/* Thời gian làm dự kiến */}
                  {Boolean(selectedServiceRow.duration) && (
                    <div className="flex items-center justify-between py-2.5">
                      <span className="font-bold text-[#9E8497]">{language === "vi" ? "Thời Gian Làm Dự Kiến" : "Estimated Duration"}</span>
                      <span className="font-bold text-[#2B182B]">{selectedServiceRow.duration}</span>
                    </div>
                  )}

                  {/* Số lượng */}
                  {Boolean(item?.quantity && item.quantity > 1) && (
                    <div className="flex items-center justify-between py-2.5">
                      <span className="font-bold text-[#9E8497]">{language === "vi" ? "Số Lượng Suất" : "Quantity"}</span>
                      <span className="font-bold text-[#2B182B]">x{item.quantity}</span>
                    </div>
                  )}

                  {/* Giá dịch vụ */}
                  {item?.price !== undefined && item?.price !== null && (
                    <div className="flex items-center justify-between py-2.5">
                      <span className="font-bold text-[#9E8497]">{language === "vi" ? "Giá Dịch Vụ" : "Service Price"}</span>
                      <span className="font-bold text-[#047857] text-sm">{formatCurrency(item.price)}</span>
                    </div>
                  )}

                  {/* Thợ đảm nhận */}
                  {Boolean(selectedServiceRow.artist && selectedServiceRow.artist !== "--") && (
                    <div className="flex items-center justify-between py-2.5">
                      <span className="font-bold text-[#9E8497]">{language === "vi" ? "Thợ Đảm Nhận" : "Artist"}</span>
                      <span className="font-bold text-[#6D28D9]">{selectedServiceRow.artist}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attached Images Section */}
              {hasImages && (
                <div className="mt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#9E8497] mb-3 text-center flex items-center justify-center gap-1.5">
                    <span><ImageIcon size={12} /></span> {language === "vi" ? "Hình Ảnh Mẫu Móng Thực Tế" : "Actual Nail Style Images"}
                  </h4>
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    {sanitizeImageUrl(item?.nailVariantImageUrl) && (
                      <div className="flex flex-col items-center gap-2">
                        <span className="rounded-full bg-[#FFF0F6] px-3 py-1 text-[10px] font-bold text-[#E84F93] border border-[#F3D6E5]">
                          {language === "vi" ? "Mẫu Nail" : "Nail Variant"}
                        </span>
                        <div className="overflow-hidden rounded-2xl border-4 border-white shadow-md hover:scale-105 transition-transform duration-300">
                          <Image
                            src={sanitizeImageUrl(item?.nailVariantImageUrl)}
                            alt={language === "vi" ? "Mẫu Nail" : "Nail Variant"}
                            height={220}
                            className="object-cover rounded-xl"
                            crossOrigin="anonymous"
                          />
                        </div>
                      </div>
                    )}

                    {sanitizeImageUrl(item?.customerNailImageUrl) && (
                      <div className="flex flex-col items-center gap-2">
                        <span className="rounded-full bg-[#F5F3FF] px-3 py-1 text-[10px] font-bold text-[#6D28D9] border border-[#DDD6FE]">
                          {language === "vi" ? "Mẫu Nail Khách Gửi" : "Customer's Nail Style"}
                        </span>
                        <div className="overflow-hidden rounded-2xl border-4 border-white shadow-md hover:scale-105 transition-transform duration-300">
                          <Image
                            src={sanitizeImageUrl(item?.customerNailImageUrl)}
                            alt={language === "vi" ? "Mẫu Nail Khách Gửi" : "Customer's Nail Style"}
                            height={220}
                            className="object-cover rounded-xl"
                            crossOrigin="anonymous"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Close Button */}
              <div className="mt-6 flex justify-end border-t border-[#F3E2EC] pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedServiceRow(null)}
                  className="rounded-full border border-[#F3E2EC] bg-[#FFF5F8] hover:bg-[#FCE2EE] px-6 py-2.5 text-xs font-bold text-[#2B182B] transition cursor-pointer"
                >
                  {language === "vi" ? "Đóng" : "Close"}
                </button>
              </div>
            </div>
          );
        })() : null}
      </Modal>

      <Modal
        open={Boolean(selectedProcedureRow)}
        onCancel={() => {
          setSelectedProcedureRow(null);
          setBookingProcedures([]);
          setProceduresError("");
          setArtistPickerProcedure(null);
          setProcedureArtists([]);
          setProcedureArtistsError("");
        }}
        footer={[
          <Button
            key="close-procedure-view"
            className="rounded-full font-bold border-[#F3E2EC] text-[#2B182B] hover:border-[#E84F93] hover:text-[#E84F93] px-6"
            onClick={() => {
              setSelectedProcedureRow(null);
              setBookingProcedures([]);
              setProceduresError("");
              setArtistPickerProcedure(null);
              setProcedureArtists([]);
              setProcedureArtistsError("");
            }}
          >
            {language === "vi" ? "Đóng" : "Close"}
          </Button>,
        ]}
        centered
        width={1020}
        title={
          <div className="flex items-center gap-2.5 text-[#2B182B] text-base font-bold border-b border-[#F3E2EC] pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#E84F93] to-[#8B5CF6] text-white shadow-xs">
              <ClipboardList size={16} />
            </div>
            <span>{language === "vi" ? "Quy Trình Làm Móng & Phân Công Thợ" : "Booking Procedures & Artist Assignment"}</span>
          </div>
        }
      >
        {selectedProcedureRow ? (
          <div className="space-y-6 py-2">
            {/* Service Summary Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-[#F3D6E5] bg-gradient-to-r from-[#FFF0F6] via-[#FDF2F8] to-[#F5F3FF] p-5 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#E84F93] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
                      {language === "vi" ? "Dịch Vụ Chọn" : "Service Selected"}
                    </span>
                    <span className="text-xs font-bold text-[#8B5CF6]">
                      {selectedProcedureRow.serviceType !== "--" ? selectedProcedureRow.serviceType : "Nail Treatment"}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-lg font-bold text-[#2B182B]">
                    {selectedProcedureRow.sourceItem?.serviceName ||
                      selectedProcedureRow.service ||
                      selectedProcedureRow.sourceItem?.nailVariantName ||
                      selectedProcedureRow.serviceType ||
                      selectedProcedureRow.sourceItem?.customerNailName ||
                      "--"}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 rounded-xl border border-[#F3E2EC] bg-white/80 px-3 py-1.5 text-xs font-bold text-[#2B182B] shadow-2xs">
                    <Clock size={14} className="text-[#E84F93]" />
                    <span>{language === "vi" ? "Thời gian:" : "Duration:"} {selectedProcedureRow.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl border border-[#F3E2EC] bg-white/80 px-3 py-1.5 text-xs font-bold text-[#2B182B] shadow-2xs">
                    <Sparkles size={14} className="text-[#8B5CF6]" />
                    <span>{language === "vi" ? "Số lượng:" : "Quantity:"} x{selectedProcedureRow.sourceItem?.quantity ?? 1}</span>
                  </div>
                  {bookingProcedures.length > 0 && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-[#D1FAE5] bg-[#ECFDF5] px-3 py-1.5 text-xs font-bold text-[#047857] shadow-2xs">
                      <ShieldCheck size={14} />
                      <span>{bookingProcedures.length} {language === "vi" ? "bước dịch vụ" : "service steps"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Procedures Timeline Content - Scalable & Scrollable for 10+ steps */}
            {isProceduresLoading ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#F3D6E5] bg-[#FFF9FB] p-8">
                <LoaderCircle size={28} className="animate-spin text-[#E84F93]" />
                <p className="text-sm font-bold text-[#2B182B]">{language === "vi" ? "Đang tải danh sách các bước quy trình..." : "Loading procedure steps..."}</p>
              </div>
            ) : proceduresError ? (
              <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-sm font-bold text-[#991B1B]">
                {proceduresError}
              </div>
            ) : bookingProcedures.length ? (
              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3.5">
                {bookingProcedures
                  .slice()
                  .sort((left, right) => (left?.stepOrder ?? 0) - (right?.stepOrder ?? 0))
                  .map((procedure, index) => {
                    const statusLower = String(procedure.status || "").toLowerCase();
                    const isCompleted = statusLower === "completed";
                    const isInProgress = statusLower === "inprogress" || statusLower === "in progress";
                    const isPending = statusLower === "pending";

                    let statusTone = "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]";
                    let statusLabel = procedure.status || "Chưa làm";

                    if (isCompleted) {
                      statusTone = "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]";
                      statusLabel = language === "vi" ? "Đã hoàn thành" : "Completed";
                    } else if (isInProgress) {
                      statusTone = "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]";
                      statusLabel = language === "vi" ? "Đang thực hiện" : "In Progress";
                    } else if (isPending) {
                      statusTone = "border-[#FDE68A] bg-[#FEF3C7] text-[#B45309]";
                      statusLabel = language === "vi" ? "Chờ thực hiện" : "Pending";
                    }

                    const hasArtist = Boolean(procedure.assignedArtistId || procedure.assignedArtistName);
                    const hasPassive = Boolean(procedure.passiveDuration && procedure.passiveDuration > 0);

                    return (
                      <div
                        key={procedure.bookingProcedureId || index}
                        className="group relative rounded-2xl border border-[#F3E2EC] bg-white p-4 shadow-xs hover:shadow-md hover:border-[#F3D6E5] transition-all duration-200"
                      >
                        {/* Step Header Bar */}
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-[#F8F1F5] pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#E84F93] to-[#D93B7D] px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                              {language === "vi" ? "Bước" : "Step"} {procedure.stepOrder ?? index + 1}
                            </span>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusTone}`}>
                              {statusLabel}
                            </span>
                            {procedure.isRequired && (
                              <span className="rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-0.5 text-[10px] font-bold text-[#B45309]">
                                {language === "vi" ? "Bắt buộc" : "Required"}
                              </span>
                            )}
                            {procedure.isMainStep && (
                              <span className="rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-2.5 py-0.5 text-[10px] font-bold text-[#6D28D9]">
                                {language === "vi" ? "Bước chính" : "Main Step"}
                              </span>
                            )}
                            <h4 className="text-sm font-bold text-[#2B182B] ml-1">
                              {procedure.procedureName || "Chưa đặt tên bước"}
                            </h4>
                          </div>

                          {/* Time badge (Estimated Time) */}
                          <div className="flex items-center gap-2 text-xs shrink-0">
                            <span className="flex items-center gap-1 font-bold text-[#E84F93]">
                              <Clock size={12} /> {isVi ? "Dự kiến" : "Estimated"}: {String(procedure.estimatedStartTime).slice(0, 5)} - {String(procedure.estimatedEndTime).slice(0, 5)}
                            </span>
                            <span className="rounded-full bg-[#FFF0F6] px-2.5 py-0.5 text-[11px] font-bold text-[#E84F93] border border-[#F3D6E5]">
                              {formatDurationMinutes(procedure.duration || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Step Main Content Row (Integrated Artist & Time Breakdown) */}
                        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] items-center">
                          {/* Left: Thợ Đảm Nhận Panel */}
                          <div className="flex items-center justify-between rounded-xl border border-[#F3E2EC] bg-[#FFF9FB] p-2.5 sm:px-3.5">
                            <div className="flex items-center gap-2.5">
                              {hasArtist ? (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#C084FC] text-xs font-bold text-white shadow-2xs">
                                  {(procedure.assignedArtistName || "A")
                                    .split(" ")
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((p) => p[0])
                                    .join("")
                                    .toUpperCase()}
                                </div>
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#F3D6E5] bg-white text-[#C8B0BF]">
                                  <UserRound size={16} />
                                </div>
                              )}

                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-[#9E8497]">{language === "vi" ? "Thợ Đảm Nhận" : "Assigned Artist"}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-bold text-[#2B182B]">
                                    {hasArtist ? procedure.assignedArtistName : language === "vi" ? "Chưa phân công thợ" : "Not Assigned"}
                                  </span>
                                  {hasArtist ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 text-[9px] font-bold text-[#047857]">
                                      <Check size={9} /> {language === "vi" ? "Đã phân công" : "Assigned"}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] border border-[#FDE68A] px-2 py-0.5 text-[9px] font-bold text-[#B45309]">
                                      {language === "vi" ? "Cần chọn thợ" : "Need to assign artist"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => void handleOpenProcedureArtistPicker(procedure)}
                              className="inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#E84F93] via-[#D93B7D] to-[#8B5CF6] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:scale-105 active:scale-95 transition cursor-pointer shrink-0 ml-3"
                            >
                              {hasArtist ? <RefreshCcw size={12} /> : <UserPlus size={12} />}
                              <span>{hasArtist ? (language === "vi" ? "Đổi Thợ" : "Change Artist") : (language === "vi" ? "Phân Công" : "Assign")}
                              </span>
                            </button>
                          </div>

                          {/* Right: Time Breakdown & Overlap Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center justify-center gap-1.5 inline-flex items-center gap-1 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-2.5 py-1 text-[11px] font-bold text-[#6D28D9]">
                              <Zap size={12} /> {language === "vi" ? "Thao tác" : "Active"}: {procedure.activeDuration ?? 0}m
                            </span>

                            {hasPassive && (
                              <span className="flex items-center justify-center gap-1.5 inline-flex items-center gap-1 rounded-full border border-[#BAE6FD] bg-[#F0F9FF] px-2.5 py-1 text-[11px] font-bold text-[#0284C7]">
                                <Hourglass size={12} /> {language === "vi" ? "Hơ máy / Chờ" : "Curing / Waiting"}: {procedure.passiveDuration}m
                              </span>
                            )}

                            {(hasPassive || procedure.canOverlap) ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#047857]">
                                ✨ {language === "vi" ? "Chồng chéo" : "Overlap"} ({language === "vi" ? "Rảnh" : "Free"} {procedure.passiveDuration ?? 0}m)
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-1.5 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                                <LockKeyhole size={12} /> {language === "vi" ? "Làm liên tục" : "Continuous"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Extra Guidance Note (If Passive Time > 0) */}
                        {hasPassive && (
                          <div className="mt-2 text-[11px] font-semibold text-[#6D28D9] bg-[#F5F3FF] p-2 rounded-lg border border-[#E9D5FF] flex items-center gap-1.5">
                            <span><Lightbulb size={12} /></span>
                            <span>
                              {language === "vi"
                                ? `Trong ${<strong>${procedure.passiveDuration} phút</strong>} hơ máy / chờ khô này, thợ rảnh tay và có thể tranh thủ làm cho khách khác (Overlap).`
                                : `In ${<strong>${procedure.passiveDuration} minutes</strong>} of curing / waiting time, the artist is free and can take the opportunity to serve another customer (Overlap).`}
                            </span>
                          </div>
                        )}

                        {/* Footer Row: Actual Execution Time & Completion */}
                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#F8F1F5] pt-2 text-[11px]">
                          <div>
                            <span className="font-bold text-[#9E8497]">{language === "vi" ? "Thực tế làm:" : "Actual time:"} </span>
                            <span className="font-bold text-[#2B182B]">
                              {(() => {
                                const startVal = procedure.actualStartTime || procedure.startTime;
                                const endVal = procedure.actualEndTime || procedure.completedAt;
                                const fmt = (v) => (!v ? "--:--" : String(v).includes("T") ? String(v).split("T").pop().slice(0, 5) : String(v).slice(0, 5));
                                return `${fmt(startVal)} ~ ${fmt(endVal)}`;
                              })()}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-[#9E8497]">{language === "vi" ? "Người hoàn thành:" : "Completed by:"} </span>
                            <span className="font-bold text-[#2B182B]">
                              {procedure.completedByName || <span className="text-[#9E8497] italic font-normal">{language === "vi" ? "Chưa xong" : "Not completed"}</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#F3D6E5] bg-[#FFF9FB] p-8 text-center text-xs font-bold text-[#9E8497]">
                {language === "vi" ? "Không tìm thấy bước quy trình nào cho dịch vụ này." : "No procedure steps found for this service."}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(artistPickerProcedure)}
        onCancel={() => {
          setArtistPickerProcedure(null);
          setProcedureArtists([]);
          setProcedureArtistsError("");
          setAssigningProcedureArtistId("");
        }}
        footer={[
          <Button
            key="close-procedure-artist-picker"
            className="rounded-full font-bold border-[#F3E2EC] text-[#2B182B] hover:border-[#E84F93] hover:text-[#E84F93] px-6"
            onClick={() => {
              setArtistPickerProcedure(null);
              setProcedureArtists([]);
              setProcedureArtistsError("");
              setAssigningProcedureArtistId("");
            }}
          >
            {language === "vi" ? "Đóng" : "Close"}
          </Button>,
        ]}
        centered
        width={800}
        title={
          <div className="flex items-center gap-2.5 text-[#2B182B] text-base font-bold border-b border-[#F3E2EC] pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#E84F93] text-white shadow-xs">
              <UserCheck size={16} />
            </div>
            <span>{artistPickerProcedure?.assignedArtistName ? language === "vi" ? "Thay Đổi Thợ Phân Công Bước" : "Change Assigned Artist" : language === "vi" ? "Chọn Thợ Phân Công Bước" : "Select Assigned Artist"}</span>
          </div>
        }
      >
        {artistPickerProcedure ? (
          <div className="space-y-5 py-2">
            <div className="rounded-2xl border border-[#F3D6E5] bg-gradient-to-r from-[#FFF0F6] to-[#F5F3FF] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#E84F93]">{language === "vi" ? "Bước Đang Chọn Phân Công" : "Procedure Selected"}</p>
              <h3 className="mt-1 text-base font-bold text-[#2B182B]">
                {artistPickerProcedure.procedureName}
              </h3>
              <p className="mt-1 text-xs font-bold text-[#8B5CF6]">
                {language === "vi" ? "Thợ hiện tại:" : "Current Artist:"} {artistPickerProcedure.assignedArtistName || (language === "vi" ? "Chưa phân công thợ nào" : "No artist assigned")}
              </p>
            </div>

            {isProcedureArtistsLoading ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#F3D6E5] bg-[#FFF9FB]">
                <LoaderCircle size={28} className="animate-spin text-[#E84F93]" />
                <p className="text-xs font-bold text-[#2B182B]">{language === "vi" ? "Đang tìm danh sách thợ khả dụng..." : "Finding available artists..."}</p>
              </div>
            ) : procedureArtistsError ? (
              <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-xs font-bold text-[#991B1B]">
                {procedureArtistsError}
              </div>
            ) : procedureArtists.length ? (
              <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
                {procedureArtists.map((artist) => {
                  const isSubmitting = assigningProcedureArtistId === artist.nailArtistId;
                  const canAssign = artist.isFree && artist.isQualified;

                  return (
                    <div
                      key={artist.nailArtistId}
                      className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 ${canAssign
                        ? "border-[#F3E2EC] bg-white hover:border-[#E84F93] hover:shadow-[0_8px_25px_rgba(232,79,147,0.12)]"
                        : "border-slate-100 bg-slate-50/70 opacity-75"
                        }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-xs ${canAssign
                            ? "bg-gradient-to-tr from-[#E84F93] via-[#D93B7D] to-[#8B5CF6]"
                            : "bg-slate-300"
                            }`}
                        >
                          {artist.name ? artist.name.charAt(0).toUpperCase() : "A"}
                        </div>

                        <h4 className="mt-3 text-sm font-bold text-[#2B182B] truncate w-full">
                          {artist.name}
                        </h4>

                        {/* Status Badges */}
                        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${artist.isFree
                              ? "bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]"
                              : "bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]"
                              }`}
                          >
                            {artist.isFree ? (language === "vi" ? "Rảnh" : "Free") : (language === "vi" ? "Đang bận" : "Busy")}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleAssignProcedureArtist(artistPickerProcedure, artist)}
                        disabled={isSubmitting || !canAssign}
                        className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold transition-all cursor-pointer ${canAssign
                          ? "bg-gradient-to-r from-[#E84F93] via-[#D93B7D] to-[#8B5CF6] text-white shadow-[0_4px_12px_rgba(232,79,147,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                      >
                        {isSubmitting ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : canAssign ? (
                          <UserCheck size={14} />
                        ) : null}
                        <span>
                          {canAssign
                            ? artistPickerProcedure.assignedArtistName
                              ? (language === "vi" ? "Chọn thợ này" : "Select this artist")
                              : (language === "vi" ? "Phân công" : "Assign")
                            : (language === "vi" ? "Thợ đang bận" : "Artist is busy")}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#F3D6E5] bg-[#FFF9FB] p-8 text-center text-xs font-bold text-[#9E8497]">
                {language === "vi" ? "Không có thợ nào khả dụng cho bước quy trình này." : "No available artists for this procedure step."}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <AssignReceptionistArtistModal
        open={isAssignArtistOpen}
        bookingId={booking?.bookingId || bookingId || ""}
        currentArtistName={booking?.artistName || ""}
        onClose={() => setIsAssignArtistOpen(false)}
        onAssigned={(updatedBooking) => {
          setBooking(updatedBooking);
          setIsAssignArtistOpen(false);
        }}
      />

      <Modal
        open={isQrOpen}
        onCancel={() => setIsQrOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsQrOpen(false)}>
            {language === "vi" ? "Đóng" : "Close"}
          </Button>,
        ]}
        centered
        title={language === "vi" ? "Mã QR Check-in Khách Hàng" : "Customer Check-In QR Code"}
      >
        <div className="flex flex-col items-center gap-4 py-2">
          {qrImageSrc ? (
            <img crossOrigin="anonymous"
              src={qrImageSrc}
              alt={`QR code for booking ${booking.bookingId}`}
              className="h-72 w-72 rounded-2xl border border-[#f4d6e2] bg-white p-3 object-contain"
            />
          ) : (
            <div className="rounded-2xl border border-[#f4d6e2] bg-[#fff7fb] px-6 py-10 text-center text-sm text-[#8f7b88]">
              {language === "vi" ? "Mã QR không khả dụng cho đơn đặt này." : "QR code not available for this booking."}
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-bold text-[#4a3741]">{customerDisplayName}</p>
            <p className="mt-1 text-xs text-[#a48796]">{booking.status || "Active booking"}</p>
          </div>
        </div>
      </Modal>
      <OnsiteAddonModal
        open={isOnsiteAddonModalOpen}
        onClose={() => setIsOnsiteAddonModalOpen(false)}
        bookingId={booking?.bookingId || bookingId || ""}
        booking={booking}
        onSuccess={() => {
          handleRefresh();
          setIsOnsiteAddonModalOpen(false);
        }}
      />
      <ProposeRescheduleModal
        open={isMoveScheduleOpen}
        onClose={() => setIsMoveScheduleOpen(false)}
        bookingId={booking?.bookingId || bookingId || ""}
        booking={booking}
        onSuccess={() => {
          handleRefresh();
          setIsMoveScheduleOpen(false);
        }}
      />
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
                  <p className="text-3xl font-extrabold text-[#E84F93] mb-2">{formatCurrency(selectedTransactionDetail.amount)}</p>
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

    </section>
  );
}
