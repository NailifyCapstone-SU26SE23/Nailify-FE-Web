import { axiosClient } from "../../../../lib/axiosClient";
import { formatDurationMinutes } from "../../../../shared/utils/formatDuration";
import { loadAuthSession } from "../../../core/auth/model/authStorage";

function getAuthHeaders() {
  const session = loadAuthSession();
  const token = session?.accessToken || session?.token;

  return token
    ? {
      Authorization: `Bearer ${token}`,
    }
    : {};
}

function unwrapResponse(response, fallbackMessage) {
  const payload = response?.data;

  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload.data;
}

export function getStaffArtistId() {
  const session = loadAuthSession();
  const artistId = session?.user?.staffId || session?.staffId || session?.user?.id || session?.userId;

  if (!artistId) {
    throw new Error("Staff ID is not available in the current session.");
  }

  return artistId;
}

export function getStaffSessionUser() {
  return loadAuthSession()?.user ?? null;
}

export async function fetchStaffBookings(filters = {}) {
  const artistId = getStaffArtistId();
  const {
    endDate,
    pageNumber,
    pageSize,
    search,
    startDate,
    status,
  } = filters ?? {};
  const response = await axiosClient.get(`/Bookings/artist/${artistId}`, {
    headers: getAuthHeaders(),
    params: {
      ...(pageNumber ? { pageNumber } : {}),
      ...(pageSize ? { pageSize } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
    },
  });

  const data = unwrapResponse(response, "Failed to load assigned bookings.");

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

export async function fetchServiceCatalog(filters = {}) {
  const {
    pageNumber = 1,
    pageSize = 10,
    name,
  } = filters ?? {};

  const response = await axiosClient.get("/Services", {
    headers: getAuthHeaders(),
    params: {
      pageNumber,
      pageSize,
      ...(name ? { name } : {}),
    },
  });

  const data = unwrapResponse(response, "Failed to load services.");

  return {
    items: Array.isArray(data?.items) ? data.items.map((item) => ({
      serviceId: String(item?.serviceId || "").trim(),
      name: String(item?.name || "").trim() || "--",
      description: String(item?.description || "").trim(),
      price: Number(item?.price || 0),
      duration: Number(item?.duration || 0),
      status: String(item?.status || "").trim() || "--",
      createAt: String(item?.createAt || "").trim(),
    })) : [],
    metaData: data?.metaData ?? {
      currentPage: 1,
      totalPages: 1,
      pageSize,
      totalItems: 0,
      hasPrevious: false,
      hasNext: false,
      firstRowOnPage: 0,
      lastRowOnPage: 0,
    },
  };
}

export async function fetchStaffBookingDetail(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.get(`/Bookings/${normalizedBookingId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load booking detail.");
}

export async function updateStaffBooking(bookingId, payload) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.put(`/Bookings/${normalizedBookingId}`, payload, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to update booking.");
}

export async function fetchStaffNailVariantDetail(variantId) {
  const normalizedVariantId = Number(variantId || 0);

  if (!Number.isInteger(normalizedVariantId) || normalizedVariantId <= 0) {
    throw new Error("Variant ID is required.");
  }

  const response = await axiosClient.get(`/NailVariants/${normalizedVariantId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load nail variant detail.");

  return {
    nailVariantId: Number(data?.nailVariantId || 0),
    name: String(data?.name || "").trim() || "--",
    nailShapeId: Number(data?.nailShapeId || 0),
    nailSurfaceId: Number(data?.nailSurfaceId || 0),
    nailDesignId: Number(data?.nailDesignId || 0),
    price: Number(data?.price || 0),
    priceLabel: formatCurrency(data?.price || 0),
    duration: Number(data?.duration || 0),
    durationLabel: formatDurationMinutes(Number(data?.duration || 0)),
    imageUrl: String(data?.imageUrl || "").trim(),
    colorJson: String(data?.colorJson || "").trim(),
    nailShape: data?.nailShape
      ? {
        nailShapeId: Number(data.nailShape.nailShapeId || 0),
        name: String(data.nailShape.name || "").trim() || "--",
        imageUrl: String(data.nailShape.imageUrl || "").trim(),
        price: Number(data.nailShape.price || 0),
        duration: Number(data.nailShape.duration || 0),
      }
      : null,
    nailSurface: data?.nailSurface
      ? {
        nailSurfaceId: Number(data.nailSurface.nailSurfaceId || 0),
        name: String(data.nailSurface.name || "").trim() || "--",
        shaderParam: String(data.nailSurface.shaderParam || "").trim(),
        price: Number(data.nailSurface.price || 0),
        duration: Number(data.nailSurface.duration || 0),
      }
      : null,
    nailComponents: Array.isArray(data?.nailComponents)
      ? data.nailComponents.map((item) => ({
        nailComponentId: Number(item?.nailComponentId || 0),
        componentId: Number(item?.componentId || 0),
        fingerIndex: Number(item?.fingerIndex || 0),
        posX: Number(item?.posX || 0),
        posY: Number(item?.posY || 0),
        configJson: String(item?.configJson || "").trim(),
        component: item?.component
          ? {
            componentId: Number(item.component.componentId || 0),
            name: String(item.component.name || "").trim() || "--",
            imageUrl: String(item.component.imageUrl || "").trim(),
            componentType: String(item.component.componentType || "").trim() || "--",
            price: Number(item.component.price || 0),
            duration: Number(item.component.duration || 0),
          }
          : null,
      }))
      : [],
  };
}

export async function fetchStaffCustomerDetail(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    throw new Error("Customer user ID is required.");
  }

  const response = await axiosClient.get(`/Users/${normalizedUserId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load customer detail.");

  return {
    userId: String(data?.userId || "").trim(),
    email: String(data?.email || "").trim(),
    phone: String(data?.phone || "").trim(),
    firstName: String(data?.firstName || "").trim(),
    lastName: String(data?.lastName || "").trim(),
    fullName: [String(data?.firstName || "").trim(), String(data?.lastName || "").trim()]
      .filter(Boolean)
      .join(" ")
      .trim(),
    avatarUrl: String(data?.avatarUrl || "").trim(),
    status: String(data?.status || "").trim(),
    role: String(data?.role || "").trim(),
    salonId: String(data?.salonId || "").trim(),
    staffId: String(data?.staffId || "").trim(),
  };
}

export async function fetchBookingProceduresByBookingItem(bookingItemId) {
  const normalizedBookingItemId = String(bookingItemId || "").trim();

  if (!normalizedBookingItemId) {
    throw new Error("Booking item ID is required.");
  }

  const response = await axiosClient.get(`/BookingProcedures/booking-item/${normalizedBookingItemId}`, {
    headers: getAuthHeaders(),
  });

  const data = unwrapResponse(response, "Failed to load booking procedures.");

  return Array.isArray(data) ? data : [];
}

export async function updateBookingProcedureStatus(bookingProcedureId, status, artistId = getStaffArtistId()) {
  const normalizedBookingProcedureId = String(bookingProcedureId || "").trim();
  const normalizedArtistId = String(artistId || "").trim();
  const normalizedStatus = String(status || "").trim();

  if (!normalizedBookingProcedureId) {
    throw new Error("Booking procedure ID is required.");
  }

  if (!normalizedArtistId) {
    throw new Error("Artist ID is required.");
  }

  if (!normalizedStatus) {
    throw new Error("Procedure status is required.");
  }

  const response = await axiosClient.put(`/BookingProcedures/${normalizedBookingProcedureId}/status`, null, {
    headers: getAuthHeaders(),
    params: {
      artistId: normalizedArtistId,
      status: normalizedStatus,
    },
  });

  return unwrapResponse(response, "Failed to update booking procedure status.");
}

export async function startStaffBookingService(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.post(`/Bookings/${normalizedBookingId}/start`, null, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to start service.");
}

export async function uploadImageBeforeService(bookingId, imageFile) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  if (!(imageFile instanceof File)) {
    throw new Error("Before-service image is required.");
  }

  const formData = new FormData();
  formData.append("BookingId", normalizedBookingId);
  formData.append("Image", imageFile);

  const response = await axiosClient.post("/Bookings/check-in-images", formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapResponse(response, "Failed to check in booking.");
}

export async function uploadImageAfterService(bookingId, imageFile) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  if (!(imageFile instanceof File)) {
    throw new Error("After-service image is required.");
  }

  const formData = new FormData();
  formData.append("Images", imageFile);

  const response = await axiosClient.post(`/Bookings/${normalizedBookingId}/complete-service`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapResponse(response, "Failed to complete service.");
}

export function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDateParam() {
  return toDateInputValue(new Date());
}

export function isTodayBooking(value) {
  return toDateInputValue(value) === getTodayDateParam();
}

export function formatTimeValue(value) {
  return value ? String(value).slice(0, 5) : "--";
}

export function parseDurationMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return 0;
  }

  const matchedMinutes = normalizedValue.match(/(\d+)/);

  return matchedMinutes ? Math.max(0, Number(matchedMinutes[1])) : 0;
}

export function formatAppointmentEndTime(startTime, durationValue) {
  const normalizedStartTime = formatTimeValue(startTime);

  if (normalizedStartTime === "--") {
    return "--";
  }

  const [hoursText = "0", minutesText = "0"] = normalizedStartTime.split(":");
  const baseDate = new Date();
  baseDate.setHours(Number(hoursText), Number(minutesText), 0, 0);

  if (Number.isNaN(baseDate.getTime())) {
    return "--";
  }

  const endDate = new Date(baseDate.getTime() + parseDurationMinutes(durationValue) * 60000);

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(endDate);
}

export function formatCurrency(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "--";
  }

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(amount)} VNĐ`;
}

export function formatBookingCode(bookingId) {
  const normalized = String(bookingId || "").trim();

  if (!normalized) {
    return "--";
  }

  return `BK-${normalized.slice(0, 8).toUpperCase()}`;
}

export function buildStaffServiceSessionPayload(booking, options = {}) {
  const customerDetail = options.customerDetail ?? null;
  const items = booking?.bookingItems ?? [];
  const bookingItemIds = [
    ...new Set(
      items
        .map((item) => String(item?.bookingItemId || item?.id || "").trim())
        .filter(Boolean),
    ),
  ];
  const serviceNames = [...new Set(items.map((item) => String(item?.serviceName || "").trim()).filter(Boolean))];
  const variantNames = [...new Set(items.map((item) => String(item?.nailVariantName || "").trim()).filter(Boolean))];
  const firstNamedItem = items.find((item) => item.serviceName || item.customerNailName || item.nailVariantName);
  const serviceLabel =
    serviceNames.length ? serviceNames.join("\n") :
    booking?.service ||
    booking?.uiService ||
    firstNamedItem?.customerNailName ||
    firstNamedItem?.nailVariantName ||
    "--";
  const currentProcessLabel = [
    serviceNames.length ? serviceNames.join(" | ") : "",
    variantNames[0] || "",
  ].filter(Boolean).join(" | ") || "--";
  const estimatedDuration =
    booking?.duration ||
    (booking?.totalDuration ? formatDurationMinutes(booking.totalDuration) : "--");
  const appointmentStartTime = booking?.bookingTime || formatTimeValue(booking?.startTime);
  const estimatedFinishTime = formatAppointmentEndTime(appointmentStartTime, booking?.totalDuration || booking?.duration);
  const totalPriceLabel =
    booking?.totalPriceLabel ||
    booking?.total ||
    formatCurrency(booking?.totalPrice);

  return {
    bookingCode: formatBookingCode(booking?.bookingId),
    bookingItemId:
      firstNamedItem?.bookingItemId ||
      firstNamedItem?.id ||
      items[0]?.bookingItemId ||
      items[0]?.id ||
      "",
    bookingItemIds,
    customerName:
      customerDetail?.fullName ||
      booking?.customerName ||
      "--",
    customerPhone:
      customerDetail?.phone ||
      booking?.customerPhone ||
      "--",
    customerAvatar:
      customerDetail?.avatarUrl ||
      booking?.customerAvatar ||
      booking?.avatarUrl ||
      "",
    serviceLabel,
    staffArtist: booking?.artistName || booking?.staffName || "--",
    chair: "--",
    appointmentTime: appointmentStartTime,
    estimatedDuration: estimatedFinishTime,
    estimatedFinishTime,
    completedAt: "--",
    designName:
      variantNames[0] ||
      "--",
    totalPrice: totalPriceLabel,
    totalAmount: totalPriceLabel,
    originalServicePrice: totalPriceLabel,
    extraServiceFee: "0 VNĐ",
    discountLabel: "Discount",
    discountValue: "0 VNĐ",
    remainingBalance: totalPriceLabel,
    beforePhotoTimestamp: "--",
    currentProcess: currentProcessLabel,
    remainingTime: estimatedDuration,
    materialsUsed: serviceNames.length ? serviceNames : ["--"],
    stepNote: "",
    customerNotes: [],
    backRoute: options.backRoute || "",
    designUpdateRoute: options.designUpdateRoute || "",
    confirmations: [
      "Customer identity confirmed",
      "Service design confirmed",
      "Price confirmed",
      "Before photo uploaded",
    ],
    started: false,
    completed: false,
  };
}

export function normalizeStaffBooking(booking) {
  const services = booking?.bookingItems?.map((item) => item.serviceName).filter(Boolean) ?? [];
  const previewImage =
    booking?.bookingItems?.find((item) => item.customerNailImageUrl)?.customerNailImageUrl ||
    booking?.checkInImageUrl ||
    booking?.checkOutImagesUrl ||
    "";

  return {
    ...booking,
    id: booking?.bookingId,
    uiId: formatBookingCode(booking?.bookingId),
    customerName: booking?.customerName || "Unknown customer",
    customerPhone: "--",
    branch: booking?.salonName || "--",
    uiBranch: booking?.salonName || "--",
    staffName: booking?.artistName || "--",
    service: services[0] || "--",
    uiService: services[0] || "--",
    services,
    bookingDate: toDateInputValue(booking?.bookingDate),
    bookingDateValue: toDateInputValue(booking?.bookingDate),
    bookingDateTime: booking?.bookingDate || "",
    bookingTime: formatTimeValue(booking?.startTime),
    startTimeValue: booking?.startTime || "",
    duration: booking?.totalDuration ? formatDurationMinutes(booking.totalDuration) : "--",
    status: booking?.status || "Pending",
    uiStatus: booking?.status || "Pending",
    paymentStatus: "--",
    uiPayment: "--",
    total: formatCurrency(booking?.totalPrice),
    totalPriceValue: Number(booking?.totalPrice || 0),
    totalPriceLabel: formatCurrency(booking?.totalPrice),
    previewImage,
  };
}
