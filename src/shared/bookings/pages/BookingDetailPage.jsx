import { Button, Modal } from "antd";
import { CalendarClock, LoaderCircle, PencilLine, RefreshCcw, Save, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../components/ui/ActionConfirmModal";
import { BookingFormFields } from "../components/BookingFormFields";
import { BookingHeroCard } from "../components/BookingHeroCard";
import { BookingSnapshotCard } from "../components/BookingSnapshotCard";
import { StaffBookingConsultationDetail } from "../../../features/staff/bookings/components/StaffBookingConsultationDetail";
import { ExtraServiceModal } from "../../../features/staff/bookings/components/ExtraServiceModal";
import { ServiceProceduresViewerModal } from "../../components/common/ServiceProceduresViewerModal";
import {
  BOOKING_ROLE_CONFIG,
  getMockBookingById,
} from "../services/mockBookings";
import { getBookingRoleFromPath } from "../utils/bookingMapper";
import { ROLES } from "../../constants/roles";
import {
  getStaffBookingDesignStudioRoute,
  getStaffBookingServiceSessionRoute,
} from "../../constants/routes";
import { confirmCurrentDesign, confirmCustomerNail, setActiveBooking } from "../../../store/bookingSlice";
import {
  buildStaffBookingItemsForUpdate,
  buildStaffServiceSessionPayload,
  claimBookingProcedure,
  fetchBookingProceduresByBookingItem,
  fetchServiceCatalog,
  fetchStaffServiceDetail,
  fetchStaffBookingDetail,
  fetchStaffCustomerNailDetail,
  fetchStaffCustomerDetail,
  fetchStaffNailVariantDetail,
  formatBookingCode,
  formatCurrency,
  formatTimeValue,
  toNullableBookingUuid,
  updateStaffBooking,
} from "../../../features/staff/bookings/services/staffBookingService";
import { formatDurationMinutes } from "../../utils/formatDuration";
import { useLanguage } from "../../../shared/hooks/useLanguage";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80";
const DEFAULT_DESIGN_IMAGE =
  "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=600&q=80";
const DEFAULT_UPLOAD_IMAGE =
  "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=240&q=80";

/* STREAMING_CHUNK: Formatting Helpers */
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

function formatSignedCurrency(value) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount === 0) {
    return "0 VND";
  }

  const sign = amount < 0 ? "-" : "+";
  return `${sign}${formatCurrency(Math.abs(amount))}`;
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
    case "skipped":
      return "bg-[#f2f2f2] text-[#656565]";
    default:
      return "bg-[#fff1f6] text-[#eb5b92]";
  }
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

/* STREAMING_CHUNK: Booking Data Parsers */
function buildDefaultStaffNotes(booking, language) {
  const serviceNames = getUniqueBookingLabels(
    (booking?.bookingItems ?? []).map((item) => item?.serviceName),
  ).join(", ");
  const isVi = language === "vi";

  // Note: We keep the label keys in English if the component relies on them
  return [
    {
      label: "Customer Requests",
      value: booking?.bookingItems?.find((item) => item.customerNailName)?.customerNailName || (isVi ? "Không có ghi chú từ khách." : "No customer note from API."),
    },
    {
      label: "Design Adjustments",
      value: booking?.bookingItems?.find((item) => item.nailVariantName)?.nailVariantName || (isVi ? "Ghi chú điều chỉnh thiết kế khi tư vấn." : "Capture final design adjustments during consultation."),
    },
    {
      label: "Notes Before Service",
      value: serviceNames || (isVi ? "Xác nhận dịch vụ, thời gian rồi bắt đầu." : "Verify services, confirm timing, then start session."),
    },
  ];
}

