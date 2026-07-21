import { Button, Modal, Table, Descriptions, Image, Divider, Timeline, Card, Tag, Badge, List, Avatar } from "antd";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Eye,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ROUTES, getReceptionistBookingCheckoutRoute } from "../../../../shared/constants/routes";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";
import { AssignReceptionistArtistModal } from "../components/AssignReceptionistArtistModal";
import {
  checkoutReceptionistBooking,
  fetchReceptionistBookingDetail,
  fetchReceptionistBookingProcedures,
  fetchReceptionistProcedureAvailableArtists,
  fetchReceptionistCustomerDetail,
  manualCheckInReceptionistBooking,
  updateReceptionistProcedureArtist,
  getBookingHistories,
  getUserById,
} from "../services/receptionistBookingService";
import { createPayment } from "../../payments/services/receptionistPaymentService";
import dayjs from "dayjs";

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

function getServiceAction(status) {
  if (status === "In Progress") {
    return "Manage";
  }

  if (status === "Completed") {
    return "Edit";
  }

  return "View";
}

function getServiceActionItems(row, handleViewService, handleViewProcedures) {
  return [
    {
      key: `view-${row.id}`,
      label: "View",
      icon: Eye,
      onSelect: () => handleViewService(row),
    },
    {
      key: `view-procedures-${row.id}`,
      label: "View Procedures",
      icon: ClipboardList,
      className: "text-[#7c63d8]",
      onSelect: () => handleViewProcedures(row),
    },
  ];
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

  return ![
    "checkedin",
    "in progress",
    "inprogress",
    "completed",
    "servicecompleted",
    "cancelled",
  ].includes(normalizedStatus);
}

function normalizeBookingStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function getReceptionistActionAvailability(status) {
  const normalizedStatus = normalizeBookingStatus(status);

  return {
    canCheckIn: ["pending", "confirmed", "approved"].includes(normalizedStatus),
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
      className={`rounded-[24px] border border-[#f4d6e2] bg-white p-5 shadow-[0_14px_30px_rgba(236,72,153,0.05)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#4a3741]">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-[#a48796]">{subtitle}</p> : null}
        </div>
        {badge ? (
          // <span className="rounded-full border border-[#f4d6e2] bg-[#fff1f6] px-3 py-1 text-[10px] font-extrabold text-[#eb5b92]">
          //   {badge}
          // </span>
          <div className="flex items-center gap-2">
            <Tag className={`m-0 ${getStatusColor(badge)}`} style={{ padding: "5px 10px", borderRadius: "20px" }}>
              <Clock size={11} className="mr-1 inline-block fill-current" />
              {badge}
            </Tag>
          </div>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ReceptionistBookingDetailPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isAssignArtistOpen, setIsAssignArtistOpen] = useState(false);
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
        actorRole: roleMap[h.actorId] || (h.actorName?.includes("Khách") ? "Customer" : "Unknown")
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

        await loadBookingHistories();
      })();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [bookingId]);

  function addMinutes(time, minutes) {
    const [h, m, s] = time.split(":").map(Number);

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
  const customerInitials = getCustomerInitials(customerProfile, booking);
  const isSelectedRowNail = isNailBookingItem(selectedServiceRow?.sourceItem);

  const serviceRows = useMemo(() => (
    (booking?.bookingItems ?? []).map((item, index) => {
      const status = getServiceStatus(index, booking?.status);

      return {
        id: item.bookingItemId || `${item.serviceId || "service"}-${index}`,
        time: `${formatTime(booking?.startTime)} - ${addMinutes(
          booking?.startTime,
          item.duration
        )}`,
        service: item.serviceName,
        serviceType: item.nailVariantName || item.customerNailName || "--",
        artist: booking?.artistName || "--",
        duration: item.duration ? formatDurationMinutes(item.duration) : "--",
        price: item.price ? formatCurrency(item.price) : "--",
        status,
        actionLabel: getServiceAction(status),
        sourceItem: item,
      };
    })
  ), [booking]);

  const totalAmount = formatCurrency(booking?.totalPrice);
  const price = formatCurrency(booking?.price);
  const discount = formatCurrency(booking?.discount);
  const depositPaid = formatCurrency(booking?.amountPaid || 0);
  const remainingBalance = formatCurrency(booking?.amountDue || booking?.totalPrice - booking?.depositPaid);
  const progressPercent = getProgressPercent(booking);
  const isManualCheckInAllowed = canManualCheckIn(booking?.status);
  const actionAvailability = useMemo(
    () => getReceptionistActionAvailability(booking?.status),
    [booking?.status],
  );
  const primaryHeaderAction = actionAvailability.canCheckout ? "Checkout" : "Check In";
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
      toast.success("Booking detail refreshed.");
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
    toast.success(`${label} is ready for receptionist flow.`);
  }, []);

  const handleViewService = useCallback((row) => {
    setSelectedServiceRow(row);
  }, []);

  const handleViewProcedures = useCallback(async (row) => {
    const bookingItemId = String(row?.sourceItem?.bookingItemId || "").trim();

    if (!bookingItemId) {
      toast.error("Booking item ID is not available for this service.");
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
      toast.error("Booking procedure ID is not available.");
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
      toast.error("Artist assignment data is incomplete.");
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
          ? "Procedure artist reassigned successfully."
          : "Procedure artist assigned successfully.",
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
      title: "Time",
      dataIndex: "time",
      key: "time",
      render: (value) => <span className="text-xs font-bold text-[#eb5b92]">{value}</span>,
    },
    {
      title: "Service",
      key: "service",
      render: (_, row) => (
        <div>
          <p className="text-xs font-bold text-[#4a3741]">{row.service ? row.service : `Nail service: ${row.serviceType}`}</p>
        </div>
      ),
    },
    {
      title: "Nail Artist",
      key: "artist",
      render: (_, row) => (
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
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      render: (value) => <span className="text-xs text-[#4a3741]">{value}</span>,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (value) => <span className="text-xs font-bold text-green-700">{value}</span>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, row) => (
        <ActionDropdown
          items={getServiceActionItems(row, handleViewService, handleViewProcedures)}
          buttonClassName={getActionTone("View")}
          label="Actions"
        />
      ),
    },
  ]), [handleViewProcedures, handleViewService]);

  const handleManualCheckIn = useCallback(async () => {
    if (!bookingId || !isManualCheckInAllowed || isManualCheckInSubmitting) {
      return;
    }

    setIsManualCheckInSubmitting(true);

    try {
      const updatedBooking = await manualCheckInReceptionistBooking(bookingId);
      setBooking(updatedBooking);
      toast.success("Customer checked in successfully.");
      await loadBookingHistories();
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to check in booking.";
      toast.error(message);
    } finally {
      setIsManualCheckInSubmitting(false);
    }
  }, [bookingId, isManualCheckInAllowed, isManualCheckInSubmitting, loadBookingHistories]);

  // const handleCheckout = useCallback(async () => {
  //     if (!bookingId || !actionAvailability.canCheckout) {
  //       return;
  //     }

  //     try {
  //       const response = await createPayment(bookingId);
  //       const paymentUrl = response?.data?.paymentUrl || response?.paymentUrl;

  //       if (paymentUrl) {
  //         window.location.href = paymentUrl;
  //       } else {
  //         toast.error("Payment link not found.");
  //       }
  //     } catch (err) {
  //       toast.error(err instanceof Error ? err.message : "An error occurred while creating payment.");
  //     }
  //   }, [actionAvailability.canCheckout, bookingId]);

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
        label: actionAvailability.canCheckout ? "Checkout" : "Check In",
        subtitle: actionAvailability.canCheckout ? "Collect payment and finalize" : "Manual arrival check-in",
        icon: actionAvailability.canCheckout ? CreditCard : SquareCheckBig,
        cardTone: "bg-[linear-gradient(180deg,#fff1f6_0%,#ffe6f0_100%)]",
        iconTone: "bg-[#ffdcea] text-[#eb5b92]",
        disabled: !(actionAvailability.canCheckIn || actionAvailability.canCheckout),
        loading:
          actionAvailability.canCheckout ? isCheckoutSubmitting : isManualCheckInSubmitting,
        onClick: () => void handlePrimaryHeaderAction(),
      },
      {
        label: "Start Service",
        subtitle: "Begin session",
        icon: Sparkles,
        cardTone: "bg-[linear-gradient(180deg,#f2edff_0%,#e9e1ff_100%)]",
        iconTone: "bg-[#dfd1ff] text-[#8160df]",
        disabled: !actionAvailability.canStartService,
        onClick: () => handleMockAction("Start Service"),
      },
      {
        label: "Reassign Artist",
        subtitle: "Change staff",
        icon: UserRound,
        cardTone: "bg-[linear-gradient(180deg,#fff8df_0%,#fff0bf_100%)]",
        iconTone: "bg-[#ffe6a1] text-[#d8a01c]",
        disabled: !actionAvailability.canReassignArtist,
        onClick: () => setIsAssignArtistOpen(true),
      },
      {
        label: "Move Schedule",
        subtitle: "Reschedule time",
        icon: CalendarClock,
        cardTone: "bg-[linear-gradient(180deg,#ebf7ff_0%,#dff1ff_100%)]",
        iconTone: "bg-[#cfe8fb] text-[#4391c9]",
        disabled: !actionAvailability.canMoveSchedule,
        onClick: () => handleMockAction("Move Schedule"),
      },
      {
        label: "Add Service",
        subtitle: "Extra treatment",
        icon: Sparkles,
        cardTone: "bg-[linear-gradient(180deg,#e6f8ef_0%,#d8f2e5_100%)]",
        iconTone: "bg-[#cdeedb] text-[#2da466]",
        disabled: !actionAvailability.canAddService,
        onClick: () => handleMockAction("Add Service"),
      },
      {
        label: "Complete Booking",
        subtitle: "Finalize session",
        icon: CheckCircle2,
        cardTone: "bg-[linear-gradient(180deg,#f2edff_0%,#ebe3ff_100%)]",
        iconTone: "bg-[#ddd2ff] text-[#8260df]",
        disabled: !actionAvailability.canCompleteBooking,
        onClick: () => handleMockAction("Complete Booking"),
      },
      {
        label: "Cancel Booking",
        subtitle: "Void appointment",
        icon: XCircle,
        cardTone: "bg-[linear-gradient(180deg,#fff1f1_0%,#ffe9e9_100%)]",
        iconTone: "bg-[#ffd8d8] text-[#ef6b6b]",
        disabled: !actionAvailability.canCancelBooking,
        onClick: () => handleMockAction("Cancel Booking"),
      },
      {
        label: "Send Invoice",
        subtitle: "Email to client",
        icon: ReceiptText,
        cardTone: "bg-[linear-gradient(180deg,#fff9eb_0%,#fff2cd_100%)]",
        iconTone: "bg-[#ffe7ae] text-[#d19a15]",
        disabled: !actionAvailability.canSendInvoice,
        onClick: () => handleMockAction("Send Invoice"),
      },
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
              onClick={() => void handlePrimaryHeaderAction()}
              disabled={isPrimaryHeaderActionDisabled}
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_300px]">
        <div className="space-y-4">
          <DetailCard
            title="Customer Overview"
            badge={booking.status || null}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-1 items-start gap-4">
                <div className="relative">
                  {customerProfile?.avatarUrl ? (
                    <img crossOrigin="anonymous"
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMockAction("Call Customer")}
                  title="Call Customer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff1f6] p-4 text-xs font-bold text-[#eb5b92]"
                >
                  <Phone size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMockAction("Send Message")}
                  title="Send Message"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f2edff] p-4 text-xs font-bold text-[#7b68c8]"
                >
                  <MessageCircleMore size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMockAction("View History")}
                  title="View History"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff4cf] p-4 text-xs font-bold text-[#c89516]"
                >
                  <Sparkles size={14} />

                </button>
              </div>
            </div>
          </DetailCard>

          <DetailCard
            title="Appointment Details"
            subtitle="Today's scheduled services"
            badge={`${serviceRows.length || 0} Services`}
          >
            <Table
              rowKey="id"
              columns={serviceColumns}
              dataSource={serviceRows}
              pagination={false}
              scroll={{ x: 860 }}
              locale={{ emptyText: "No appointment services available." }}
            />
          </DetailCard>

          <DetailCard
            title="Booking Timeline"
            subtitle="History of actions on this booking"
            badge={isBookingHistoriesLoading ? "Loading..." : `${bookingHistories.length} Events`}
          >
            {isBookingHistoriesLoading ? (
              <div className="flex justify-center p-8"><LoaderCircle className="animate-spin text-[#eb5b92]" /></div>
            ) : bookingHistories.length > 0 ? (
              <div className="mt-6 flex flex-col">
                {[...bookingHistories].reverse().map((history, idx) => (
                  <div key={history.bookingHistoryId || idx} className="flex gap-6" title={dayjs(history.createdAt).format("DD/MM/YYYY HH:mm")}>
                    <div className="w-[130px] shrink-0 pt-0.5 text-right">
                      <span className="text-xs font-bold text-orange-500">
                        {dayjs(history.createdAt).format("DD/MM/YYYY")}
                      </span>
                      <span className="mx-1 text-gray-400">|</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {dayjs(history.createdAt).format("HH:mm")}
                      </span>
                    </div>

                    <div className="relative flex flex-col items-center">
                      <div className="h-[10px] w-[10px] mt-1.5 rounded-full border-2 border-[#eb5b92] bg-white z-10 shrink-0" />
                      {idx !== bookingHistories.length - 1 && (
                        <div className="w-[2px] h-full bg-[#f0f0f0] absolute top-3" />
                      )}
                    </div>

                    <div className="flex-1 pb-6 text-sm">
                      {(() => {
                        let roleText = history.actorRole;
                        if (history.actorRole === "Customer") roleText = "Khách Hàng";
                        else if (history.actorRole === "Manager") roleText = "Quản lý";
                        else if (history.actorRole === "Receptionist") roleText = "Lễ tân";
                        else if (history.actorRole === "Staff_Artist" || history.actorRole === "Artist") roleText = "Nhân viên";
                        else if (history.actorRole === "System") roleText = "Hệ thống";

                        let payload = history.payload || "";
                        payload = payload.replace(/\s?Mã QR \(Base64\) đã được khởi tạo\./g, "");

                        if (payload.startsWith("Quản lý Salon ")) {
                          payload = payload.replace("Quản lý Salon ", "");
                        }
                        if (payload === "Khách hàng đã check-in." || payload === "Khách hàng đã check-in") {
                          payload = "làm check-in cho khách.";
                        }
                        if (payload.startsWith("Đơn đặt lịch được tạo thành công")) {
                          payload = payload.replace("Đơn đặt lịch", "làm Đơn đặt lịch");
                        }
                        if (payload.startsWith("Check-in thành công")) {
                          payload = payload.replace("Check-in thành công", "làm Check-in thành công");
                        }
                        if (payload.startsWith("Thợ nail đã ")) {
                          payload = payload.replace("Thợ nail đã ", "");
                        }
                        if (payload.startsWith("Thợ làm móng ")) {
                          payload = payload.replace("Thợ làm móng ", "");
                        }
                        if (payload.includes("Khách hàng đã thanh toán hóa đơn và hoàn thành thủ tục check-out")) {
                          payload = "làm thủ tục thanh toán và check-out cho khách.";
                        }
                        if (payload.includes("Đơn đặt lịch được cập nhật.")) {
                          payload = payload.replace("Đơn đặt lịch được cập nhật.", "làm Đơn đặt lịch được cập nhật.");
                        }

                        const urlRegex = /(https?:\/\/[^\s]+)/g;
                        let imageUrl = null;
                        const match = payload.match(urlRegex);
                        if (match) {
                          imageUrl = match[0];
                          payload = payload.replace(urlRegex, "").trim();
                        }

                        return (
                          <>
                            <p className="text-[#8f7b88] leading-relaxed">
                              <span className="">
                                {roleText}
                              </span>{" "}
                              <span className="font-extrabold text-[#eb5b92]">
                                "{history.actorName}"
                              </span>{" "}
                              đã {payload}
                            </p>
                            {imageUrl && (
                              <div className="mt-3">
                                <Image
                                  crossOrigin="anonymous"
                                  src={imageUrl}
                                  alt="Hình ảnh"
                                  className="h-24 w-24 rounded-lg border border-gray-200 object-cover shadow-sm"
                                  style={{
                                    height: "48px", width: "48px"
                                  }}
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
              <div className="rounded-[18px] border border-dashed border-[#f1d8e4] bg-[#fffafb] px-4 py-8 text-center text-sm text-[#8f7b88]">
                No history events found for this booking.
              </div>
            )}
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
                    ["Price", price],
                    ["Discount", discount],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-[#8f7b88]">{label}</span>
                      <span
                        className={`font-bold ${label === "Discount"
                          ? "text-red-500"
                          : "text-[#4a3741]"
                          }`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-[#f3d7e2] pt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[#8f7b88]">Deposit Paid</span>
                    <span className="text-sm font-bold text-[#4a3741]">{depositPaid}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[#8f7b88]">Remaining Balance</span>
                    <span className="text-sm font-extrabold text-[#eb5b92]">{remainingBalance}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-[#4a3741]">Total Amount</p>
                  <p className="text-[1.8rem] font-black leading-none text-green-700">{totalAmount}</p>
                </div>

                {/* <div className="mt-4 h-2 rounded-full bg-[#f6d6e3]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#eb5b92_0%,#f4869f_100%)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div> */}
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleMockAction("Add Payment")}
                  disabled={!actionAvailability.canAddPayment}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#cf3d82_0%,#ef5b92_100%)] px-4 py-3 text-xs font-extrabold text-white shadow-[0_12px_24px_rgba(235,91,146,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard size={14} />
                  Add Payment
                </button>
                <button
                  type="button"
                  onClick={() => handleMockAction("Print Receipt")}
                  disabled={!actionAvailability.canPrintReceipt}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#f3d7e2] bg-[#fff3f8] px-4 py-3 text-xs font-extrabold text-[#eb5b92] disabled:cursor-not-allowed disabled:opacity-60"
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
              {receptionistActionCenterItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    disabled={item.disabled || item.loading}
                    className={`rounded-[18px] border border-[#f0d8e2] px-4 py-4 text-center shadow-[0_10px_22px_rgba(236,72,153,0.04)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${item.cardTone}`}
                  >
                    <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconTone}`}>
                      {item.loading ? <LoaderCircle size={18} className="animate-spin" /> : <Icon size={18} />}
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
                ["Check-in Time", ["CheckedIn", "In Progress", "ServiceCompleted", "Completed"].includes(String(booking.status || "")) ? formatTime(booking.startTime) : "--"],
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

        </aside>
      </div>

      <Modal
        open={Boolean(selectedServiceRow)}
        onCancel={() => setSelectedServiceRow(null)}
        footer={[
          <Button key="close-service-view" onClick={() => setSelectedServiceRow(null)}>
            Close
          </Button>,
        ]}
        centered
        width={760}
        title="Service & Nail Detail"
      >
        {selectedServiceRow ? (
          <div className="space-y-6 py-2">
            {isSelectedRowNail ? (
              <div className="space-y-6">
                <div className="rounded-[24px] border border-[#f4d6e2] bg-[#fffafb] p-6 shadow-sm">
                  <Descriptions
                    title={<span className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#eb5b92]">Nail Data</span>}
                    bordered
                    column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                    size="middle"
                    labelStyle={{ fontWeight: "bold", color: "#000000ff", backgroundColor: "#fff5f8" }}
                    contentStyle={{ color: "#4c4448ff", backgroundColor: "white", fontWeight: "500" }}
                  >
                    <Descriptions.Item label="Nail Variant Name">{selectedServiceRow.sourceItem?.nailVariantName || "--"}</Descriptions.Item>
                    <Descriptions.Item label="Customer Nail Name">{selectedServiceRow.sourceItem?.customerNailName || "--"}</Descriptions.Item>
                    <Descriptions.Item label="Display Name">{selectedServiceRow.serviceType || "--"}</Descriptions.Item>
                    <Descriptions.Item label="Duration">{selectedServiceRow.duration || "--"}</Descriptions.Item>
                    <Descriptions.Item label="Price"><span className="text-green-700 font-bold">{formatCurrency(selectedServiceRow.sourceItem?.price)}</span></Descriptions.Item>
                    <Descriptions.Item label="Artist">{selectedServiceRow.artist || "--"}</Descriptions.Item>
                  </Descriptions>
                </div>

                {(sanitizeImageUrl(selectedServiceRow.sourceItem?.nailVariantImageUrl) || sanitizeImageUrl(selectedServiceRow.sourceItem?.customerNailImageUrl)) && (
                  <div>
                    <Divider orientation="left" className="!text-[#c38ea8] !text-[12px] !font-extrabold uppercase tracking-[0.16em] !border-[#f4d6e2]">
                      Attached Images
                    </Divider>
                    <div className="flex flex-wrap items-start justify-center gap-8">
                      {sanitizeImageUrl(selectedServiceRow.sourceItem?.nailVariantImageUrl) && (
                        <div className="flex flex-col items-center gap-3">
                          <span className="rounded-full bg-[#fff1f6] px-4 py-1 text-[11px] font-extrabold text-[#eb5b92] shadow-sm">
                            Nail Variant
                          </span>
                          <div className="overflow-hidden rounded-[20px] border-4 border-white shadow-[0_12px_24px_rgba(236,72,153,0.12)]">
                            <Image
                              src={sanitizeImageUrl(selectedServiceRow.sourceItem?.nailVariantImageUrl)}
                              alt="Nail Variant"
                              height={240}
                              className="object-cover"
                              crossOrigin="anonymous"
                            />
                          </div>
                        </div>
                      )}
                      {sanitizeImageUrl(selectedServiceRow.sourceItem?.customerNailImageUrl) && (
                        <div className="flex flex-col items-center gap-3">
                          <span className="rounded-full bg-[#f2edff] px-4 py-1 text-[11px] font-extrabold text-[#7c63d8] shadow-sm">
                            Customer Nail
                          </span>
                          <div className="overflow-hidden rounded-[20px] border-4 border-white shadow-[0_12px_24px_rgba(124,99,216,0.12)]">
                            <Image
                              src={sanitizeImageUrl(selectedServiceRow.sourceItem?.customerNailImageUrl)}
                              alt="Customer Nail"
                              height={240}
                              className="object-cover"
                              crossOrigin="anonymous"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[24px] border border-[#f4d6e2] bg-[#fffafb] p-6 shadow-sm">
                <Descriptions
                  title={<span className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#eb5b92]">Service Data</span>}
                  bordered
                  column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                  size="middle"
                  labelStyle={{ fontWeight: "bold", color: "#8f7b88", backgroundColor: "#fff5f8" }}
                  contentStyle={{ color: "#4a3741", backgroundColor: "white", fontWeight: "500" }}
                >
                  <Descriptions.Item label="Service Name" span={2}>{selectedServiceRow.sourceItem?.serviceName || selectedServiceRow.service || "--"}</Descriptions.Item>
                  <Descriptions.Item label="Duration">{selectedServiceRow.duration || "--"}</Descriptions.Item>
                  <Descriptions.Item label="Quantity">{selectedServiceRow.sourceItem?.quantity ?? "--"}</Descriptions.Item>
                  <Descriptions.Item label="Price"><span className="text-[#eb5b92] font-bold">{formatCurrency(selectedServiceRow.sourceItem?.price)}</span></Descriptions.Item>
                  <Descriptions.Item label="Artist">{selectedServiceRow.artist || "--"}</Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        ) : null}
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
            onClick={() => {
              setSelectedProcedureRow(null);
              setBookingProcedures([]);
              setProceduresError("");
              setArtistPickerProcedure(null);
              setProcedureArtists([]);
              setProcedureArtistsError("");
            }}
          >
            Close
          </Button>,
        ]}
        centered
        width={920}
        title="Booking Procedures"
      >
        {selectedProcedureRow ? (
          <div className="space-y-5 py-1">
            <div className="rounded-[18px] border border-[#f4d6e2] bg-[#fffafb] p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c38ea8]">
                    Service
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-[#4a3741]">
                    {selectedProcedureRow.sourceItem?.serviceName || selectedProcedureRow.service || selectedProcedureRow.sourceItem?.nailVariantName || selectedProcedureRow.serviceType || selectedProcedureRow.sourceItem?.customerNailName || "--"}
                  </p>

                </div>
                <div className="grid gap-2 text-right text-sm">
                  <div>
                    <span className="text-[#8f7b88]">Duration: </span>
                    <span className="font-bold text-[#4a3741]">{selectedProcedureRow.duration || "--"}</span>
                  </div>
                  <div>
                    <span className="text-[#8f7b88]">Quantity: </span>
                    <span className="font-bold text-[#4a3741]">{selectedProcedureRow.sourceItem?.quantity ?? "--"}</span>
                  </div>
                </div>
              </div>
            </div>

            {isProceduresLoading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-[18px] border border-dashed border-[#f1d8e4] bg-[#fffafb]">
                <div className="flex items-center gap-3 text-sm font-bold text-[#eb5b92]">
                  <LoaderCircle size={18} className="animate-spin" />
                  Loading procedures...
                </div>
              </div>
            ) : proceduresError ? (
              <div className="rounded-[18px] border border-[#f8d3dc] bg-[#fff5f7] px-4 py-5 text-sm text-[#c9587e]">
                {proceduresError}
              </div>
            ) : bookingProcedures.length ? (
              <div className="mt-8 ml-[90px] pr-4">
                <Timeline
                  items={bookingProcedures
                    .slice()
                    .sort((left, right) => (left?.stepOrder ?? 0) - (right?.stepOrder ?? 0))
                    .map((procedure) => {
                      let dotColor = "gray";
                      if (procedure.status === "Completed") dotColor = "green";
                      else if (procedure.status === "In Progress" || procedure.status === "InProgress") dotColor = "blue";
                      else if (procedure.status === "Pending") dotColor = "orange";
                      else if (procedure.status === "Cancelled") dotColor = "red";

                      return {
                        color: dotColor,
                        children: (
                          <div className="relative">
                            <div className="absolute top-0 right-[calc(100%+28px)] text-right whitespace-nowrap">
                              <span className="block text-[13px] font-bold text-[#4a3741]">
                                {String(procedure.estimatedStartTime || "--").slice(0, 5)} - {String(procedure.estimatedEndTime || "--").slice(0, 5)}
                              </span>
                              <span className="block text-[11px] font-bold text-[#eb5b92] mt-1">
                                {formatDurationMinutes(procedure.duration || 0)}
                              </span>
                            </div>
                            <Card
                              size="small"
                              bordered={false}
                              className="shadow-[0_8px_20px_rgba(236,72,153,0.06)] border border-[#f4d6e2] !rounded-[18px] !rounded-tl-none mb-6 w-full"
                              styles={{ body: { padding: '16px' } }}
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                  <div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      <Tag color="magenta" className="rounded-full font-bold m-0 border-[#f4d6e2]">Step {procedure.stepOrder ?? "--"}</Tag>
                                      <Tag color={dotColor} className="rounded-full font-bold uppercase m-0">{procedure.status || "--"}</Tag>
                                      {procedure.isMainStep && <Tag color="purple" className="rounded-full font-bold m-0">Main Step</Tag>}
                                      {procedure.isRequired && <Tag color="gold" className="rounded-full font-bold m-0">Required</Tag>}
                                    </div>
                                    <h4 className="text-[15px] font-extrabold text-[#4a3741] m-0 leading-snug">{procedure.procedureName || "--"}</h4>

                                  </div>
                                </div>

                                <div className="bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)] rounded-xl p-3 flex flex-wrap justify-between items-center gap-3 mt-2 border border-[#fdf2f7]">
                                  <div className="flex flex-col gap-1 min-w-[130px]">
                                    <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">Artist</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[12px] font-bold text-[#4a3741] truncate max-w-[80px]" title={procedure.assignedArtistId ? (procedure.assignedArtistName || "Assigned") : "Unassigned"}>
                                        {procedure.assignedArtistId ? (procedure.assignedArtistName || "Assigned") : "Unassigned"}
                                      </span>
                                      <Button
                                        type="primary"
                                        size="small"
                                        shape="round"
                                        icon={procedure.assignedArtistName ? <RefreshCcw size={10} /> : <UserRound size={10} />}
                                        style={{
                                          background: procedure.assignedArtistName ? '#f4d6e2' : 'linear-gradient(to right, #eb5b92, #ff7eb3)',
                                          color: procedure.assignedArtistName ? '#c38ea8' : '#fff',
                                          border: 'none',
                                          boxShadow: '0 2px 4px rgba(236,91,146,0.2)'
                                        }}
                                        className="!text-[10px] !font-bold !h-6 !px-3 hover:scale-105 transition-transform hover:opacity-90 flex items-center justify-center"
                                        onClick={() => void handleOpenProcedureArtistPicker(procedure)}
                                      >
                                        {procedure.assignedArtistName ? "Reassign" : "Assign"}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1 text-center min-w-[90px]">
                                    <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">Time (Act)</span>
                                    <span className="text-[12px] font-bold text-[#4a3741]">
                                      {procedure.startTime ? String(procedure.startTime).split('T').pop().slice(0, 5) : "--:--"} - {procedure.completedAt ? String(procedure.completedAt).split('T').pop().slice(0, 5) : "--:--"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-1 text-center min-w-[90px]">
                                    <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">Completed By</span>
                                    <span className="text-[12px] font-bold text-[#4a3741]">
                                      {procedure.completedByName || <span className="text-[#a48796] italic text-[11px]">Not yet</span>}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-1 text-center min-w-[70px]">
                                    <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">Act / Pass</span>
                                    <span className="text-[12px] font-bold text-[#4a3741]">{procedure.activeDuration ?? 0}m / {procedure.passiveDuration ?? 0}m</span>
                                  </div>
                                  <div className="flex flex-col gap-1 text-center min-w-[60px]">
                                    <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">Overlap</span>
                                    <span className="text-[12px]">
                                      {procedure.canOverlap ? <Badge status="success" text={<span className="font-bold text-[#28a745]">Yes</span>} /> : <Badge status="default" text={<span className="font-bold text-[#6c6c6c]">No</span>} />}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </div>
                        )
                      };
                    })}
                />
              </div>
            ) : (
              <div className="rounded-[18px] border border-dashed border-[#f1d8e4] bg-[#fffafb] px-4 py-8 text-center text-sm text-[#8f7b88]">
                No procedures found for this booking item.
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
            onClick={() => {
              setArtistPickerProcedure(null);
              setProcedureArtists([]);
              setProcedureArtistsError("");
              setAssigningProcedureArtistId("");
            }}
          >
            Close
          </Button>,
        ]}
        centered
        width={760}
        title={artistPickerProcedure?.assignedArtistName ? "Reassign Procedure Artist" : "Assign Procedure Artist"}
      >
        {artistPickerProcedure ? (
          <div className="space-y-4 py-1">
            <div className="rounded-[18px] border border-[#f4d6e2] bg-[#fffafb] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c38ea8]">
                Procedure
              </p>
              <p className="mt-2 text-lg font-extrabold text-[#4a3741]">
                {artistPickerProcedure.procedureName || "--"}
              </p>
              <p className="mt-1 text-sm text-[#8f7b88]">
                Current artist: {artistPickerProcedure.assignedArtistName || "Not assigned yet"}
              </p>
            </div>

            {isProcedureArtistsLoading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-[18px] border border-dashed border-[#f1d8e4] bg-[#fffafb]">
                <div className="flex items-center gap-3 text-sm font-bold text-[#eb5b92]">
                  <LoaderCircle size={18} className="animate-spin" />
                  Loading available artists...
                </div>
              </div>
            ) : procedureArtistsError ? (
              <div className="rounded-[18px] border border-[#f8d3dc] bg-[#fff5f7] px-4 py-5 text-sm text-[#c9587e]">
                {procedureArtistsError}
              </div>
            ) : procedureArtists.length ? (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 3 }}
                dataSource={procedureArtists}
                renderItem={(artist) => {
                  const isSubmitting = assigningProcedureArtistId === artist.nailArtistId;

                  return (
                    <List.Item>
                      <Card
                        hoverable
                        className={`overflow-hidden border-2 transition-all duration-300 rounded-[18px] ${artist.isQualified && artist.isFree ? 'border-[#f4d6e2] hover:border-[#eb5b92] shadow-sm hover:shadow-md' : 'border-[#fdf2f7] opacity-80'}`}
                        styles={{ body: { padding: '16px' } }}
                      >
                        <div className="flex flex-col items-center text-center">
                          <Avatar
                            size={56}
                            style={{
                              backgroundColor: artist.isFree && artist.isQualified ? '#eb5b92' : '#d9d9d9',
                              color: '#fff',
                              fontSize: '20px',
                              fontWeight: 'bold',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                            }}
                          >
                            {artist.name ? artist.name.charAt(0).toUpperCase() : 'A'}
                          </Avatar>
                          <h4 className="mt-3 text-[14px] font-extrabold text-[#4a3741] truncate w-full">{artist.name || "--"}</h4>

                          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                            <Tag
                              color={artist.isFree ? "green" : "red"}
                              className="m-0 rounded-full text-[9px] font-bold"
                            >
                              {artist.isFree ? "Free" : "Busy"}
                            </Tag>
                            <Tag color={artist.isQualified ? "blue" : "orange"} className="rounded-full text-[9px] font-bold m-0">
                              {artist.isQualified ? "Qualified" : "Not Qual."}
                            </Tag>
                          </div>

                          <Button
                            type="primary"
                            shape="round"
                            block
                            style={{
                              background:
                                artist.isFree && artist.isQualified
                                  ? "linear-gradient(to right, #eb5b92, #ff7eb3)"
                                  : "#f4d6e2",
                              color:
                                artist.isFree && artist.isQualified
                                  ? "#fff"
                                  : "#c38ea8",
                              border: "none",
                              boxShadow:
                                artist.isFree && artist.isQualified
                                  ? "0 4px 10px rgba(236,91,146,0.3)"
                                  : "none",
                            }}
                            className="mt-4 h-8 text-[11px] font-bold transition-transform hover:scale-105"
                            onClick={() => void handleAssignProcedureArtist(artistPickerProcedure, artist)}
                            loading={isSubmitting}
                            disabled={
                              isSubmitting || !artist.isFree || !artist.isQualified
                            }
                          >
                            {artist.isFree && artist.isQualified
                              ? artistPickerProcedure.assignedArtistName
                                ? "Reassign"
                                : "Assign"
                              : "Can't Assign"}
                          </Button>
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <div className="rounded-[18px] border border-dashed border-[#f1d8e4] bg-[#fffafb] px-4 py-8 text-center text-sm text-[#8f7b88]">
                No available artists found for this procedure.
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
            Close
          </Button>,
        ]}
        centered
        title="Customer Check-In QR Code"
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
              QR code not available for this booking.
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-bold text-[#4a3741]">{customerDisplayName}</p>
            <p className="mt-1 text-xs text-[#a48796]">{booking.status || "Active booking"}</p>
          </div>
        </div>
      </Modal>
    </section>
  );
}
