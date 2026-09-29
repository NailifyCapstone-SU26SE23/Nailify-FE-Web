import { Button, Modal } from "antd";
import { CalendarClock, LoaderCircle, PencilLine, RefreshCcw, Save, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ActionConfirmModal } from "../../../../shared/components/ui/ActionConfirmModal";
import { BookingFormFields } from "../components/BookingFormFields";
import { BookingHeroCard } from "../components/BookingHeroCard";
import { BookingSnapshotCard } from "../components/BookingSnapshotCard";
import { StaffBookingConsultationDetail } from "../components/StaffBookingConsultationDetail";
import { OnsiteAddonModal } from "../../../manager/bookings/components/OnsiteAddonModal";
import { OnsiteAddonConflictModal } from "../../../receptionist/bookings/components/OnsiteAddonConflictModal";
import { ServiceProceduresViewerModal } from "../../../../shared/components/common/ServiceProceduresViewerModal";
import {
  BOOKING_ROLE_CONFIG,
  getMockBookingById,
} from "../../../../shared/bookings/services/mockBookings";
import { ROLES } from "../../../../shared/constants/roles";
import {
  getStaffBookingDesignStudioRoute,
  getStaffBookingServiceSessionRoute,
} from "../../../../shared/constants/routes";
import { confirmCurrentDesign, confirmCustomerNail, setActiveBooking } from "../../../../store/bookingSlice";
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
} from "../services/staffBookingService";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";
import { useLanguage } from "../../../../shared/hooks/useLanguage";

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

  return [
    {
      label: "Customer Requests",
      value: booking?.bookingItems?.find((item) => item.customerNailName)?.customerNailName || (isVi ? "Không có ghi chú từ khách." : "No customer note."),
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

function translateStatus(status, language) {
  const s = String(status || "").trim().toLowerCase();
  if (language === "vi") {
    switch (s) {
      case "active": return "Đang hoạt động";
      case "inactive": return "Ngừng hoạt động";
      case "blocked": return "Đã khóa";
      case "pending": return "Chờ xử lý";
      case "approved": return "Đã duyệt";
      case "checkedin": return "Đã Check-in";
      case "inprogress": return "Đang thực hiện";
      case "servicecompleted": return "Đã xong dịch vụ";
      case "completed": return "Hoàn thành";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  }
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : status;
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
        name: resolvedServiceName,
        detailLabel: "Service",
        quantity,
        rawPrice: item?.price ?? item?.finalPrice ?? resolvedService?.price ?? 0,
        price: formatCurrency(item?.price ?? item?.finalPrice ?? resolvedService?.price ?? 0),
        duration: normalizeBookingItemDuration(item?.duration ?? item?.serviceDuration ?? resolvedService?.duration),
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
        name: resolvedNailName,
        detailLabel: resolvedCustomerNail ? (language === "vi" ? "Móng của khách hàng" : "Customer Nail") : (language === "vi" ? "Biến thể móng" : "Nail Variant"),
        quantity,
        rawPrice: item?.price ?? item?.finalPrice ?? resolvedNailDetail?.price ?? 0,
        price: formatCurrency(item?.price ?? item?.finalPrice ?? resolvedNailDetail?.price ?? 0),
        duration: normalizeBookingItemDuration(item?.duration ?? item?.serviceDuration ?? resolvedNailDetail?.duration),
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
      copy.totalPrice = formatCurrency(copy.rawPrice * copy.quantity);
      serviceEntriesMap.set(key, copy);
      bookingServiceEntries.push(copy);
    } else {
      const existing = serviceEntriesMap.get(key);
      existing.quantity += entry.quantity;
      existing.totalPrice = formatCurrency(existing.rawPrice * existing.quantity);
    }
  });
  const designItemsBasePrice = normalizedItems.reduce((sum, item) => {
    if (!(Number(item?.customerNailId || 0) > 0) && !(Number(item?.nailVariantId || 0) > 0)) {
      return sum;
    }
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
    resolvedDesignDetail?.name || customerDesignNames[0] || variantNames[0];
  const resolvedDesignImage = resolvedDesignDetail?.imageUrl || designImage;
  const hasCustomerNailSelected = Boolean(
    normalizedItems.some((item) => Number(item?.customerNailId || 0) > 0),
  );
  const componentSummary = resolvedComponents?.length
    ? resolvedComponents
      .map((item) => item?.component?.name)
      .filter(Boolean)
      .join(", ") || `${resolvedComponents.length} ${isVi ? "thành phần" : "component(s)"}`
    : (language === "vi" ? "Không có phụ kiện" : "No components");
  const customerDisplayName =
    customerDetail?.fullName ||
    booking?.customerName ||
    "--";
  const customerPhone = customerDetail?.phone;
  const customerAvatar = customerDetail?.avatarUrl || DEFAULT_AVATAR;
  const customerMemberTier = customerDetail?.role || "Customer";
  const customerStatus = customerDetail?.status || booking?.status;

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
        { label: language === "vi" ? "Tiệm nails" : "Salon", value: booking?.salonName },
        { label: language === "vi" ? "Số lượng dịch vụ" : "Total Services", value: String(items.length || 0) },
        { label: language === "vi" ? "Trạng thái" : "Status", value: translateStatus(customerStatus, language) },
      ],
      allergyNote: customerDetail?.email,
      preferences: requestedDesign,
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
        value: booking?.salonName,
      },
      {
        label: language === "vi" ? "Nghệ sĩ" : "Staff Artist",
        value: booking?.artistName,
      },
      ...(booking?.chairName
        ? [{
          label: language === "vi" ? "Ghế làm việc" : "Working Chair",
          value: booking.chairName,
        }]
        : []),
    ],
    design: {
      name: resolvedDesignDetail?.name || requestedDesign,
      image: resolvedDesignImage,
      details: [
        { label: "Service", value: serviceSummary },
        { label: "Variant", value: resolvedVariantName },
        { label: language === "vi" ? "Kiểu dáng" : "Shape", value: resolvedShape?.name },
        { label: language === "vi" ? "Bề mặt" : "Surface", value: resolvedSurface?.name },
        { label: "Customer Design", value: customerDesignNames[0] },
        { label: language === "vi" ? "Thời lượng" : "Duration", value: timeRange },
        { label: language === "vi" ? "Giá" : "Price", value: designItemsBasePrice > 0 ? formatCurrency(designItemsBasePrice) : formatCurrency(booking?.price) },
        { label: language === "vi" ? "Phụ kiện" : "Components", value: componentSummary },
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
          shapeMethodConfigId: primaryDesignItem?.shapeMethodConfigId || 0,
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
      { label: "Status", value: booking?.status },
      { label: "Staff Artist", value: booking?.artistName },
      { label: "Salon", value: booking?.salonName },
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
      previousShapes: variantNames[0],
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
        name: item.customerNailName || item.nailVariantName || item.serviceName,
        meta: `${item.serviceName} | ${item.duration ? formatDurationMinutes(item.duration) : "--"}`,
        image: item.nailVariantImageUrl || item.customerNailImageUrl || DEFAULT_DESIGN_IMAGE,
      })),
    staffNotes: staffNotesDraft,
    checklist: [
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
export function StaffBookingDetailPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { language } = useLanguage();
  const isVi = language === "vi";

  const role = ROLES.staff;
  const roleConfig = BOOKING_ROLE_CONFIG[role];
  const isStaffRole = true;
  const normalizedBookingId = String(bookingId || "").trim();
  const initialBooking = null;
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
  const [isStaffLoading, setIsStaffLoading] = useState(true);
  const [staffLoadError, setStaffLoadError] = useState("");
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [staffNotesDraft, setStaffNotesDraft] = useState([]);
  const [showUpdateBookingModal, setShowUpdateBookingModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [addonItemsForConflict, setAddonItemsForConflict] = useState(null);
  const [isOnsiteConflictModalOpen, setIsOnsiteConflictModalOpen] = useState(false);
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingServiceQuantity, setEditingServiceQuantity] = useState(null);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [isUpdatingBookingItems, setIsUpdatingBookingItems] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);

  const isCurrentDesignConfirmed = useSelector((state) => (
    Boolean(state.booking.designConfirmations?.[normalizedBookingId])
  ));
  const isCustomerNailConfirmed = useSelector((state) => (
    Boolean(state.booking.customerNailConfirmations?.[normalizedBookingId])
  ));

  const staffActionMessage = useMemo(() => {
    const action = location.state?.staffAction;
    if (!action) return "";

    return {
      complete: isVi ? "Kiểm tra danh sách trước khi hoàn thành dịch vụ." : "Review the checklist before marking this service done.",
      delete: isVi ? "Dùng nút Quay Lại nếu muốn rời lịch hẹn này." : "Use Back to Queue if you want to leave this booking.",
      notes: isVi ? "Ghi chú của thợ đã sẵn sàng." : "Staff notes are ready for review.",
      start: isVi ? "Xác nhận thiết kế và tiến hành làm dịch vụ." : "Confirm the design and proceed to service when ready.",
    }[action] ?? "";
  }, [location.state, isVi]);

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
    if (!staffActionMessage) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, navigate, staffActionMessage]);

  useEffect(() => {
    if (!normalizedBookingId) return;
    dispatch(setActiveBooking(normalizedBookingId));
  }, [dispatch, normalizedBookingId]);

  useEffect(() => {
    if (!bookingId) return;
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
  }, [bookingId, language, isVi, reloadTrigger]);

  useEffect(() => {
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
  }, [staffBookingDetail?.customerId]);

  useEffect(() => {
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
  }, [staffBookingDetail?.bookingItems]);

  useEffect(() => {
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
  }, [staffBookingDetail?.bookingItems]);

  useEffect(() => {
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
  }, [staffBookingDetail?.bookingItems]);



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
      isVi ? "Cập nhật thông tin lịch hẹn đã được lưu tạm trên giao diện." : "Booking detail updates are stored in the current UI session."
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
        flashMessage: isVi ? `Đã đưa lịch hẹn của khách ${staffBookingDetail?.customerName || ""} trở lại hàng chờ.` : `Returned ${staffBookingDetail?.customerName || "this booking"} to the queue.`,
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


  /* STREAMING_CHUNK: Rendering UI */
  if (isStaffLoading) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center rounded-lg bg-[linear-gradient(180deg,#fff9fc_0%,#fff4f8_100%)]">
        <div className="flex items-center gap-3 text-sm font-medium text-[#b38a9f]">
          <LoaderCircle size={18} className="animate-spin text-[#ea4f93]" />
          {isVi ? "Đang tải thông tin lịch hẹn..." : "Loading booking detail..."}
        </div>
      </section>
    );
  }

  if (staffLoadError || !staffBookingDetail) {
    return (
      <section className="rounded-lg border border-[#f6d8e5] bg-white p-6 shadow-[0_14px_32px_rgba(236,72,153,0.06)]">
        <p className="text-lg font-bold text-[#412643]">{isVi ? "Lịch hẹn không khả dụng" : "Booking detail unavailable"}</p>
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
          bookingCode: staffBookingDetail ? formatBookingCode(staffBookingDetail.bookingId) : "",
          customerName: staffBookingDetail?.customerName || formValues?.customerName,
          staffName: staffBookingDetail?.artistName,
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

  const handleChooseAnotherDesign = () => {
    handleOpenDesignStudio();
  };

  // Normalize bookingDate to "YYYY-MM-DD" for PUT payload per API spec
  const getBookingDateStr = () => {
    const raw = staffBookingDetail?.bookingDate || staffBookingDetail?.createdAt || "";
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    return raw.split("T")[0] || raw;
  };

  // Silent re-fetch: update booking data without showing loading spinner (no flicker)
  const silentRefresh = async () => {
    try {
      const freshData = await fetchStaffBookingDetail(bookingId);
      setStaffBookingDetail(freshData);
    } catch {
      // ignore — stale data is acceptable here
    }
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

  const handleEnableEditQuantity = (service) => {
    setEditingServiceQuantity(service);
    setTempQuantity(service.quantity || 1);
  };

  const handleSelectService = (checked, serviceId) => {
    setSelectedServiceIds(prev => 
      checked ? [...prev, serviceId] : prev.filter(id => id !== serviceId)
    );
  };

  const handleSelectAllServices = (checked, allServiceIds) => {
    setSelectedServiceIds(checked ? allServiceIds : []);
  };

  const handleDeleteService = (service) => {
    setItemsToDelete([service]);
  };

  const handleMultiDeleteServices = () => {
    if (selectedServiceIds.length === 0) return;
    
    const serviceInfo = resolvedStaffExperience?.bookingInfo?.find(info => info.label === "Service" || info.label === "Dịch vụ");
    const breakdown = serviceInfo?.services || [];

    const selectedItems = breakdown.filter(service => selectedServiceIds.includes(service.id));
    
    // Fallback if none found for some reason, but we need names for UI
    if (selectedItems.length === 0) {
      setItemsToDelete([{ 
        id: "multi-delete", 
        name: isVi ? "các dịch vụ đã chọn" : "selected services" 
      }]);
      return;
    }
    
    setItemsToDelete(selectedItems);
  };

  const doUpdateServiceQuantity = async () => {
    if (!staffBookingDetail || !editingServiceQuantity) return;
    setIsUpdatingBookingItems(true);
    try {
      const groupedItems = new Map();
      (staffBookingDetail.bookingItems || []).forEach((item) => {
        const sId = String(item.serviceId || "");
        const nId = String(item.nailVariantId || "");
        const key = `${sId}_${nId}`;
        
        const isMatch = (() => {
          const editSId = String(editingServiceQuantity.serviceId || "");
          const editNId = String(editingServiceQuantity.nailVariantId || "");
          if (!editSId && !editNId) {
             return String(editingServiceQuantity.bookingItemId || editingServiceQuantity.id) === String(item.bookingItemId || item.id);
          }
          return editSId === sId && editNId === nId;
        })();
        
        if (!groupedItems.has(key)) {
          groupedItems.set(key, {
            nailVariantId: item.nailVariantId,
            serviceId: item.serviceId,
            shapeMethodConfigId: item.shapeMethodConfigId,
            customerNailId: item.customerNailId,
            customerNailRequestId: item.customerNailRequestId,
            quantity: isMatch ? tempQuantity : (item.quantity || 1)
          });
        } else if (!isMatch) {
          groupedItems.get(key).quantity += (item.quantity || 1);
        }
      });

      const payload = {
        bookingDate: getBookingDateStr(),
        startTime: staffBookingDetail.startTime,
        nailArtistId: staffBookingDetail.nailArtistId || staffBookingDetail.artistId || staffBookingDetail.staffId || null,
        secondaryArtistId: staffBookingDetail.secondaryArtistId || null,
        selectedPromotionIds: Array.isArray(staffBookingDetail.selectedPromotionIds) ? staffBookingDetail.selectedPromotionIds : [],
        bookingItems: Array.from(groupedItems.values()).filter(i => i.serviceId || i.nailVariantId),
      };

      await updateStaffBooking(bookingId, payload);
      toast.success(isVi ? "Đã cập nhật số lượng thành công." : "Quantity updated successfully.");
      setEditingServiceQuantity(null);
      void silentRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update quantity");
    } finally {
      setIsUpdatingBookingItems(false);
    }
  };

  const doDeleteService = async () => {
    if (!staffBookingDetail || itemsToDelete.length === 0) return;
    setIsUpdatingBookingItems(true);
    try {
      const groupedItems = new Map();
      
      // Debug: log to diagnose matching
      console.log("[doDeleteService] itemsToDelete:", itemsToDelete);
      console.log("[doDeleteService] staffBookingDetail.bookingItems:", staffBookingDetail.bookingItems);

      (staffBookingDetail.bookingItems || []).forEach((item) => {
        const sId = String(item.serviceId || "");
        const nId = String(item.nailVariantId || "");
        const key = `${sId}_${nId}`;
        
        const isMatch = itemsToDelete.some(delItem => {
          const dsId = String(delItem.serviceId || "");
          const dnId = String(delItem.nailVariantId || "");
          if (!dsId && !dnId) {
             return String(delItem.bookingItemId || delItem.id) === String(item.bookingItemId || item.id);
          }
          return dsId === sId && dnId === nId;
        });
        
        if (isMatch) return; // Skip deleted item

        if (!groupedItems.has(key)) {
          groupedItems.set(key, {
            nailVariantId: item.nailVariantId,
            serviceId: item.serviceId,
            shapeMethodConfigId: item.shapeMethodConfigId,
            customerNailId: item.customerNailId,
            customerNailRequestId: item.customerNailRequestId,
            quantity: item.quantity || 1
          });
        } else {
          groupedItems.get(key).quantity += (item.quantity || 1);
        }
      });

      const resultingItems = Array.from(groupedItems.values());
      if (resultingItems.length === 0) {
        toast.error(isVi ? "Không thể xóa tất cả dịch vụ. Vui lòng giữ lại ít nhất 1 dịch vụ." : "Cannot delete all services. Please keep at least 1 service.");
        setIsUpdatingBookingItems(false);
        setItemsToDelete([]);
        return;
      }

      const payload = {
        bookingDate: getBookingDateStr(),
        startTime: staffBookingDetail.startTime,
        nailArtistId: staffBookingDetail.nailArtistId || staffBookingDetail.artistId || staffBookingDetail.staffId || null,
        secondaryArtistId: staffBookingDetail.secondaryArtistId || null,
        selectedPromotionIds: Array.isArray(staffBookingDetail.selectedPromotionIds) ? staffBookingDetail.selectedPromotionIds : [],
        bookingItems: resultingItems.filter(i => i.serviceId || i.nailVariantId),
      };

      await updateStaffBooking(bookingId, payload);
      toast.success(isVi ? "Đã xóa dịch vụ thành công." : "Services deleted successfully.");
      setItemsToDelete([]);
      setSelectedServiceIds([]);
      void silentRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete service");
    } finally {
      setIsUpdatingBookingItems(false);
    }
  };

  return (
    <>
      {flashMessage || staffActionMessage ? (
        <div className="rounded-lg bg-[#edfdf4] px-5 py-4 text-sm font-medium text-[#16975f] shadow-[0_14px_30px_rgba(94,76,62,0.06)]">
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
        onEditQuantity={handleEnableEditQuantity}
        onDeleteService={handleDeleteService}
        selectedServiceIds={selectedServiceIds}
        onSelectService={handleSelectService}
        onSelectAllServices={handleSelectAllServices}
        onMultiDelete={handleMultiDeleteServices}
        onOpenUpdateBooking={handleOpenUpdateBooking}
        onStaffNoteChange={handleStaffNoteChange}
        onStartServiceSession={() => void handleOpenServiceSession()}
      />
      <OnsiteAddonModal
        open={showUpdateBookingModal}
        onClose={handleCloseUpdateBooking}
        bookingId={bookingId}
        booking={staffBookingDetail}
        onSuccess={() => {
          handleCloseUpdateBooking();
          setReloadTrigger(prev => prev + 1);
        }}
        onConflict={(data, items) => {
          setConflictData(data);
          setAddonItemsForConflict(items);
          setIsOnsiteConflictModalOpen(true);
        }}
      />
      <OnsiteAddonConflictModal
        open={isOnsiteConflictModalOpen}
        onClose={() => {
          setIsOnsiteConflictModalOpen(false);
          setConflictData(null);
          setAddonItemsForConflict(null);
        }}
        bookingId={bookingId}
        conflictData={conflictData}
        addonItems={addonItemsForConflict}
        onSuccess={() => {
          setIsOnsiteConflictModalOpen(false);
          setConflictData(null);
          setAddonItemsForConflict(null);
          handleCloseUpdateBooking();
          setReloadTrigger(prev => prev + 1);
        }}
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
        showActions={staffBookingDetail?.status === "InProgress"}
      />
      <Modal
        title={isVi ? "Sửa Số lượng" : "Edit Quantity"}
        open={!!editingServiceQuantity}
        onCancel={() => setEditingServiceQuantity(null)}
        footer={null}
        width={320}
        centered
      >
        <div className="py-4 flex flex-col gap-4">
          <p className="text-sm font-semibold text-[#2B182B]">{editingServiceQuantity?.name}</p>
          <div className="flex items-center gap-4 border border-[#F3D6E5] rounded-full p-1 bg-[#FFF5FA]">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[#E84F93] hover:bg-[#F3D6E5] disabled:opacity-50 transition-all font-bold shadow-2xs"
              onClick={() => setTempQuantity(q => Math.max(1, q - 1))}
              disabled={tempQuantity <= 1 || isUpdatingBookingItems}
            >
              -
            </button>
            <span className="flex-1 text-center font-bold text-lg text-[#2B182B]">{tempQuantity}</span>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[#E84F93] hover:bg-[#F3D6E5] disabled:opacity-50 transition-all font-bold shadow-2xs"
              onClick={() => setTempQuantity(q => q + 1)}
              disabled={isUpdatingBookingItems}
            >
              +
            </button>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all disabled:opacity-50"
              onClick={() => setEditingServiceQuantity(null)}
              disabled={isUpdatingBookingItems}
            >
              {isVi ? "Hủy" : "Cancel"}
            </button>
            <button
              className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#E84F93] to-[#F43F5E] hover:from-[#D83A7E] hover:to-[#E11D48] rounded-full shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              onClick={doUpdateServiceQuantity}
              disabled={isUpdatingBookingItems}
            >
              {isUpdatingBookingItems && <LoaderCircle size={16} className="animate-spin" />}
              {isVi ? "Lưu" : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <ActionConfirmModal
        open={itemsToDelete.length > 0}
        title={isVi ? "Xác nhận xóa" : "Confirm Delete"}
        description={
          itemsToDelete.length > 1 
            ? (isVi ? `Bạn có chắc chắn muốn xóa ${itemsToDelete.length} dịch vụ đã chọn? Hành động này không thể hoàn tác.` : `Are you sure you want to delete ${itemsToDelete.length} selected services? This action cannot be undone.`)
            : (isVi ? `Bạn có chắc chắn muốn xóa "${itemsToDelete[0]?.name}"? Hành động này không thể hoàn tác.` : `Are you sure you want to delete "${itemsToDelete[0]?.name}"? This action cannot be undone.`)
        }
        onConfirm={doDeleteService}
        onCancel={() => setItemsToDelete([])}
        loading={isUpdatingBookingItems}
        confirmText={isVi ? "Xóa" : "Delete"}
        cancelText={isVi ? "Hủy" : "Cancel"}
        intent="danger"
      />
    </>
  );
}