function buildStaffExperienceFromBooking(
  booking,
  staffNotesDraft,
  nailVariantDetail,
  customerNailDetail,
  customerDetail,
  serviceDetailMap = {},
  nailVariantDetailMap = {},
  customerNailDetailMap = {},
  language = "en"
) {
  const isVi = language === "vi";
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
  const totalDiscountAmount = Number(booking?.discount || 0);
  const bookingDiscounts = Array.isArray(booking?.discounts) ? booking.discounts : [];
  const discountSummary = bookingDiscounts
    .map((item) => [item?.name, item?.type].filter(Boolean).join(" • "))
    .filter(Boolean)
    .join(", ");
  const serviceNames = getUniqueBookingLabels(normalizedItems.map((item) => item.serviceName));
  const variantNames = getUniqueBookingLabels(normalizedItems.map((item) => item.nailVariantName));
  const customerDesignNames = getUniqueBookingLabels(normalizedItems.map((item) => item.customerNailName));
  const rawBookingServiceEntries = normalizedItems.flatMap((item, index) => {
    const bookingItemId = String(item?.bookingItemId || item?.id || "").trim();
    const serviceId = String(item?.serviceId || "").trim();
    const quantity = Number(item?.quantity || 0) > 0 ? Number(item.quantity) : 1;
    const resolvedService = serviceId ? serviceDetailMap[serviceId] : null;
    const customerNailId = Number(item?.customerNailId || 0);
    const nailVariantId = Number(item?.nailVariantId || 0);
    const resolvedCustomerNail = customerNailId > 0 ? customerNailDetailMap[customerNailId] : null;
    const resolvedNailVariant = nailVariantId > 0 ? nailVariantDetailMap[nailVariantId] : null;
    const resolvedNailDetail = resolvedCustomerNail || resolvedNailVariant;
    const hasNailDetail = Boolean(
      normalizeBookingText(
        resolvedCustomerNail?.name ||
        resolvedNailVariant?.name ||
        item?.customerNailName ||
        item?.nailVariantName,
      ) ||
      customerNailId > 0 ||
      nailVariantId > 0
    );
    const rows = [];

    const resolvedServiceName = normalizeBookingText(resolvedService?.name || item?.serviceName);
    if (resolvedServiceName || serviceId) {
      rows.push({
        id: `${bookingItemId || `service-${index}`}-service`,
        bookingItemId,
        name: resolvedServiceName || "--",
        // CRITICAL FIX: Keep "Service" as key so StaffBookingConsultationDetail can filter it properly
        detailLabel: "Service",
        quantity,
        price: formatCurrency(resolvedService?.price ?? item?.price ?? item?.finalPrice ?? 0),
        duration: normalizeBookingItemDuration(resolvedService?.duration ?? item?.serviceDuration ?? item?.duration),
        canViewProcedures: Boolean(bookingItemId) && !hasNailDetail,
      });
    }

    const resolvedNailName = normalizeBookingText(
      resolvedCustomerNail?.name ||
      resolvedNailVariant?.name ||
      item?.customerNailName ||
      item?.nailVariantName,
    );
    if (resolvedNailName || customerNailId > 0 || nailVariantId > 0) {
      rows.push({
        id: `${bookingItemId || `service-${index}`}-nail`,
        bookingItemId,
        name: resolvedNailName || "--",
        // CRITICAL FIX: Keep "Customer Nail" and "Nail Variant" as keys
        detailLabel: resolvedCustomerNail ? (language === "vi" ? "Móng của khách hàng" : "Customer Nail") : (language === "vi" ? "Biến thể móng" : "Nail Variant"),
        quantity,
        price: formatCurrency(resolvedNailDetail?.price ?? 0),
        duration: normalizeBookingItemDuration(resolvedNailDetail?.duration),
        canViewProcedures: Boolean(bookingItemId),
      });
    }

    return rows;
  });

  const bookingServiceEntries = [];
  const serviceEntriesMap = new Map();
  rawBookingServiceEntries.forEach((entry) => {
    const key = `${entry.detailLabel}_${entry.name}_${entry.price}_${entry.duration}`;
    if (!serviceEntriesMap.has(key)) {
      const copy = { ...entry };
      serviceEntriesMap.set(key, copy);
      bookingServiceEntries.push(copy);
    } else {
      serviceEntriesMap.get(key).quantity += entry.quantity;
    }
  });
  const bookingItemsBasePrice = normalizedItems.reduce((sum, item) => {
    const quantity = Number(item?.quantity || 0) > 0 ? Number(item.quantity) : 1;
    const price = Number(item?.price || 0);

    if (!Number.isFinite(price) || price <= 0) {
      return sum;
    }

    return sum + price * quantity;
  }, 0);
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
    (isVi ? "Chưa chọn mẫu thiết kế" : "Selected design not specified");
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
      .join(", ") || `${resolvedComponents.length} ${isVi ? "thành phần" : "component(s)"}`
    : "--";
  const customerDisplayName =
    customerDetail?.fullName ||
    booking?.customerName ||
    "--";
  const customerPhone = customerDetail?.phone || "--";
  const customerAvatar = customerDetail?.avatarUrl || DEFAULT_AVATAR;
  const customerMemberTier = customerDetail?.role || "Customer";
  const customerStatus = customerDetail?.status || booking?.status || "--";

  // CRITICAL FIX: Keeping all `label` values exactly as English string constants 
  // so the child component can find and render the layout correctly.
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
    customerId: booking?.customerId,
    customer: {
      name: customerDisplayName,
      phone: customerPhone,
      avatar: customerAvatar,
      memberTier: customerMemberTier,
      id: booking?.customerId,
      userId: booking?.customerId,
      facts: [
        { label: language === "vi" ? "Tiệm nails" : "Salon", value: booking?.salonName || "--" },
        { label: language === "vi" ? "Số lượng dịch vụ" : "Total Services", value: String(items.length || 0) },
        { label: language === "vi" ? "Trạng thái" : "Status", value: customerStatus },
      ],
      allergyNote: customerDetail?.email || "--",
      preferences: requestedDesign || "--",
    },
    bookingInfo: [
      {
        label: "Service",
        services: bookingServiceEntries,
      },
      {
        label: language === "vi" ? "Lịch hẹn" : "Appointment",
        value: startTime,
        note: formatStaffDate(booking?.bookingDate),
      },
      {
        label: language === "vi" ? "Thời lượng" : "Duration",
        value: timeRange,
        note: totalDuration,
      },
      {
        label: language === "vi" ? "Tổng giá" : "Total Price",
        value: formatCurrency(booking?.totalPrice),
        note: totalDiscountAmount
          ? `${isVi ? "Gốc" : "Original"}: ${formatCurrency((Number(booking?.totalPrice || 0) - totalDiscountAmount))}`
          : undefined,
        tone: "success",
      },
      ...(totalDiscountAmount
        ? [{
          label: language === "vi" ? "Giảm giá" : "Discount",
          value: formatSignedCurrency(totalDiscountAmount),
          note: discountSummary || undefined,
          tone: "success",
        }]
        : []),
      {
        label: language === "vi" ? "Tiệm nails" : "Salon",
        value: booking?.salonName || "--",
      },
      {
        label: language === "vi" ? "Nghệ sĩ" : "Staff Artist",
        value: booking?.artistName || "--",
      },
    ],
    design: {
      name: resolvedDesignDetail?.name || requestedDesign,
      image: resolvedDesignImage,
      details: [
        { label: "Service", value: serviceSummary },
        { label: "Variant", value: resolvedVariantName },
        { label: language === "vi" ? "Kiểu dáng" : "Shape", value: resolvedShape?.name || "--" },
        { label: language === "vi" ? "Bề mặt" : "Surface", value: resolvedSurface?.name || "--" },
        { label: "Customer Design", value: customerDesignNames[0] || "--" },
        { label: language === "vi" ? "Thời lượng" : "Duration", value: timeRange },
        { label: language === "vi" ? "Giá" : "Price", value: bookingItemsBasePrice > 0 ? formatCurrency(bookingItemsBasePrice) : formatCurrency(booking?.price) },
        { label: language === "vi" ? "Thành phần" : "Components", value: componentSummary },
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
        title: primaryDesignItem?.customerNailName || primaryDesignItem?.nailVariantName || (isVi ? "Không có hình ảnh" : "Reference unavailable"),
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
      { label: language === 'vi' ? "Chi tiết lịch hẹn đã tải từ API" : "Booking detail loaded from API", checked: true },
      { label: language === 'vi' ? "Thiết kế móng hiện tại đã được xác nhận" : "Current nail design confirmed", checked: false },
      ...(hasCustomerNailSelected ? [{ label: language === 'vi' ? "Mẫu móng của khách hàng đã được xác nhận" : "Customer nail confirmed", checked: false }] : []),
      { label: language === 'vi' ? "Nghệ sĩ được chỉ định cho lịch hẹn" : "Artist assigned to booking", checked: Boolean(booking?.artistName) },
      {
        label: language === 'vi' ? "Có hình ảnh tham khảo thiết kế móng của khách hàng" : "Customer design reference available",
        checked: Boolean(primaryDesignItem?.customerNailImageUrl || primaryDesignItem?.nailVariantImageUrl),
      },
      { label: language === 'vi' ? "Đã ghi lại các mục dịch vụ" : "Service items captured", checked: items.length > 0 },
    ],
  };
}

