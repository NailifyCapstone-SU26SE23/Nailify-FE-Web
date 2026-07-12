import { Button, Modal, Table } from "antd";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
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

function getProcedureStatusTone(status) {
  switch (String(status || "").trim().toLowerCase()) {
    case "completed":
      return "bg-[#e7f8ee] text-[#309e63]";
    case "inprogress":
    case "in progress":
      return "bg-[#efeafd] text-[#7c63d8]";
    case "pending":
    case "waiting":
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
          <span className="rounded-full border border-[#f4d6e2] bg-[#fff1f6] px-3 py-1 text-[10px] font-extrabold text-[#eb5b92]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// const ACTION_CENTER = [
//   {
//     label: "Check In",
//     subtitle: "Manual arrival check-in",
//     icon: SquareCheckBig,
//     cardTone: "bg-[linear-gradient(180deg,#fff1f6_0%,#ffe6f0_100%)]",
//     iconTone: "bg-[#ffdcea] text-[#eb5b92]",
//   },
//   {
//     label: "Start Service",
//     subtitle: "Begin session",
//     icon: Sparkles,
//     cardTone: "bg-[linear-gradient(180deg,#f2edff_0%,#e9e1ff_100%)]",
//     iconTone: "bg-[#dfd1ff] text-[#8160df]",
//   },
//   {
//     label: "Reassign Artist",
//     subtitle: "Change staff",
//     icon: UserRound,
//     cardTone: "bg-[linear-gradient(180deg,#fff8df_0%,#fff0bf_100%)]",
//     iconTone: "bg-[#ffe6a1] text-[#d8a01c]",
//   },
//   {
//     label: "Move Schedule",
//     subtitle: "Reschedule time",
//     icon: CalendarClock,
//     cardTone: "bg-[linear-gradient(180deg,#ebf7ff_0%,#dff1ff_100%)]",
//     iconTone: "bg-[#cfe8fb] text-[#4391c9]",
//   },
//   {
//     label: "Add Service",
//     subtitle: "Extra treatment",
//     icon: Sparkles,
//     cardTone: "bg-[linear-gradient(180deg,#e6f8ef_0%,#d8f2e5_100%)]",
//     iconTone: "bg-[#cdeedb] text-[#2da466]",
//   },
//   {
//     label: "Complete Booking",
//     subtitle: "Finalize session",
//     icon: CheckCircle2,
//     cardTone: "bg-[linear-gradient(180deg,#f2edff_0%,#ebe3ff_100%)]",
//     iconTone: "bg-[#ddd2ff] text-[#8260df]",
//   },
//   {
//     label: "Cancel Booking",
//     subtitle: "Void appointment",
//     icon: XCircle,
//     cardTone: "bg-[linear-gradient(180deg,#fff1f1_0%,#ffe9e9_100%)]",
//     iconTone: "bg-[#ffd8d8] text-[#ef6b6b]",
//   },
//   {
//     label: "Send Invoice",
//     subtitle: "Email to client",
//     icon: ReceiptText,
//     cardTone: "bg-[linear-gradient(180deg,#fff9eb_0%,#fff2cd_100%)]",
//     iconTone: "bg-[#ffe7ae] text-[#d19a15]",
//   },
// ];

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
        status,
        actionLabel: getServiceAction(status),
        sourceItem: item,
      };
    })
  ), [booking]);

  const totalAmount = formatCurrency(booking?.totalPrice);
  const discount = formatCurrency(booking?.discount);
  const depositPaid = "--";
  const remainingBalance = totalAmount;
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
    } catch (assignError) {
      const message =
        assignError instanceof Error ? assignError.message : "Failed to assign artist to procedure.";
      toast.error(message);
    } finally {
      setAssigningProcedureArtistId("");
    }
  }, []);

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
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to check in booking.";
      toast.error(message);
    } finally {
      setIsManualCheckInSubmitting(false);
    }
  }, [bookingId, isManualCheckInAllowed, isManualCheckInSubmitting]);

  const handleCheckout = useCallback(async () => {
    if (!bookingId || !actionAvailability.canCheckout || isCheckoutSubmitting) {
      return;
    }

    setIsCheckoutSubmitting(true);

    try {
      const updatedBooking = await checkoutReceptionistBooking(bookingId);
      setBooking(updatedBooking);
      toast.success("Checkout completed successfully.");
      navigate(getReceptionistBookingCheckoutRoute(bookingId), {
        state: {
          booking: updatedBooking,
          customerProfile,
        },
      });
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Failed to check out booking.";
      toast.error(message);
    } finally {
      setIsCheckoutSubmitting(false);
    }
  }, [actionAvailability.canCheckout, bookingId, customerProfile, isCheckoutSubmitting, navigate]);

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
            subtitle={booking.status || "Appointment details"}
            badge="Active Booking"
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
            title="Payment Summary"
            subtitle="Booking financial overview"
            badge="API Data"
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_250px]">
              <div>
                <div className="space-y-3 text-sm">
                  {[
                    ["Subtotal", totalAmount],
                    ["Discount", discount],
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

          {/* <DetailCard title="Internal Notes">
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
          </DetailCard> */}

          {/* <DetailCard title="Next Appointment">
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
          </DetailCard> */}
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
          <div className="space-y-5 py-1">
            {isSelectedRowNail ? (
              <div className="space-y-4">
                <div className="rounded-[18px] border border-[#f4d6e2] bg-[#fffafb] p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c38ea8]">
                    Nail Data
                  </p>
                  <div className="mt-4 space-y-3 text-sm">
                    {[
                      // ["Booking Item ID", selectedServiceRow.sourceItem?.bookingItemId || selectedServiceRow.id || "--"],
                      // ["Nail Variant ID", selectedServiceRow.sourceItem?.nailVariantId || "--"],
                      ["Nail Variant Name", selectedServiceRow.sourceItem?.nailVariantName || "--"],
                      // ["Customer Nail ID", selectedServiceRow.sourceItem?.customerNailId || "--"],
                      ["Customer Nail Name", selectedServiceRow.sourceItem?.customerNailName || "--"],
                      ["Display Name", selectedServiceRow.serviceType || "--"],
                      ["Duration", selectedServiceRow.duration || "--"],
                      ["Price", formatCurrency(selectedServiceRow.sourceItem?.price)],
                      ["Status", selectedServiceRow.status || "--"],
                      ["Artist", selectedServiceRow.artist || "--"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-4">
                        <span className="text-[#8f7b88]">{label}</span>
                        <span className="text-right font-bold text-[#4a3741]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[18px] border border-[#f4d6e2] bg-white p-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c38ea8]">
                      Nail Variant Image
                    </p>
                    <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-[18px] border border-dashed border-[#f1d8e4] bg-[#fffafb] p-3">
                      {sanitizeImageUrl(selectedServiceRow.sourceItem?.nailVariantImageUrl) ? (
                        <img crossOrigin="anonymous"
                          src={sanitizeImageUrl(selectedServiceRow.sourceItem?.nailVariantImageUrl)}
                          alt={selectedServiceRow.sourceItem?.nailVariantName || "Nail variant"}
                          className="max-h-[220px] rounded-2xl object-contain"
                        />
                      ) : (
                        <span className="text-sm text-[#a48796]">No nail variant image.</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[#f4d6e2] bg-white p-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c38ea8]">
                      Customer Nail Image
                    </p>
                    <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-[18px] border border-dashed border-[#f1d8e4] bg-[#fffafb] p-3">
                      {sanitizeImageUrl(selectedServiceRow.sourceItem?.customerNailImageUrl) ? (
                        <img crossOrigin="anonymous"
                          src={sanitizeImageUrl(selectedServiceRow.sourceItem?.customerNailImageUrl)}
                          alt={selectedServiceRow.sourceItem?.customerNailName || "Customer nail"}
                          className="max-h-[220px] rounded-2xl object-contain"
                        />
                      ) : (
                        <span className="text-sm text-[#a48796]">No customer nail image.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[18px] border border-[#f4d6e2] bg-[#fffafb] p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#c38ea8]">
                  Service Data
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    // ["Booking Item ID", selectedServiceRow.sourceItem?.bookingItemId || selectedServiceRow.id || "--"],
                    // ["Service ID", selectedServiceRow.sourceItem?.serviceId || "--"],
                    ["Service Name", selectedServiceRow.sourceItem?.serviceName || selectedServiceRow.service || "--"],
                    ["Duration", selectedServiceRow.duration || "--"],
                    ["Quantity", selectedServiceRow.sourceItem?.quantity ?? "--"],
                    ["Price", formatCurrency(selectedServiceRow.sourceItem?.price)],
                    ["Status", selectedServiceRow.status || "--"],
                    ["Artist", selectedServiceRow.artist || "--"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-4">
                      <span className="text-[#8f7b88]">{label}</span>
                      <span className="text-right font-bold text-[#4a3741]">{value}</span>
                    </div>
                  ))}
                </div>
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
              <div className="space-y-3">
                {bookingProcedures
                  .slice()
                  .sort((left, right) => (left?.stepOrder ?? 0) - (right?.stepOrder ?? 0))
                  .map((procedure) => (
                    <div
                      key={procedure.bookingProcedureId || `${procedure.procedureId}-${procedure.stepOrder}`}
                      className="rounded-[18px] border border-[#f4d6e2] bg-white p-4 shadow-[0_10px_22px_rgba(236,72,153,0.04)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#fff1f6] px-2.5 py-1 text-[10px] font-extrabold text-[#eb5b92]">
                              Step {procedure.stepOrder ?? "--"}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${getProcedureStatusTone(procedure.status)}`}>
                              {procedure.status || "--"}
                            </span>
                            {procedure.isMainStep ? (
                              <span className="rounded-full bg-[#efeafd] px-2.5 py-1 text-[10px] font-extrabold text-[#7c63d8]">
                                Main Step
                              </span>
                            ) : null}
                            {procedure.isRequired ? (
                              <span className="rounded-full bg-[#fff4cf] px-2.5 py-1 text-[10px] font-extrabold text-[#c89516]">
                                Required
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-base font-extrabold text-[#4a3741]">
                            {procedure.procedureName || "--"}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[#8f7b88]">
                            {procedure.description || "No procedure description available."}
                          </p>
                        </div>
                        <div className="grid gap-2 text-right text-xs text-[#8f7b88]">
                          <span>
                            {String(procedure.estimatedStartTime || "--").slice(0, 5)} - {String(procedure.estimatedEndTime || "--").slice(0, 5)}
                          </span>
                          <span className="font-bold text-[#4a3741]">
                            {formatDurationMinutes(procedure.duration || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl bg-[#fff7fb] px-3 py-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">
                            Assigned Artist
                          </p>
                          <div className="mt-1 flex items-start justify-between gap-3">
                            <p className="text-sm font-bold text-[#4a3741]">
                              {procedure.assignedArtistId ? (procedure.assignedArtistName || "Assigned") : "Unassigned"}
                            </p>
                            <button
                              type="button"
                              onClick={() => void handleOpenProcedureArtistPicker(procedure)}
                              className="shrink-0 rounded-full border border-[#f1d8e4] bg-white px-3 py-1 text-[10px] font-extrabold text-[#eb5b92] transition hover:border-[#eb5b92]"
                            >
                              {procedure.assignedArtistName ? "Reassign" : "Assign"}
                            </button>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-[#fff7fb] px-3 py-3 flex flex-col items-center justify-between gap-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">
                            Completed By
                          </p>
                          <p className="mt-1 text-[13px] font-bold text-[#4a3741]">
                            {procedure.completedByName || <span className="text-[#6c6c6c] px-3 py-1 border border-[#0a0909] rounded-2xl bg-gray-100 text-[13px] text-center">Not yet</span>}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#fff7fb] px-3 py-3 flex flex-col items-center justify-between gap-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">
                            Active / Passive
                          </p>
                          <p className="mt-1 text-[13px] font-bold text-[#4a3741]">
                            {procedure.activeDuration ?? 0}m / {procedure.passiveDuration ?? 0}m
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#fff7fb] px-3 py-3 flex flex-col items-center justify-between gap-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#c38ea8]">
                            Overlap
                          </p>
                          <p className="mt-1 text-[13px] font-bold text-[#4a3741]">
                            {procedure.canOverlap ? <span className="text-[#28a745] px-3 py-1 border border-[#28a745] rounded-2xl bg-green-100 text-[13px] text-center">Allowed</span> : <span className="text-[#6c6c6c] px-3 py-1 border border-[#0a0909] rounded-2xl bg-gray-100 text-[13px] text-center">Not Allowed</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
              <div className="space-y-3">
                {procedureArtists.map((artist) => {
                  const isSubmitting = assigningProcedureArtistId === artist.nailArtistId;

                  return (
                    <div
                      key={artist.nailArtistId || artist.name}
                      className="flex flex-col gap-3 rounded-[18px] border border-[#f4d6e2] bg-white p-4 shadow-[0_10px_22px_rgba(236,72,153,0.04)] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#4a3741]">{artist.name || "--"}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getProcedureArtistTone(artist.isFree, artist.isQualified)}`}>
                            {artist.isFree ? "Free" : "Busy"}
                          </span>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${artist.isQualified ? "border-[#cfead9] bg-[#f3fcf6] text-[#249a5c]" : "border-[#ffe2b5] bg-[#fff8ea] text-[#d59218]"}`}>
                            {artist.isQualified ? "Qualified" : "Not Qualified"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleAssignProcedureArtist(artistPickerProcedure, artist)}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-extrabold text-white shadow-[0_12px_24px_rgba(236,72,153,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? <LoaderCircle size={14} className="animate-spin" /> : null}
                        {artistPickerProcedure.assignedArtistName ? "Reassign" : "Assign"}
                      </button>
                    </div>
                  );
                })}
              </div>
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
