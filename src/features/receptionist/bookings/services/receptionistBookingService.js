import { axiosClient } from "../../../../lib/axiosClient";
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

function getSalonId() {
  const session = loadAuthSession();
  const salonId = session?.user?.salonId || session?.salonId;

  if (!salonId) {
    throw new Error("Salon ID is not available in the current account profile.");
  }

  return salonId;
}

export function getReceptionistSalonId() {
  return getSalonId();
}

function unwrapResponse(response, fallbackMessage) {
  const payload = response?.data;

  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload.data;
}

function extractBookingItems(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function extractPaginationMeta(data, fallbackPageSize) {
  const totalCount =
    Number(data?.totalCount ?? data?.totalItems ?? data?.count ?? data?.total ?? 0) || 0;
  const currentPage =
    Number(data?.pageNumber ?? data?.currentPage ?? data?.pageIndex ?? 1) || 1;
  const pageSize =
    Number(data?.pageSize ?? data?.limit ?? fallbackPageSize ?? 10) || fallbackPageSize || 10;
  const inferredTotalPages =
    pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  const totalPages =
    Number(data?.totalPages ?? data?.pageCount ?? inferredTotalPages) || inferredTotalPages;

  return {
    currentPage,
    pageSize,
    totalCount,
    totalPages: Math.max(1, totalPages),
  };
}

const MAX_BOOKING_PAGE_SIZE = 10;

function normalizePageNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? Math.floor(parsedValue) : 1;
}

function normalizeBookingPageSize(value) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return MAX_BOOKING_PAGE_SIZE;
  }

  return Math.min(Math.floor(parsedValue), MAX_BOOKING_PAGE_SIZE);
}

export async function fetchReceptionistBookings(optionsOrDate) {
  const salonId = getSalonId();
  const isLegacyDateArg = typeof optionsOrDate === "string";
  const options = isLegacyDateArg ? { date: optionsOrDate } : optionsOrDate ?? {};
  const {
    date,
    startDate,
    endDate,
    includePagination = false,
    pageNumber,
    pageSize,
  } = options;
  const normalizedPageNumber = normalizePageNumber(pageNumber ?? 1);
  const normalizedPageSize = normalizeBookingPageSize(pageSize ?? MAX_BOOKING_PAGE_SIZE);

  const queryParams = {
    pageNumber: normalizedPageNumber,
    pageSize: normalizedPageSize,
  };

  if (startDate) {
    queryParams.startDate = startDate;
  } else if (date) {
    queryParams.startDate = date;
  }

  if (endDate) {
    queryParams.endDate = endDate;
  } else if (date) {
    queryParams.endDate = date;
  }

  const response = await axiosClient.get(`/Bookings/salon/${salonId}`, {
    headers: getAuthHeaders(),
    params: queryParams,
  });

  const data = unwrapResponse(response, "Failed to load salon bookings.");
  const items = extractBookingItems(data);

  if (includePagination) {
    return {
      items,
      pagination: extractPaginationMeta(data, normalizedPageSize),
    };
  }

  return items;
}

