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
  const items = booking?.bookingItems ?? [];
  const serviceNames = items.map((item) => item.serviceName).filter(Boolean);
  const firstNamedItem = items.find((item) => item.serviceName || item.customerNailName || item.nailVariantName);
  const serviceLabel =
    serviceNames[0] ||
    booking?.service ||
    booking?.uiService ||
    firstNamedItem?.customerNailName ||
    firstNamedItem?.nailVariantName ||
    "--";
  const estimatedDuration =
    booking?.duration ||
    (booking?.totalDuration ? formatDurationMinutes(booking.totalDuration) : "--");
  const appointmentStartTime = booking?.bookingTime || formatTimeValue(booking?.startTime);
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
    customerName: booking?.customerName || "--",
    customerPhone: booking?.customerPhone || "--",
    customerAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=140&q=80",
    serviceLabel,
    staffArtist: booking?.artistName || booking?.staffName || "--",
    chair: "--",
    appointmentTime: `${appointmentStartTime} - ${estimatedDuration}`,
    estimatedDuration,
    estimatedFinishTime: "--",
    completedAt: "--",
    designName:
      firstNamedItem?.customerNailName ||
      firstNamedItem?.nailVariantName ||
      "Confirmed service design",
    totalPrice: totalPriceLabel,
    totalAmount: totalPriceLabel,
    originalServicePrice: totalPriceLabel,
    extraServiceFee: "0 VNĐ",
    discountLabel: "Discount",
    discountValue: "0 VNĐ",
    remainingBalance: totalPriceLabel,
    beforePhotoTimestamp: "--",
    currentProcess: serviceLabel,
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