function normalizeStaffBookingStatus(value) {
  return String(value || "").trim().toLowerCase();
}

/* STREAMING_CHUNK: Booking Detail Component Setup */
export function BookingDetailPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { language } = useLanguage();
  const isVi = language === "vi";

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
  const [staffServiceDetailMap, setStaffServiceDetailMap] = useState({});
  const [staffBookingNailVariantDetailMap, setStaffBookingNailVariantDetailMap] = useState({});
  const [staffBookingCustomerNailDetailMap, setStaffBookingCustomerNailDetailMap] = useState({});
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
  const [selectedExtraServiceQuantities, setSelectedExtraServiceQuantities] = useState({});
  const [isLoadingServiceCatalog, setIsLoadingServiceCatalog] = useState(false);
  const [isSavingExtraService, setIsSavingExtraService] = useState(false);
  const [selectedProcedureService, setSelectedProcedureService] = useState(null);
  const [serviceProcedureList, setServiceProcedureList] = useState([]);
  const [isServiceProcedureModalLoading, setIsServiceProcedureModalLoading] = useState(false);
  const [serviceProcedureModalError, setServiceProcedureModalError] = useState("");
  const [claimingProcedureId, setClaimingProcedureId] = useState("");
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
    if (!isStaffRole || !action) return "";

    return {
      complete: isVi ? "Kiểm tra danh sách trước khi hoàn thành dịch vụ." : "Review the checklist before marking this service done.",
      delete: isVi ? "Dùng nút Quay Lại nếu muốn rời lịch hẹn này." : "Use Back to Queue if you want to leave this booking.",
      notes: isVi ? "Ghi chú của thợ đã sẵn sàng." : "Staff notes are ready for review.",
      start: isVi ? "Xác nhận thiết kế và tiến hành làm dịch vụ." : "Confirm the design and proceed to service when ready.",
    }[action] ?? "";
  }, [isStaffRole, location.state, isVi]);

  const deleteRequested = role !== ROLES.staff && Boolean(location.state?.requestDelete);
  const normalizedStaffBookingStatus = normalizeStaffBookingStatus(staffBookingDetail?.status);
  const isCheckinBooking = ["checkedin", "checkin"].includes(normalizedStaffBookingStatus);
  const isPendingBooking = ["pending", "approved"].includes(normalizedStaffBookingStatus);
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

  /* STREAMING_CHUNK: Component Effects */
  useEffect(() => {
    if (!staffActionMessage && !deleteRequested) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [deleteRequested, location.pathname, navigate, staffActionMessage]);

  useEffect(() => {
    if (!isStaffRole || !normalizedBookingId) return;
    dispatch(setActiveBooking(normalizedBookingId));
  }, [dispatch, isStaffRole, normalizedBookingId]);

  useEffect(() => {
    if (!isStaffRole || !bookingId) return;
    let isMounted = true;

    const loadBooking = async () => {
      setIsStaffLoading(true);
      setStaffLoadError("");

      try {
        const data = await fetchStaffBookingDetail(bookingId);
        if (!isMounted) return;
        setStaffBookingDetail(data);
        setStaffNotesDraft(buildDefaultStaffNotes(data, language));
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : (isVi ? "Không tải được thông tin lịch hẹn." : "Failed to load booking detail.");
        setStaffLoadError(message);
        toast.error(message);
      } finally {
        if (isMounted) setIsStaffLoading(false);
      }
    };

    void loadBooking();
    return () => { isMounted = false; };
  }, [bookingId, isStaffRole, language]);

  useEffect(() => {
    if (!isStaffRole) return;
    const customerId = String(staffBookingDetail?.customerId || "").trim();
    let isMounted = true;

    const loadCustomerDetail = async () => {
      if (!customerId) {
        if (isMounted) setStaffCustomerDetail(null);
        return;
      }
      try {
        const detail = await fetchStaffCustomerDetail(customerId);
        if (isMounted) setStaffCustomerDetail(detail);
      } catch {
        if (isMounted) setStaffCustomerDetail(null);
      }
    };
    void loadCustomerDetail();
    return () => { isMounted = false; };
  }, [isStaffRole, staffBookingDetail?.customerId]);

  useEffect(() => {
    if (!isStaffRole) return;
    const customerNailId = getPrimaryCustomerNailId(staffBookingDetail?.bookingItems);
    let isMounted = true;

    const loadCustomerNailDetail = async () => {
      if (!Number.isInteger(customerNailId) || customerNailId <= 0) {
        if (isMounted) setStaffCustomerNailDetail(null);
        return;
      }
      try {
        const detail = await fetchStaffCustomerNailDetail(customerNailId);
        if (isMounted) setStaffCustomerNailDetail(detail);
      } catch {
        if (isMounted) setStaffCustomerNailDetail(null);
      }
    };
    void loadCustomerNailDetail();
    return () => { isMounted = false; };
  }, [isStaffRole, staffBookingDetail?.bookingItems]);

  useEffect(() => {
    if (!isStaffRole) return;
    const bookingItems = Array.isArray(staffBookingDetail?.bookingItems) ? staffBookingDetail.bookingItems : [];
    const serviceIds = [...new Set(bookingItems.map((item) => String(item?.serviceId || "").trim()).filter(Boolean))];
    const nailVariantIds = [...new Set(bookingItems.map((item) => Number(item?.nailVariantId || 0)).filter((value) => Number.isInteger(value) && value > 0))];
    const customerNailIds = [...new Set(bookingItems.map((item) => Number(item?.customerNailId || 0)).filter((value) => Number.isInteger(value) && value > 0))];
    let isMounted = true;

    if (!serviceIds.length && !nailVariantIds.length && !customerNailIds.length) {
      setStaffServiceDetailMap({});
      setStaffBookingNailVariantDetailMap({});
      setStaffBookingCustomerNailDetailMap({});
      return;
    }

    const loadBookingItemDetails = async () => {
      const [serviceResults, nailVariantResults, customerNailResults] = await Promise.all([
        Promise.allSettled(serviceIds.map(async (serviceId) => [serviceId, await fetchStaffServiceDetail(serviceId)])),
        Promise.allSettled(nailVariantIds.map(async (variantId) => [variantId, await fetchStaffNailVariantDetail(variantId)])),
        Promise.allSettled(customerNailIds.map(async (customerNailId) => [customerNailId, await fetchStaffCustomerNailDetail(customerNailId)])),
      ]);

      if (!isMounted) return;

      setStaffServiceDetailMap(serviceResults.reduce((acc, result) => {
        if (result.status === "fulfilled") {
          const [serviceId, detail] = result.value;
          acc[serviceId] = detail;
        }
        return acc;
      }, {}));
      setStaffBookingNailVariantDetailMap(nailVariantResults.reduce((acc, result) => {
        if (result.status === "fulfilled") {
          const [variantId, detail] = result.value;
          acc[variantId] = detail;
        }
        return acc;
      }, {}));
      setStaffBookingCustomerNailDetailMap(customerNailResults.reduce((acc, result) => {
        if (result.status === "fulfilled") {
          const [customerNailId, detail] = result.value;
          acc[customerNailId] = detail;
        }
        return acc;
      }, {}));
    };
    void loadBookingItemDetails();
    return () => { isMounted = false; };
  }, [isStaffRole, staffBookingDetail?.bookingItems]);

  useEffect(() => {
    if (!isStaffRole) return;
    const variantId = getPrimaryNailVariantId(staffBookingDetail?.bookingItems);
    let isMounted = true;

    const loadNailVariantDetail = async () => {
      if (!Number.isInteger(variantId) || variantId <= 0) {
        if (isMounted) setStaffNailVariantDetail(null);
        return;
      }
      try {
        const detail = await fetchStaffNailVariantDetail(variantId);
        if (isMounted) setStaffNailVariantDetail(detail);
      } catch {
        if (isMounted) setStaffNailVariantDetail(null);
      }
    };
    void loadNailVariantDetail();
    return () => { isMounted = false; };
  }, [isStaffRole, staffBookingDetail?.bookingItems]);

  useEffect(() => {
    if (!showUpdateBookingModal) return undefined;
    let isMounted = true;

    const loadServiceCatalog = async () => {
      setIsLoadingServiceCatalog(true);
      try {
        const response = await fetchServiceCatalog({
          pageNumber: serviceCatalogPage,
          pageSize: 10,
          name: serviceSearchKeyword.trim() || undefined,
        });

        if (!isMounted) return;
        setServiceCatalog(response.items);
        setServiceCatalogMeta(response.metaData ?? {
          currentPage: serviceCatalogPage, totalPages: 1, pageSize: 10, totalItems: 0,
          hasPrevious: false, hasNext: false, firstRowOnPage: 0, lastRowOnPage: 0,
        });
      } catch (error) {
        if (!isMounted) return;
        setServiceCatalog([]);
        setServiceCatalogMeta({
          currentPage: serviceCatalogPage, totalPages: 1, pageSize: 10, totalItems: 0,
          hasPrevious: false, hasNext: false, firstRowOnPage: 0, lastRowOnPage: 0,
        });
        const message = error instanceof Error ? error.message : (isVi ? "Tải danh sách dịch vụ thất bại." : "Failed to load services.");
        toast.error(message);
      } finally {
        if (isMounted) setIsLoadingServiceCatalog(false);
      }
    };
    void loadServiceCatalog();
    return () => { isMounted = false; };
  }, [serviceCatalogPage, serviceSearchKeyword, showUpdateBookingModal, isVi]);

  /* STREAMING_CHUNK: Event Handlers */
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
        ? (isVi ? "Cập nhật thông tin lịch hẹn đã được lưu tạm trên giao diện." : "Booking detail updates are stored in the current UI session.")
        : (isVi ? "Cập nhật giả lập thành công." : "Mock update completed. Changes are local to this booking detail screen."),
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
          ? (isVi ? `Đã đưa lịch hẹn của khách ${staffBookingDetail?.customerName || ""} trở lại hàng chờ.` : `Returned ${staffBookingDetail?.customerName || "this booking"} to the queue.`)
          : (isVi ? `Xóa giả lập thành công lịch hẹn ${formValues.customerName || formValues.id}.` : `Mock delete completed for ${formValues.customerName || formValues.id}.`),
      },
    });
  };

  const handleConfirmCurrentDesign = () => {
    if (requiresCustomerNailConfirmation || isCurrentDesignConfirmed) return;
    dispatch(confirmCurrentDesign(normalizedBookingId));
    setFlashMessage(isVi ? "Mẫu móng hiện tại đã được xác nhận." : "Current nail design has been confirmed for this booking.");
    toast.success(isVi ? "Đã xác nhận mẫu móng." : "Current design confirmed for this booking.");
  };

  const handleConfirmCustomerNail = () => {
    if (!requiresCustomerNailConfirmation || isCustomerNailConfirmed) return;
    dispatch(confirmCustomerNail(normalizedBookingId));
    setFlashMessage(isVi ? "Móng của khách đã được xác nhận." : "Customer nail has been confirmed for this booking.");
    toast.success(isVi ? "Đã xác nhận móng của khách." : "Customer nail confirmed for this booking.");
  };

  const handleStaffNoteChange = (label, value) => {
    setStaffNotesDraft((current) => current.map((item) => (
      item.label === label ? { ...item, value } : item
    )));
  };

  const handleOpenUpdateBooking = () => {
    setSelectedExtraServiceQuantities({});
    setServiceSearchInput("");
    setServiceSearchKeyword("");
    setServiceCatalogPage(1);
    setShowUpdateBookingModal(true);
    setFlashMessage("");
  };

  const handleOpenServiceProcedures = async (service) => {
    const bookingItemId = String(service?.bookingItemId || service?.id || "").trim();
    if (!bookingItemId) {
      toast.error(isVi ? "Không tìm thấy mã hạng mục cho dịch vụ này." : "Booking item ID is not available for this service.");
      return;
    }
    setSelectedProcedureService(service);
    setServiceProcedureList([]);
    setServiceProcedureModalError("");
    setIsServiceProcedureModalLoading(true);

    try {
      const procedures = await fetchBookingProceduresByBookingItem(bookingItemId);
      setServiceProcedureList(Array.isArray(procedures) ? procedures : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : (isVi ? "Tải quy trình dịch vụ thất bại." : "Failed to load service procedures.");
      setServiceProcedureModalError(message);
      toast.error(message);
    } finally {
      setIsServiceProcedureModalLoading(false);
    }
  };

  const handleCloseServiceProcedures = () => {
    setSelectedProcedureService(null);
    setServiceProcedureList([]);
    setServiceProcedureModalError("");
    setIsServiceProcedureModalLoading(false);
    setClaimingProcedureId("");
  };

  const handleClaimProcedure = async (procedure) => {
    const procedureId = String(procedure?.bookingProcedureId || "").trim();
    if (!procedureId || claimingProcedureId) return;

    if (!isCheckinBooking) {
      toast.error(isVi ? "Chỉ có thể nhận việc khi trạng thái lịch hẹn là Đã Check-in." : "You can only claim procedures when the booking status is CheckedIn.");
      return;
    }

    setClaimingProcedureId(procedureId);
    try {
      const updatedProcedure = await claimBookingProcedure(procedureId);
      setServiceProcedureList((current) =>
        current.map((item) =>
          item?.bookingProcedureId === procedureId ? { ...item, ...updatedProcedure } : item,
        ),
      );
      toast.success(isVi ? "Nhận quy trình thành công." : "Procedure claimed successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : (isVi ? "Nhận quy trình thất bại." : "Failed to claim procedure.");
      toast.error(message);
    } finally {
      setClaimingProcedureId("");
    }
  };

  const handleCloseUpdateBooking = () => {
    if (isSavingExtraService) return;
    setShowUpdateBookingModal(false);
  };

  const handleSearchExtraServices = (event) => {
    event.preventDefault();
    setServiceCatalogPage(1);
    setSelectedExtraServiceQuantities({});
    setServiceSearchKeyword(serviceSearchInput.trim());
  };

  const handleAddExtraService = async () => {
    const normalizedBookingId = String(bookingId || "").trim();
    const normalizedSelectedServices = Object.entries(selectedExtraServiceQuantities).filter(([, quantity]) => (
      Number(quantity || 0) > 0
    ));

    if (!normalizedBookingId || normalizedSelectedServices.length === 0 || !staffBookingDetail || isSavingExtraService) return;

    setIsSavingExtraService(true);
    try {
      const bookingItems = Array.isArray(staffBookingDetail.bookingItems) ? staffBookingDetail.bookingItems : [];
      const payloadBookingItems = buildStaffBookingItemsForUpdate(bookingItems, selectedExtraServiceQuantities);

      const updatedBooking = await updateStaffBooking(normalizedBookingId, {
        bookingDate: staffBookingDetail.bookingDate,
        startTime: staffBookingDetail.startTime,
        nailArtistId: toNullableBookingUuid(staffBookingDetail.nailArtistId || staffBookingDetail.artistId),
        bookingItems: payloadBookingItems,
      });

      setStaffBookingDetail(updatedBooking);
      setShowUpdateBookingModal(false);
      setSelectedExtraServiceQuantities({});

      const selectedServiceNames = normalizedSelectedServices
        .map(([serviceId, quantity]) => {
          const matchedService = serviceCatalog.find((item) => item.serviceId === serviceId);
          if (!matchedService?.name) return "";
          return quantity > 1 ? `${matchedService.name} x${quantity}` : matchedService.name;
        }).filter(Boolean);

      const message = selectedServiceNames.length
        ? (isVi ? `Đã thêm ${selectedServiceNames.join(", ")} vào lịch hẹn.` : `${selectedServiceNames.join(", ")} ${selectedServiceNames.length > 1 ? "have" : "has"} been added to this booking.`)
        : (isVi ? "Dịch vụ thêm đã được đưa vào lịch hẹn." : "Extra services have been added to this booking.");

      setFlashMessage(message);
      toast.success(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : (isVi ? "Cập nhật dịch vụ thất bại." : "Failed to update booking services.");
      toast.error(message);
    } finally {
      setIsSavingExtraService(false);
    }
  };

  /* STREAMING_CHUNK: Rendering UI */
  if (isStaffRole) {
    if (isStaffLoading) {
      return (
        <section className="flex min-h-[50vh] items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
          <div className="flex items-center gap-3 text-sm font-medium text-[#b38a9f]">
            <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
            {isVi ? "Đang tải thông tin lịch hẹn..." : "Loading booking detail..."}
          </div>
        </section>
      );
    }

    if (staffLoadError || !staffBookingDetail) {
      return (
        <section className="rounded-[24px] border border-[#f6d8e5] bg-white p-6 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
          <p className="text-lg font-extrabold text-[#412643]">{isVi ? "Lịch hẹn không khả dụng" : "Booking detail unavailable"}</p>
          <p className="mt-2 text-sm text-[#b38a9f]">{staffLoadError || (isVi ? "Không thể lấy dữ liệu lịch hẹn." : "This booking could not be loaded.")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-full border border-[#f3cade] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#ea4f93]"
            >
              <RefreshCcw size={14} />
              {isVi ? "Thử lại" : "Retry"}
            </button>
            <button
              type="button"
              onClick={() => navigate(roleConfig.listRoute)}
              className="inline-flex items-center rounded-full bg-[image:var(--gradient-accent)] px-4 py-2 text-xs font-bold text-white"
            >
              {isVi ? "Quay lại danh sách" : "Back to bookings"}
            </button>
          </div>
        </section>
      );
    }

    const isCancelledBooking = ["cancelled", "canceled"].includes(String(staffBookingDetail?.status || "").trim().toLowerCase());

    const baseStaffExperience = buildStaffExperienceFromBooking(
      staffBookingDetail,
      staffNotesDraft,
      staffNailVariantDetail,
      staffCustomerNailDetail,
      staffCustomerDetail,
      staffServiceDetailMap,
      staffBookingNailVariantDetailMap,
      staffBookingCustomerNailDetailMap,
      language
    );

    const staffExperience = !requiresCustomerNailConfirmation && isCurrentDesignConfirmed
      ? {
        ...baseStaffExperience,
        design: {
          ...baseStaffExperience.design,
          tags: [
            ...baseStaffExperience.design.tags,
            { label: isVi ? "Đã xác nhận" : "Confirmed", className: "border-[#cdeedb] bg-[#eefcf4] text-[#16975f]" },
          ],
        },
        // We keep the "Current nail design confirmed" exact English string here 
        // to match the original key so the child component renders correctly
        checklist: baseStaffExperience.checklist.map((item) => (
          item.label === "Current nail design confirmed" ? { ...item, checked: true } : item
        )),
      }
      : baseStaffExperience;

    const staffExperienceWithCustomerNail = requiresCustomerNailConfirmation
      ? {
        ...staffExperience,
        // Match the original English string for customer nail confirmed
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
            ...staffExperienceWithCustomerNail.design.tags.filter((tag) => tag.label !== "Confirmed" && tag.label !== "Completed" && tag.label !== "Đã xác nhận" && tag.label !== "Hoàn thành"),
            {
              label: isServiceCompleted ? (isVi ? "Hoàn thành" : "Completed") : (isVi ? "Đã xác nhận" : "Confirmed"),
              className: isServiceCompleted ? "border-[#cde8f8] bg-[#eef7ff] text-[#327adf]" : "border-[#cdeedb] bg-[#eefcf4] text-[#16975f]",
            },
          ],
        },
      }
      : staffExperienceWithCustomerNail;

    const handleOpenDesignStudio = () => {
      navigate(getStaffBookingDesignStudioRoute(bookingId), {
        state: {
          designStudio: {
            booking: staffBookingDetail || { id: bookingId },
            bookingDetail: staffBookingDetail || null,
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
            currentDesignDetail: resolvedStaffExperience?.design?.variantDetail || null,
          },
        },
      });
    };

    const handleChooseAnotherDesign = () => {
      handleOpenDesignStudio();
    };

    const handleOpenServiceSession = () => {
      if (!isBookingReadyForService && !hasServiceStarted) {
        toast.error(
          hasCustomerNailSelection
            ? (isVi ? "Vui lòng xác nhận móng khách trước khi bắt đầu dịch vụ." : "Confirm current nail before starting the service session.")
            : (isVi ? "Vui lòng xác nhận thiết kế trước khi bắt đầu dịch vụ." : "Confirm Current Design before starting the service session."),
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
          isCancelledBooking={isCancelledBooking}
          isCurrentDesignConfirmed={
            requiresCustomerNailConfirmation ? false : isCurrentDesignConfirmed || hasServiceStarted
          }
          isCustomerNailConfirmed={isCustomerNailConfirmed || hasServiceStarted}
          requiresCustomerNailConfirmation={requiresCustomerNailConfirmation}
          isPendingBooking={isPendingBooking}
          isServiceInProgress={isServiceInProgress}
          isServiceCompleted={isServiceCompleted}
          onChooseAnotherDesign={handleChooseAnotherDesign}
          onConfirmCurrentDesign={handleConfirmCurrentDesign}
          onConfirmCustomerNail={handleConfirmCustomerNail}
          onDelete={handleDelete}
          onOpenDesignStudio={handleOpenDesignStudio}
          onOpenServiceProcedures={handleOpenServiceProcedures}
          onOpenUpdateBooking={handleOpenUpdateBooking}
          onStaffNoteChange={handleStaffNoteChange}
          onStartServiceSession={() => void handleOpenServiceSession()}
        />
        <ExtraServiceModal
          open={showUpdateBookingModal}
          services={serviceCatalog}
          selectedServiceQuantities={selectedExtraServiceQuantities}
          searchValue={serviceSearchInput}
          isLoading={isLoadingServiceCatalog}
          isSaving={isSavingExtraService}
          meta={serviceCatalogMeta}
          onClose={handleCloseUpdateBooking}
          onSearchChange={(event) => setServiceSearchInput(event.target.value)}
          onSearchSubmit={handleSearchExtraServices}
          onDecreaseQuantity={(serviceId) =>
            setSelectedExtraServiceQuantities((current) => {
              const nextQuantity = Math.max(0, Number(current?.[serviceId] || 0) - 1);
              if (nextQuantity <= 0) {
                const nextState = { ...current };
                delete nextState[serviceId];
                return nextState;
              }
              return { ...current, [serviceId]: nextQuantity };
            })
          }
          onIncreaseQuantity={(serviceId) =>
            setSelectedExtraServiceQuantities((current) => ({
              ...current,
              [serviceId]: Number(current?.[serviceId] || 0) + 1,
            }))
          }
          onPageChange={(page) => {
            if (page < 1 || page > (serviceCatalogMeta?.totalPages ?? 1)) return;
            setSelectedExtraServiceQuantities({});
            setServiceCatalogPage(page);
          }}
          onConfirm={handleAddExtraService}
          title={isVi ? "Cập nhật dịch vụ cho lịch hẹn" : "Update Booking Services"}
          description={isVi ? "Chọn các dịch vụ làm thêm vào lịch hẹn trước khi bắt đầu phiên dịch vụ." : "Select extra services to add into the current booking before starting the service session."}
        />
        <ServiceProceduresViewerModal
          isOpen={Boolean(selectedProcedureService)}
          onClose={handleCloseServiceProcedures}
          service={selectedProcedureService ? {
            name: selectedProcedureService.name,
            quantity: selectedProcedureService.quantity,
            durationLabel: selectedProcedureService.duration,
          } : null}
          procedures={serviceProcedureList}
          isLoading={isServiceProcedureModalLoading}
          error={serviceProcedureModalError}
          onClaimProcedure={(procedure) => void handleClaimProcedure(procedure)}
          claimingProcedureId={claimingProcedureId}
        />
      </>
    );
  }

  return (
    <section className="flex min-h-full flex-col gap-4">
      <BookingHeroCard
        backLabel={isVi ? "Quay lại danh sách" : "Back to booking list"}
        backTo={roleConfig.listRoute}
        badge={roleConfig.detailBadge}
        title={formValues.customerName}
        description={roleConfig.detailDescription}
        panelIcon={<CalendarClock size={18} className="text-[#d45b9f]" />}
        panelTitle={isEditing ? (isVi ? "Chế độ sửa" : "Edit mode") : (isVi ? "Chế độ xem" : "View mode")}
        panelDescription={isVi ? "Các thao tác tại đây chỉ thay đổi trên UI, không lưu trữ thực tế bên ngoài tính năng này." : "All actions here are UI-only and do not persist outside this feature."}
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
                  <span>{isVi ? "Lưu thay đổi" : "Save changes"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff5ef] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#ffe9d7] sm:w-auto"
                >
                  <span>{isVi ? "Hủy" : "Cancel"}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(239,93,180,0.24)] transition hover:scale-[1.01] sm:w-auto"
              >
                <PencilLine size={16} />
                <span>{isVi ? "Chỉnh sửa lịch hẹn" : "Edit booking"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#fff0f5] px-5 py-3 text-sm font-semibold text-[#d14c84] transition hover:bg-[#ffe1ec] sm:w-auto"
            >
              <Trash2 size={16} />
              <span>{isVi ? "Xóa lịch hẹn" : "Delete booking"}</span>
            </button>
          </div>
        </article>

        <BookingSnapshotCard
          formValues={formValues}
          notice={isVi ? "Đây chỉ là giả lập CRUD. Các thao tác Lưu và Xóa chỉ cập nhật trên UI, không lưu dữ liệu thực tế." : "This is mock CRUD only. Save and delete actions update the UI flow, but they do not persist data outside this screen."}
        />
      </div>

      <ActionConfirmModal
        open={showSaveConfirm}
        intent="success"
        title={isVi ? "Lưu thông tin cập nhật" : "Save Booking Changes"}
        subtitle={isVi ? "Thao tác này sẽ cập nhật lịch hẹn trong luồng giả lập." : "This will update the appointment in the current mock booking flow."}
        description={isVi ? "Xác nhận để áp dụng các chỉnh sửa mới nhất." : "Confirm to apply the latest edits to this booking."}
        confirmText={isVi ? "Lưu thay đổi" : "Save Changes"}
        cancelText={isVi ? "Xem lại" : "Review Again"}
        confirmIcon={Save}
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirm(false)}
        highlights={[formValues.customerName || (isVi ? "Chi tiết lịch hẹn" : "Booking detail"), formValues.service || (isVi ? "Dịch vụ chờ duyệt" : "Service pending"), formValues.branch || (isVi ? "Chi nhánh chờ duyệt" : "Branch pending")]}
        details={[
          { label: isVi ? "Ngày hẹn" : "Appointment Date", value: formValues.date || (isVi ? "Chưa chọn ngày" : "No date selected") },
          { label: isVi ? "Giờ hẹn" : "Appointment Time", value: formValues.time || (isVi ? "Chưa chọn giờ" : "No time selected") },
        ]}
        warnings={[isVi ? "Cập nhật này chỉ là giả lập thay đổi dòng chạy UI, không ảnh hưởng dữ liệu ngoài màn hình này." : "This mock update changes the UI flow only and does not persist outside this screen."]}
      />

      <ActionConfirmModal
        open={showCancelConfirm}
        intent="warning"
        title={isVi ? "Hủy bỏ các thay đổi" : "Discard Booking Edits"}
        subtitle={isVi ? "Bạn đang rời khỏi chế độ sửa mà không lưu." : "You are about to leave edit mode without saving."}
        description={isVi ? "Các thay đổi chưa lưu sẽ bị hủy bỏ." : "Unsaved updates to this booking will be discarded."}
        confirmText={isVi ? "Hủy các thay đổi" : "Discard Changes"}
        cancelText={isVi ? "Tiếp tục sửa" : "Keep Editing"}
        confirmIcon={X}
        onConfirm={handleCancelEdit}
        onCancel={() => setShowCancelConfirm(false)}
        details={[
          { label: isVi ? "Chế độ sửa" : "Editing Mode", value: isVi ? "Chi tiết lịch hẹn" : "Booking detail" },
          { label: isVi ? "Kết quả" : "Result", value: isVi ? "Phục hồi giá trị gốc" : "Revert to last loaded values" },
        ]}
        warnings={[isVi ? "Mọi thông tin chưa lưu về khách hàng, dịch vụ và lịch trình sẽ bị mất." : "Any unsaved changes to customer, service, and schedule details will be lost."]}
      />

      <ActionConfirmModal
        open={showDeleteConfirm}
        intent="danger"
        title={isVi ? "Xóa lịch hẹn" : "Delete Booking"}
        subtitle={isVi ? "Thao tác này sẽ xóa lịch hẹn trong luồng giả lập." : "This will remove the booking from the current mock booking flow."}
        description={isVi ? `Bạn sắp xóa lịch hẹn của ${formValues.customerName || "khách hàng này"}. Thao tác không thể hoàn tác.` : `You are about to delete ${formValues.customerName || "this booking"}. This action cannot be undone.`}
        confirmText={isVi ? "Xóa lịch hẹn" : "Delete Booking"}
        cancelText={isVi ? "Giữ lại" : "Keep Booking"}
        confirmIcon={Trash2}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        item={{
          title: formValues.customerName || (isVi ? "Bản ghi lịch hẹn" : "Booking record"),
          meta: `${formValues.service || (isVi ? "Dịch vụ đang chờ" : "Service pending")} • ${formValues.branch || (isVi ? "Chi nhánh đang chờ" : "Branch pending")}`,
          note: `${formValues.date || (isVi ? "Chưa chọn ngày" : "No date")} • ${formValues.time || (isVi ? "Chưa chọn giờ" : "No time")}`,
        }}
        warnings={[isVi ? "Thao tác xóa giả lập này chỉ đổi hướng UI mà không tác động dữ liệu bên ngoài." : "This mock delete updates the navigation flow only and does not persist outside this feature."]}
      />
    </section>
  );
}