export async function fetchReceptionistBookingDetail(bookingId) {
  const response = await axiosClient.get(`/Bookings/${bookingId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load booking detail.");
}

export async function fetchReceptionistBookingProcedures(bookingItemId) {
  const normalizedBookingItemId = String(bookingItemId || "").trim();

  if (!normalizedBookingItemId) {
    throw new Error("Booking item ID is required.");
  }

  const response = await axiosClient.get(`/BookingProcedures/booking-item/${normalizedBookingItemId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load booking procedures.");
}

export async function fetchReceptionistProcedureAvailableArtists(bookingProcedureId) {
  const normalizedBookingProcedureId = String(bookingProcedureId || "").trim();

  if (!normalizedBookingProcedureId) {
    throw new Error("Booking procedure ID is required.");
  }

  const response = await axiosClient.get(
    `/BookingProcedures/${normalizedBookingProcedureId}/available-artists`,
    {
      headers: getAuthHeaders(),
    },
  );

  return unwrapResponse(response, "Failed to load available artists for this procedure.");
}

export async function updateReceptionistProcedureArtist(bookingProcedureId, artistId) {
  const normalizedBookingProcedureId = String(bookingProcedureId || "").trim();
  const normalizedArtistId = String(artistId || "").trim();

  if (!normalizedBookingProcedureId) {
    throw new Error("Booking procedure ID is required.");
  }

  if (!normalizedArtistId) {
    throw new Error("Artist ID is required.");
  }

  const response = await axiosClient.put(
    `/BookingProcedures/${normalizedBookingProcedureId}/status`,
    null,
    {
      headers: getAuthHeaders(),
      params: {
        artistId: normalizedArtistId,
        // status: "InProgress", //Pending
        status: "Pending",
      },
    },
  );

  return unwrapResponse(response, "Failed to assign artist to procedure.");
}

export async function verifyReceptionistQrToken(qrToken) {
  const normalizedToken = String(qrToken || "").trim();

  if (!normalizedToken) {
    throw new Error("QR token is required for check-in verification.");
  }

  const response = await axiosClient.post("/Bookings/verify-qr", null, {
    headers: getAuthHeaders(),
    params: {
      qrToken: normalizedToken,
    },
  });

  return unwrapResponse(response, "Failed to verify QR token.");
}

export async function fetchReceptionistCustomerDetail(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId) {
    throw new Error("Customer user ID is required.");
  }

  const response = await axiosClient.get(`/Users/${normalizedUserId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load customer detail.");
}

export async function fetchReceptionistSalonDetail(salonId = getSalonId()) {
  const normalizedSalonId = String(salonId || "").trim();

  if (!normalizedSalonId) {
    throw new Error("Salon ID is required.");
  }

  const response = await axiosClient.get(`/Salons/${normalizedSalonId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load salon detail.");
}

export async function confirmReceptionistBooking(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.post(`/Bookings/${normalizedBookingId}/confirm`, null, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to confirm booking.");
}

export async function rejectReceptionistBooking(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.post(`/Bookings/${normalizedBookingId}/reject`, null, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to reject booking.");
}

export async function manualCheckInReceptionistBooking(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.post(`/Bookings/${normalizedBookingId}/manual-checkin`, null, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to check in booking.");
}

export async function checkoutReceptionistBooking(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const formData = new FormData();
  formData.append("BookingId", normalizedBookingId);

  const response = await axiosClient.post("/Bookings/check-out", formData, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to check out booking.");
}

export async function fetchAvailableArtistsForReceptionist(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  const response = await axiosClient.get(
    `/Bookings/${normalizedBookingId}/available-artists-for-receptionist`,
    {
      headers: getAuthHeaders(),
    },
  );

  return unwrapResponse(response, "Failed to load available artists.");
}

export async function assignReceptionistArtistToBooking(bookingId, staffArtistId) {
  const normalizedBookingId = String(bookingId || "").trim();
  const normalizedStaffArtistId = String(staffArtistId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  if (!normalizedStaffArtistId) {
    throw new Error("Staff artist ID is required.");
  }

  const response = await axiosClient.post(
    `/Bookings/${normalizedBookingId}/receptionist-assign-artist`,
    {
      staffArtistId: normalizedStaffArtistId,
    },
    {
      headers: getAuthHeaders(),
    },
  );

  return unwrapResponse(response, "Failed to assign artist to booking.");
}

export async function getBookingHistories(bookingId) {
  const normalizedBookingId = String(bookingId || "").trim();
  if (!normalizedBookingId) throw new Error("Booking ID is required.");
  
  const response = await axiosClient.get(`/BookingHistories/booking/${normalizedBookingId}?pageNumber=1&pageSize=100`, {
    headers: getAuthHeaders(),
  });
  return unwrapResponse(response, "Failed to load booking history.");
}

export async function getUserById(userId) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) throw new Error("User ID is required.");
  
  const response = await axiosClient.get(`/Users/${normalizedUserId}`, {
    headers: getAuthHeaders(),
  });
  return unwrapResponse(response, "Failed to load user info.");
}

export async function fetchSalonChairs(salonId) {
  const normalizedSalonId = String(salonId || "").trim();
  if (!normalizedSalonId) throw new Error("Salon ID is required.");

  const response = await axiosClient.get(`/Salons/${normalizedSalonId}/chairs`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load salon chairs.");
}

export async function fetchAvailableSalonChairs(salonId, params = {}) {
  const normalizedSalonId = String(salonId || "").trim();
  if (!normalizedSalonId) throw new Error("Salon ID is required.");

  const response = await axiosClient.get(`/Salons/${normalizedSalonId}/available-chairs`, {
    headers: getAuthHeaders(),
    params,
  });

  return unwrapResponse(response, "Failed to load available salon chairs.");
}

export async function assignChairToBooking(bookingId, chairId) {
  const normalizedBookingId = String(bookingId || "").trim();
  const normalizedChairId = String(chairId || "").trim();

  if (!normalizedBookingId) throw new Error("Booking ID is required.");
  if (!normalizedChairId) throw new Error("Chair ID is required.");

  const response = await axiosClient.post(`/Bookings/${normalizedBookingId}/assign-chair/${normalizedChairId}`, null, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to assign chair to booking.");
}