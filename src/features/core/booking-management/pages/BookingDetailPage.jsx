import { CalendarClock, LoaderCircle, PencilLine, RefreshCcw, Save, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { BookingFormFields } from "../components/BookingFormFields";
import { BookingHeroCard } from "../components/BookingHeroCard";
import { BookingSnapshotCard } from "../components/BookingSnapshotCard";
import { StaffBookingConsultationDetail } from "../../../staff/bookings/components/StaffBookingConsultationDetail";
import { ExtraServiceModal } from "../../../staff/bookings/components/ExtraServiceModal";
import {
  BOOKING_ROLE_CONFIG,
  getMockBookingById,
} from "../services/mockBookings";
import { getBookingRoleFromPath } from "../utils/bookingMapper";
import { ROLES } from "../../../../shared/constants/roles";
import {
  getStaffBookingDesignStudioRoute,
  getStaffBookingServiceSessionRoute,
} from "../../../../shared/constants/routes";
import { confirmCurrentDesign, confirmCustomerNail, setActiveBooking } from "../../../../store/bookingSlice";
import {
  buildStaffServiceSessionPayload,
  fetchServiceCatalog,
  fetchStaffBookingDetail,
  fetchStaffCustomerNailDetail,
  fetchStaffCustomerDetail,
  fetchStaffNailVariantDetail,
  formatBookingCode,
  formatCurrency,
  formatTimeValue,
  updateStaffBooking,
} from "../../../staff/bookings/services/staffBookingService";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80";
const DEFAULT_DESIGN_IMAGE =
  "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=600&q=80";
const DEFAULT_UPLOAD_IMAGE =
  "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=240&q=80";

function formatStaffDate(value) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatAppointmentEndTime(startTime, durationMinutes) {
  const normalizedStartTime = String(startTime || "").trim();
  const normalizedDuration = Number(durationMinutes || 0);

  if (!normalizedStartTime) {
    return "--";
  }

  const [hoursText = "0", minutesText = "0"] = normalizedStartTime.split(":");
  const baseDate = new Date();
  baseDate.setHours(Number(hoursText), Number(minutesText), 0, 0);

  if (Number.isNaN(baseDate.getTime())) {
    return "--";
  }

  const endDate = new Date(baseDate.getTime() + Math.max(0, normalizedDuration) * 60000);

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(endDate);
}

function formatTimeRange(startTime, durationMinutes) {
  const appointmentStartTime = formatTimeValue(startTime);
  const appointmentEndTime = formatAppointmentEndTime(startTime, durationMinutes);

  if (appointmentStartTime === "--" || appointmentEndTime === "--") {
    return "--";
  }

  return `${appointmentStartTime} - ${appointmentEndTime}`;
}

function normalizeBookingText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeBookingItemDuration(value) {
  const duration = Number(value || 0);

  if (!Number.isFinite(duration) || duration <= 0) {
    return "--";
  }

  return formatDurationMinutes(duration);
}

function getUniqueBookingLabels(values) {
  return [...new Set(values.map(normalizeBookingText).filter(Boolean))];
}

function getPrimaryNailVariantId(bookingItems) {
  const matchedItem = (Array.isArray(bookingItems) ? bookingItems : []).find((item) => {
    const variantId = Number(item?.nailVariantId || 0);
    return Number.isInteger(variantId) && variantId > 0;
  });

  return Number(matchedItem?.nailVariantId || 0);
}

function getPrimaryCustomerNailId(bookingItems) {
  const matchedItem = (Array.isArray(bookingItems) ? bookingItems : []).find((item) => {
    const customerNailId = Number(item?.customerNailId || 0);
    return Number.isInteger(customerNailId) && customerNailId > 0;
  });

  return Number(matchedItem?.customerNailId || 0);
}

function buildDefaultStaffNotes(booking) {
  const serviceNames = getUniqueBookingLabels(
    (booking?.bookingItems ?? []).map((item) => item?.serviceName),
  ).join(", ");

  return [
    {
      label: "Customer Requests",
      value: booking?.bookingItems?.find((item) => item.customerNailName)?.customerNailName || "No customer note from API.",
    },
    {
      label: "Design Adjustments",
      value: booking?.bookingItems?.find((item) => item.nailVariantName)?.nailVariantName || "Capture final design adjustments during consultation.",
    },
    {
      label: "Notes Before Service",
      value: serviceNames || "Verify services, confirm timing, then start session.",
    },
  ];
}

function buildStaffExperienceFromBooking(
  booking,
  staffNotesDraft,
  nailVariantDetail,
  customerNailDetail,
  customerDetail,
) {
  const items = booking?.bookingItems ?? [];
  const normalizedItems = items.map((item) => ({
    ...item,
    serviceName: normalizeBookingText(item?.serviceName),
    nailVariantName: normalizeBookingText(item?.nailVariantName),
    customerNailName: normalizeBookingText(item?.customerNailName),
    nailVariantImageUrl: normalizeBookingText(item?.nailVariantImageUrl),
    customerNailImageUrl: normalizeBookingText(item?.customerNailImageUrl),
  }));
  const mainItem = normalizedItems[0] ?? null;
  const primaryDesignItem =
    normalizedItems.find(
      (item) =>
        item.customerNailName ||
        item.nailVariantName ||
        item.nailVariantImageUrl ||
        item.customerNailImageUrl,
    ) ?? mainItem;
  const bookingCode = formatBookingCode(booking?.bookingId);
  const startTime = formatTimeValue(booking?.startTime);
  const totalDuration = booking?.totalDuration ? formatDurationMinutes(booking.totalDuration) : "--";
  const timeRange = formatTimeRange(booking?.startTime, booking?.totalDuration);
  const serviceNames = getUniqueBookingLabels(normalizedItems.map((item) => item.serviceName));
  const variantNames = getUniqueBookingLabels(normalizedItems.map((item) => item.nailVariantName));
  const customerDesignNames = getUniqueBookingLabels(normalizedItems.map((item) => item.customerNailName));
  const bookingServiceEntries = normalizedItems
    .map((item, index) => {
      const name = item.serviceName || "";
      const nailServiceName = item.nailVariantName || item.customerNailName || "";

      if (!name && !nailServiceName) {
        return null;
      }

      const displayName = name || nailServiceName;

      return {
        id: String(item?.bookingItemId || item?.id || `${displayName}-${index}`),
        name: displayName,
        nailServiceName,
        duration: normalizeBookingItemDuration(item?.duration || item?.serviceDuration),
      };
    })
    .filter(Boolean);
  const selectedItemLabels = bookingServiceEntries.map((item) => item.name);
  const primaryServiceLabel =
    serviceNames[0] ||
    variantNames[0] ||
    customerDesignNames[0] ||
    "--";
  const fullSelectionSummary =
    selectedItemLabels.length > 0 ? selectedItemLabels.join("\n") : primaryServiceLabel;
  const serviceSummary = serviceNames.length ? serviceNames.join(", ") : "--";
  const resolvedDesignDetail = customerNailDetail || nailVariantDetail;
  const detailType = resolvedDesignDetail?.detailType || (customerNailDetail ? "customerNail" : "variant");
  const resolvedShape =
    customerNailDetail?.nailShape ||
    customerNailDetail?.basedOnNailVariant?.nailShape ||
    nailVariantDetail?.nailShape ||
    null;
  const resolvedSurface =
    customerNailDetail?.nailSurface ||
    customerNailDetail?.basedOnNailVariant?.nailSurface ||
    nailVariantDetail?.nailSurface ||
    null;
  const resolvedComponents =
    detailType === "customerNail"
      ? customerNailDetail?.customerNailComponents?.length
        ? customerNailDetail.customerNailComponents
        : customerNailDetail?.basedOnNailVariant?.nailComponents || []
      : nailVariantDetail?.nailComponents || [];
  const designImage =
    customerNailDetail?.imageUrl ||
    nailVariantDetail?.imageUrl ||
    primaryDesignItem?.nailVariantImageUrl ||
    primaryDesignItem?.customerNailImageUrl ||
    booking?.checkInImageUrl ||
    booking?.checkOutImagesUrl ||
    DEFAULT_DESIGN_IMAGE;
  const requestedDesign =
    customerDesignNames[0] ||
    variantNames[0] ||
    "Selected design not specified";
  const resolvedVariantName =
    resolvedDesignDetail?.name || customerDesignNames[0] || variantNames[0] || "--";
  const resolvedDesignImage = resolvedDesignDetail?.imageUrl || designImage;
  const hasCustomerNailSelected = Boolean(
    normalizedItems.some((item) => Number(item?.customerNailId || 0) > 0),
  );
  const componentSummary = resolvedComponents?.length
    ? resolvedComponents
      .map((item) => item?.component?.name)
      .filter(Boolean)
      .join(", ") || `${resolvedComponents.length} component(s)`
    : "--";
  const customerDisplayName =
    customerDetail?.fullName ||
    booking?.customerName ||
    "--";
  const customerPhone = customerDetail?.phone || "--";
  const customerAvatar = customerDetail?.avatarUrl || DEFAULT_AVATAR;
  const customerMemberTier = customerDetail?.role || "Customer";
  const customerStatus = customerDetail?.status || booking?.status || "--";

  return {
    bookingCode,
    statusLabel: booking?.status || "Pending",
    artistInitials: (booking?.artistName || "A")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
    customer: {
      name: customerDisplayName,
      phone: customerPhone,
      avatar: customerAvatar,
      memberTier: customerMemberTier,
      facts: [
        { label: "Salon", value: booking?.salonName || "--" },
        { label: "Total Services", value: String(items.length || 0) },
        { label: "Status", value: customerStatus },
      ],
      allergyNote: customerDetail?.email || "--",
      preferences: requestedDesign || "--",
    },
    bookingInfo: [
      {
        label: "Service",
        value: fullSelectionSummary,
        note: selectedItemLabels.length > 1 ? "Selected services in this booking." : requestedDesign,
        services: bookingServiceEntries,
      },
      {
        label: "Appointment",
        value: startTime,
        note: formatStaffDate(booking?.bookingDate),
      },
      {
        label: "Duration",
        value: timeRange,
        note: totalDuration,
      },
      {
        label: "Total Price",
        value: formatCurrency(booking?.totalPrice),
        // note: `Status: ${booking?.status || "--"}`,
        tone: "success",
      },
      {
        label: "Salon",
        value: booking?.salonName || "--",
        // note: `${selectedItemLabels.length || 0} selected item(s)`,
      },
      {
        label: "Staff Artist",
        value: booking?.artistName || "--",
        // note: serviceSummary,
      },
    ],
    design: {
      name: resolvedDesignDetail?.name || requestedDesign,
      image: resolvedDesignImage,
      details: [
        { label: "Service", value: serviceSummary },
        { label: "Variant", value: resolvedVariantName },
        { label: "Shape", value: resolvedShape?.name || "--" },
        { label: "Surface", value: resolvedSurface?.name || "--" },
        { label: "Customer Design", value: customerDesignNames[0] || "--" },
        { label: "Duration", value: timeRange },
        { label: "Price", value: formatCurrency(booking?.totalPrice) },
        { label: "Components", value: componentSummary },
      ],
      tags: [
        { label: booking?.status || "Pending", className: "border-[#f4cada] bg-[#fff6fa] text-[#ea4f93]" },
        { label: booking?.salonName || "Salon", className: "border-[#d8cbff] bg-[#f6f2ff] text-[#8c63ef]" },
      ],
      variantDetail: resolvedDesignDetail
        ? {
          ...resolvedDesignDetail,
          detailType,
          imageUrl: resolvedDesignImage,
          name: resolvedDesignDetail.name || requestedDesign,
          nailVariantId:
            resolvedDesignDetail.nailVariantId ||
            customerNailDetail?.basedOnNailVariantId ||
            customerNailDetail?.customerNailId ||
            0,
          nailDesignId:
            resolvedDesignDetail.nailDesignId ||
            customerNailDetail?.basedOnNailVariant?.nailDesignId ||
            0,
          colorJson:
            resolvedDesignDetail.colorJson ||
            customerNailDetail?.customColor ||
            "",
          nailShape: resolvedShape,
          nailSurface: resolvedSurface,
          nailComponents: resolvedComponents,
        }
        : null,
    },
    sessionStatus: [
      { label: "Status", value: booking?.status || "--" },
      { label: "Staff Artist", value: booking?.artistName || "--" },
      { label: "Salon", value: booking?.salonName || "--" },
      { label: "Time Slot", value: timeRange },
    ],
    customerHistory: {
      favoriteStyles: serviceNames.length
        ? serviceNames.slice(0, 3).map((label, index) => ({
          label,
          className: [
            "border-[#f4cada] bg-[#fff6fa] text-[#ea4f93]",
            "border-[#d8cbff] bg-[#f6f2ff] text-[#8c63ef]",
            "border-[#cbe0ff] bg-[#f1f7ff] text-[#4b80e0]",
          ][index % 3],
        }))
        : [{ label: "--", className: "border-[#f0d8e3] bg-white text-[#6f5c6b]" }],
      previousShapes: variantNames[0] || "--",
      lastUpload: {
        title: primaryDesignItem?.customerNailName || primaryDesignItem?.nailVariantName || "Reference unavailable",
        date: formatStaffDate(booking?.bookingDate),
        image:
          primaryDesignItem?.customerNailImageUrl ||
          primaryDesignItem?.nailVariantImageUrl ||
          DEFAULT_UPLOAD_IMAGE,
      },
    },
    suggestedDesigns: (normalizedItems.length
      ? normalizedItems
      : [{ serviceName: "--", nailVariantName: "--", customerNailImageUrl: DEFAULT_DESIGN_IMAGE }])
      .slice(0, 3)
      .map((item) => ({
        name: item.customerNailName || item.nailVariantName || item.serviceName || "--",
        meta: `${item.serviceName || "--"} | ${item.duration ? formatDurationMinutes(item.duration) : "--"}`,
        image: item.nailVariantImageUrl || item.customerNailImageUrl || DEFAULT_DESIGN_IMAGE,
    })),
    staffNotes: staffNotesDraft,
    checklist: [
      { label: "Booking detail loaded from API", checked: true },
      { label: "Current nail design confirmed", checked: false },
      ...(hasCustomerNailSelected ? [{ label: "Customer nail confirmed", checked: false }] : []),
      { label: "Artist assigned to booking", checked: Boolean(booking?.artistName) },
      {
        label: "Customer design reference available",
        checked: Boolean(primaryDesignItem?.customerNailImageUrl || primaryDesignItem?.nailVariantImageUrl),
      },
      { label: "Service items captured", checked: items.length > 0 },
    ],
  };
}

function normalizeStaffBookingStatus(value) {
  return String(value || "").trim().toLowerCase();
}

export function BookingDetailPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const role = useMemo(
    () => getBookingRoleFromPath(location.pathname),
    [location.pathname],
  );
  const roleConfig = BOOKING_ROLE_CONFIG[role];
  const isStaffRole = role === ROLES.staff;
  const normalizedBookingId = String(bookingId || "").trim();
  const initialBooking = isStaffRole ? null : getMockBookingById(bookingId);
  const [formValues, setFormValues] = useState(initialBooking);
  const [flashMessage, setFlashMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [staffBookingDetail, setStaffBookingDetail] = useState(null);
  const [staffCustomerDetail, setStaffCustomerDetail] = useState(null);
  const [staffNailVariantDetail, setStaffNailVariantDetail] = useState(null);
  const [staffCustomerNailDetail, setStaffCustomerNailDetail] = useState(null);
  const [isStaffLoading, setIsStaffLoading] = useState(isStaffRole);
  const [staffLoadError, setStaffLoadError] = useState("");
  const [staffNotesDraft, setStaffNotesDraft] = useState([]);
  const [showUpdateBookingModal, setShowUpdateBookingModal] = useState(false);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [serviceCatalogMeta, setServiceCatalogMeta] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalItems: 0,
    hasPrevious: false,
    hasNext: false,
    firstRowOnPage: 0,
    lastRowOnPage: 0,
  });
  const [serviceCatalogPage, setServiceCatalogPage] = useState(1);
  const [serviceSearchInput, setServiceSearchInput] = useState("");
  const [serviceSearchKeyword, setServiceSearchKeyword] = useState("");
  const [selectedExtraServiceIds, setSelectedExtraServiceIds] = useState([]);
  const [isLoadingServiceCatalog, setIsLoadingServiceCatalog] = useState(false);
  const [isSavingExtraService, setIsSavingExtraService] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(
    role !== ROLES.staff && Boolean(location.state?.requestDelete),
  );
  const isCurrentDesignConfirmed = useSelector((state) => (
    Boolean(state.booking.designConfirmations?.[normalizedBookingId])
  ));
  const isCustomerNailConfirmed = useSelector((state) => (
    Boolean(state.booking.customerNailConfirmations?.[normalizedBookingId])
  ));
  const staffActionMessage = useMemo(() => {
    const action = location.state?.staffAction;

    if (!isStaffRole || !action) {
      return "";
    }

    return {
      complete: "Review the checklist before marking this service done.",
      delete: "Use Back to Queue if you want to leave this booking.",
      notes: "Staff notes are ready for review.",
      start: "Confirm the design and proceed to service when ready.",
    }[action] ?? "";
  }, [isStaffRole, location.state]);
  const deleteRequested = role !== ROLES.staff && Boolean(location.state?.requestDelete);
  const normalizedStaffBookingStatus = normalizeStaffBookingStatus(staffBookingDetail?.status);
  const hasServiceStarted = ["inprogress", "servicecompleted", "completed"].includes(
    normalizedStaffBookingStatus,
  );
  const isServiceCompleted = ["servicecompleted", "completed"].includes(normalizedStaffBookingStatus);
  const isServiceInProgress = hasServiceStarted && !isServiceCompleted;
  const hasCustomerNailSelection = Boolean(getPrimaryCustomerNailId(staffBookingDetail?.bookingItems));
  const requiresCustomerNailConfirmation = hasCustomerNailSelection;
  const isBookingReadyForService =
    requiresCustomerNailConfirmation ? isCustomerNailConfirmed : isCurrentDesignConfirmed;
  const effectiveDesignConfirmed = isBookingReadyForService || hasServiceStarted;

  useEffect(() => {
    if (!staffActionMessage && !deleteRequested) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [deleteRequested, location.pathname, navigate, staffActionMessage]);

  useEffect(() => {
    if (!isStaffRole || !normalizedBookingId) {
      return;
    }

    dispatch(setActiveBooking(normalizedBookingId));
  }, [dispatch, isStaffRole, normalizedBookingId]);

  useEffect(() => {
    if (!isStaffRole || !bookingId) {
      return;
    }

    let isMounted = true;

    const loadBooking = async () => {
      setIsStaffLoading(true);
      setStaffLoadError("");

      try {
        const data = await fetchStaffBookingDetail(bookingId);

        if (!isMounted) {
          return;
        }

        setStaffBookingDetail(data);
        setStaffNotesDraft(buildDefaultStaffNotes(data));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to load booking detail.";
        setStaffLoadError(message);
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsStaffLoading(false);
        }
      }
    };

    void loadBooking();

    return () => {
      isMounted = false;
    };
  }, [bookingId, isStaffRole]);

  useEffect(() => {
    if (!isStaffRole) {
      return;
    }

    const customerId = String(staffBookingDetail?.customerId || "").trim();
    let isMounted = true;

    const loadCustomerDetail = async () => {
      if (!customerId) {
        if (isMounted) {
          setStaffCustomerDetail(null);
        }
        return;
      }

      try {
        const detail = await fetchStaffCustomerDetail(customerId);

        if (isMounted) {
          setStaffCustomerDetail(detail);
        }
      } catch {
        if (isMounted) {
          setStaffCustomerDetail(null);
        }
      }
    };

    void loadCustomerDetail();

    return () => {
      isMounted = false;
    };
  }, [isStaffRole, staffBookingDetail?.customerId]);

  useEffect(() => {
    if (!isStaffRole) {
      return;
    }

    const customerNailId = getPrimaryCustomerNailId(staffBookingDetail?.bookingItems);
    let isMounted = true;

    const loadCustomerNailDetail = async () => {
      if (!Number.isInteger(customerNailId) || customerNailId <= 0) {
        if (isMounted) {
          setStaffCustomerNailDetail(null);
        }
        return;
      }

      try {
        const detail = await fetchStaffCustomerNailDetail(customerNailId);

        if (isMounted) {
          setStaffCustomerNailDetail(detail);
        }
      } catch {
        if (isMounted) {
          setStaffCustomerNailDetail(null);
        }
      }
    };

    void loadCustomerNailDetail();

    return () => {
      isMounted = false;
    };
  }, [isStaffRole, staffBookingDetail?.bookingItems]);

  useEffect(() => {
    if (!isStaffRole) {
      return;
    }

    const variantId = getPrimaryNailVariantId(staffBookingDetail?.bookingItems);
    let isMounted = true;

    const loadNailVariantDetail = async () => {
      if (!Number.isInteger(variantId) || variantId <= 0) {
        if (isMounted) {
          setStaffNailVariantDetail(null);
        }
        return;
      }

      try {
        const detail = await fetchStaffNailVariantDetail(variantId);

        if (isMounted) {
          setStaffNailVariantDetail(detail);
        }
      } catch {
        if (isMounted) {
          setStaffNailVariantDetail(null);
        }
      }
    };

    void loadNailVariantDetail();

    return () => {
      isMounted = false;
    };
  }, [isStaffRole, staffBookingDetail?.bookingItems]);

  useEffect(() => {
    if (!showUpdateBookingModal) {
      return undefined;
    }

    let isMounted = true;

    const loadServiceCatalog = async () => {
      setIsLoadingServiceCatalog(true);

      try {
        const response = await fetchServiceCatalog({
          pageNumber: serviceCatalogPage,
          pageSize: 10,
          name: serviceSearchKeyword.trim() || undefined,
        });

        if (!isMounted) {
          return;
        }

        setServiceCatalog(response.items);
        setServiceCatalogMeta(response.metaData ?? {
          currentPage: serviceCatalogPage,
          totalPages: 1,
          pageSize: 10,
          totalItems: 0,
          hasPrevious: false,
          hasNext: false,
          firstRowOnPage: 0,
          lastRowOnPage: 0,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setServiceCatalog([]);
        setServiceCatalogMeta({
          currentPage: serviceCatalogPage,
          totalPages: 1,
          pageSize: 10,
          totalItems: 0,
          hasPrevious: false,
          hasNext: false,
          firstRowOnPage: 0,
          lastRowOnPage: 0,
        });
        const message = error instanceof Error ? error.message : "Failed to load services.";
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoadingServiceCatalog(false);
        }
      }
    };

    void loadServiceCatalog();

    return () => {
      isMounted = false;
    };
  }, [serviceCatalogPage, serviceSearchKeyword, showUpdateBookingModal]);

  if (!isStaffRole && !initialBooking) {
    return <Navigate to={roleConfig.listRoute} replace />;
  }

  const handleChange = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSave = () => {
    setShowSaveConfirm(false);
    setIsEditing(false);
    setFlashMessage(
      isStaffRole
        ? "Booking detail updates are stored in the current UI session."
        : "Mock update completed. Changes are local to this booking detail screen.",
    );
  };

  const handleStartEdit = () => {
    setFlashMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setShowCancelConfirm(false);
    setFormValues(initialBooking);
    setFlashMessage("");
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    navigate(roleConfig.listRoute, {
      state: {
        flashMessage: isStaffRole
          ? `Returned ${staffBookingDetail?.customerName || "this booking"} to the queue.`
          : `Mock delete completed for ${formValues.customerName || formValues.id}.`,
      },
    });
  };

  const handleOpenDesignStudio = () => {
    navigate(getStaffBookingDesignStudioRoute(bookingId), {
      state: {
        designStudio: {
          booking: {
            id: bookingId,
          },
          bookingCode: staffBookingDetail ? formatBookingCode(staffBookingDetail.bookingId) : "",
          customerName: staffBookingDetail?.customerName || formValues?.customerName || "--",
          staffName: staffBookingDetail?.artistName || "--",
          statusLabel: staffBookingDetail?.status || "Pending",
          selectedDesignName:
            staffBookingDetail?.bookingItems?.[0]?.customerNailName ||
            staffBookingDetail?.bookingItems?.[0]?.nailVariantName ||
            staffBookingDetail?.bookingItems?.[0]?.serviceName ||
            "--",
          selectedDesignImage:
            staffBookingDetail?.bookingItems?.[0]?.customerNailImageUrl ||
            staffBookingDetail?.checkInImageUrl ||
            staffBookingDetail?.checkOutImagesUrl ||
            DEFAULT_DESIGN_IMAGE,
          totalDuration: staffBookingDetail?.totalDuration || 0,
        },
      },
    });
  };

  const handleConfirmCurrentDesign = () => {
    if (requiresCustomerNailConfirmation || isCurrentDesignConfirmed) {
      return;
    }

    dispatch(confirmCurrentDesign(normalizedBookingId));
    setFlashMessage("Current nail design has been confirmed for this booking.");
    toast.success("Current design confirmed for this booking.");
  };

  const handleConfirmCustomerNail = () => {
    if (!requiresCustomerNailConfirmation || isCustomerNailConfirmed) {
      return;
    }

    dispatch(confirmCustomerNail(normalizedBookingId));
    setFlashMessage("Customer nail has been confirmed for this booking.");
    toast.success("Customer nail confirmed for this booking.");
  };

  const handleChooseAnotherDesign = () => {
    handleOpenDesignStudio();
  };

  const handleStaffNoteChange = (label, value) => {
    setStaffNotesDraft((current) => current.map((item) => (
      item.label === label ? { ...item, value } : item
    )));
  };

  const handleOpenUpdateBooking = () => {
    setSelectedExtraServiceIds([]);
    setServiceSearchInput("");
    setServiceSearchKeyword("");
    setServiceCatalogPage(1);
    setShowUpdateBookingModal(true);
    setFlashMessage("");
  };

  const handleCloseUpdateBooking = () => {
    if (isSavingExtraService) {
      return;
    }

    setShowUpdateBookingModal(false);
  };

  const handleSearchExtraServices = (event) => {
    event.preventDefault();
    setServiceCatalogPage(1);
    setSelectedExtraServiceIds([]);
    setServiceSearchKeyword(serviceSearchInput.trim());
  };

  const handleAddExtraService = async () => {
    const normalizedBookingId = String(bookingId || "").trim();
    const normalizedServiceIds = selectedExtraServiceIds
      .map((serviceId) => String(serviceId || "").trim())
      .filter(Boolean);

    if (!normalizedBookingId || normalizedServiceIds.length === 0 || !staffBookingDetail || isSavingExtraService) {
      return;
    }

    setIsSavingExtraService(true);

    try {
      const bookingItems = Array.isArray(staffBookingDetail.bookingItems) ? staffBookingDetail.bookingItems : [];
      const toNullableNumber = (value) => {
        if (value === null || value === undefined || value === "") {
          return null;
        }

        const normalizedValue = Number(value);
        return Number.isFinite(normalizedValue) && normalizedValue > 0 ? normalizedValue : null;
      };

      const payloadBookingItems = [
        ...bookingItems.map((item) => ({
          nailVariantId: toNullableNumber(item?.nailVariantId),
          serviceId: String(item?.serviceId || "").trim() || null,
          customerNailId: toNullableNumber(item?.customerNailId),
          quantity: Number(item?.quantity || 1) || 1,
        })),
        ...normalizedServiceIds.map((serviceId) => ({
          nailVariantId: null,
          serviceId,
          customerNailId: null,
          quantity: 1,
        })),
      ];

      const updatedBooking = await updateStaffBooking(normalizedBookingId, {
        bookingDate: staffBookingDetail.bookingDate,
        startTime: staffBookingDetail.startTime,
        nailArtistId: staffBookingDetail.nailArtistId || staffBookingDetail.artistId || null,
        bookingItems: payloadBookingItems,
      });

      setStaffBookingDetail(updatedBooking);
      setShowUpdateBookingModal(false);
      setSelectedExtraServiceIds([]);

      const addedServices = serviceCatalog.filter((item) => normalizedServiceIds.includes(item.serviceId));
      const addedServiceNames = addedServices.map((item) => item.name).filter(Boolean);
      const message = addedServiceNames.length
        ? `${addedServiceNames.join(", ")} ${addedServiceNames.length > 1 ? "have" : "has"} been added to this booking.`
        : "Extra services have been added to this booking.";

      setFlashMessage(message);
      toast.success(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update booking services.";
      toast.error(message);
    } finally {
      setIsSavingExtraService(false);
    }
  };

  if (isStaffRole) {
    if (isStaffLoading) {
      return (
        <section className="flex min-h-[50vh] items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
          <div className="flex items-center gap-3 text-sm font-medium text-[#b38a9f]">
            <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
            Loading booking detail...
          </div>
        </section>
      );
    }

    if (staffLoadError || !staffBookingDetail) {
      return (
        <section className="rounded-[24px] border border-[#f6d8e5] bg-white p-6 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
          <p className="text-lg font-extrabold text-[#412643]">Booking detail unavailable</p>
          <p className="mt-2 text-sm text-[#b38a9f]">{staffLoadError || "This booking could not be loaded."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-full border border-[#f3cade] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <RefreshCcw size={14} />
              Retry
            </button>
            <button
              type="button"
              onClick={() => navigate(roleConfig.listRoute)}
              className="inline-flex items-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
            >
              Back to bookings
            </button>
          </div>
        </section>
      );
    }

    const baseStaffExperience = buildStaffExperienceFromBooking(
      staffBookingDetail,
      staffNotesDraft,
      staffNailVariantDetail,
      staffCustomerNailDetail,
      staffCustomerDetail,
    );
    const staffExperience = !requiresCustomerNailConfirmation && isCurrentDesignConfirmed
      ? {
        ...baseStaffExperience,
        design: {
          ...baseStaffExperience.design,
          tags: [
            ...baseStaffExperience.design.tags,
            {
              label: "Confirmed",
              className: "border-[#cdeedb] bg-[#eefcf4] text-[#16975f]",
            },
          ],
        },
        checklist: baseStaffExperience.checklist.map((item) => (
          item.label === "Current nail design confirmed" ? { ...item, checked: true } : item
        )),
      }
      : baseStaffExperience;
    const staffExperienceWithCustomerNail = requiresCustomerNailConfirmation
      ? {
        ...staffExperience,
        checklist: staffExperience.checklist.map((item) => (
          item.label === "Customer nail confirmed"
            ? { ...item, checked: isCustomerNailConfirmed || hasServiceStarted }
            : item
        )),
      }
      : staffExperience;
    const resolvedStaffExperience = effectiveDesignConfirmed
      ? {
        ...staffExperienceWithCustomerNail,
        design: {
          ...staffExperienceWithCustomerNail.design,
          tags: [
            ...staffExperienceWithCustomerNail.design.tags.filter((tag) => tag.label !== "Confirmed" && tag.label !== "Completed"),
            {
              label: isServiceCompleted ? "Completed" : "Confirmed",
              className: isServiceCompleted
                ? "border-[#cde8f8] bg-[#eef7ff] text-[#327adf]"
                : "border-[#cdeedb] bg-[#eefcf4] text-[#16975f]",
            },
          ],
        },
      }
      : staffExperienceWithCustomerNail;

  const handleOpenServiceSession = () => {
    if (!isBookingReadyForService && !hasServiceStarted) {
      toast.error(
        hasCustomerNailSelection
          ? "Confirm current nail before starting the service session."
          : "Confirm Current Design before starting the service session.",
      );
      return;
    }

      navigate(getStaffBookingServiceSessionRoute(bookingId), {
        state: {
          serviceSession: {
            ...buildStaffServiceSessionPayload(staffBookingDetail, {
              backRoute: location.pathname,
              designUpdateRoute: getStaffBookingDesignStudioRoute(bookingId),
            }),
            started: hasServiceStarted,
            completed: isServiceCompleted,
          },
        },
      });
    };

    return (
      <>
        {flashMessage || staffActionMessage ? (
          <div className="rounded-[22px] bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f] shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
            {staffActionMessage || flashMessage}
          </div>
        ) : null}
        <StaffBookingConsultationDetail
          data={resolvedStaffExperience}
          isCurrentDesignConfirmed={
            requiresCustomerNailConfirmation
              ? false
              : isCurrentDesignConfirmed || hasServiceStarted
          }
          isCustomerNailConfirmed={isCustomerNailConfirmed || hasServiceStarted}
          requiresCustomerNailConfirmation={requiresCustomerNailConfirmation}
          isServiceInProgress={isServiceInProgress}
          isServiceCompleted={isServiceCompleted}
          onChooseAnotherDesign={handleChooseAnotherDesign}
          onConfirmCurrentDesign={handleConfirmCurrentDesign}
          onConfirmCustomerNail={handleConfirmCustomerNail}
          onDelete={handleDelete}
          onOpenDesignStudio={handleOpenDesignStudio}
          onOpenUpdateBooking={handleOpenUpdateBooking}
          onStaffNoteChange={handleStaffNoteChange}
          onStartServiceSession={() => void handleOpenServiceSession()}
        />
        <ExtraServiceModal
          open={showUpdateBookingModal}
          services={serviceCatalog}
          selectedServiceIds={selectedExtraServiceIds}
          searchValue={serviceSearchInput}
          isLoading={isLoadingServiceCatalog}
          isSaving={isSavingExtraService}
          meta={serviceCatalogMeta}
          onClose={handleCloseUpdateBooking}
          onSearchChange={(event) => setServiceSearchInput(event.target.value)}
          onSearchSubmit={handleSearchExtraServices}
          onSelect={(serviceId) =>
            setSelectedExtraServiceIds((current) =>
              current.includes(serviceId)
                ? current.filter((item) => item !== serviceId)
                : [...current, serviceId],
            )
          }
          onPageChange={(page) => {
            if (page < 1 || page > (serviceCatalogMeta?.totalPages ?? 1)) {
              return;
            }

            setSelectedExtraServiceIds([]);
            setServiceCatalogPage(page);
          }}
          onConfirm={handleAddExtraService}
          title="Update Booking Services"
          description="Select extra services to add into the current booking before starting the service session."
        />
      </>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-4">
      <BookingHeroCard
        backLabel="Back to booking list"
        backTo={roleConfig.listRoute}
        badge={roleConfig.detailBadge}
        title={formValues.customerName}
        description={roleConfig.detailDescription}
        panelIcon={<CalendarClock size={18} className="text-[#d45b9f]" />}
        panelTitle={isEditing ? "Edit mode" : "View mode"}
        panelDescription="All actions here are UI-only and do not persist outside this feature."
      />

      {flashMessage || staffActionMessage ? (
        <div className="rounded-[22px] bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f] shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
          {staffActionMessage || flashMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_34px_rgba(94,76,62,0.06)] sm:p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <BookingFormFields
              formValues={formValues}
              onFieldChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowSaveConfirm(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
                >
                  <Save size={16} />
                  <span>Save changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff5ef] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#ffe9d7] sm:w-auto"
                >
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
              >
                <PencilLine size={16} />
                <span>Edit booking</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f5] px-5 py-3 text-sm font-semibold text-[#d14c84] transition hover:bg-[#ffe1ec] sm:w-auto"
            >
              <Trash2 size={16} />
              <span>Delete booking</span>
            </button>
          </div>
        </article>

        <BookingSnapshotCard
          formValues={formValues}
          notice="This is mock CRUD only. Save and delete actions update the UI flow, but they do not persist data outside this screen."
        />
      </div>

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title="Save Booking Changes"
        subtitle="This will update the appointment in the current mock booking flow."
        description="Confirm to apply the latest edits to this booking."
        confirmText="Save Changes"
        cancelText="Review Again"
        confirmIcon={Save}
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
        highlights={[formValues.customerName || "Booking detail", formValues.service || "Service pending", formValues.branch || "Branch pending"]}
        details={[
          { label: "Appointment Date", value: formValues.date || "No date selected" },
          { label: "Appointment Time", value: formValues.time || "No time selected" },
        ]}
        warnings={["This mock update changes the UI flow only and does not persist outside this screen."]}
      />

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title="Discard Booking Edits"
        subtitle="You are about to leave edit mode without saving."
        description="Unsaved updates to this booking will be discarded."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        confirmIcon={X}
        onConfirm={handleCancelEdit}
        onCancel={() => setShowCancelConfirm(false)}
        details={[
          { label: "Editing Mode", value: "Booking detail" },
          { label: "Result", value: "Revert to last loaded values" },
        ]}
        warnings={["Any unsaved changes to customer, service, and schedule details will be lost."]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title="Delete Booking"
        subtitle="This will remove the booking from the current mock booking flow."
        description={`You are about to delete ${formValues.customerName || "this booking"}. This action cannot be undone.`}
        confirmText="Delete Booking"
        cancelText="Keep Booking"
        confirmIcon={Trash2}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        item={{
          title: formValues.customerName || "Booking record",
          meta: `${formValues.service || "Service pending"} • ${formValues.branch || "Branch pending"}`,
          note: `${formValues.date || "No date"} • ${formValues.time || "No time"}`,
        }}
        warnings={["This mock delete updates the navigation flow only and does not persist outside this feature."]}
      />
    </section>
  );
}
