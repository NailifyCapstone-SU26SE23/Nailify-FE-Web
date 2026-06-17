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
  const salonId = import.meta.env.VITE_RECEPTIONIST_SALON_ID?.trim();

  if (!salonId) {
    throw new Error("Missing VITE_RECEPTIONIST_SALON_ID in .env");
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

export async function fetchReceptionistBookings(date) {
  const salonId = getSalonId();
  const response = await axiosClient.get(`/Bookings/salon/${salonId}`, {
    headers: getAuthHeaders(),
    params: date
      ? {
        date,
      }
      : undefined,
  });

  return unwrapResponse(response, "Failed to load salon bookings.");
}

export async function fetchReceptionistBookingDetail(bookingId) {
  const response = await axiosClient.get(`/Bookings/${bookingId}`, {
    headers: getAuthHeaders(),
  });

  return unwrapResponse(response, "Failed to load booking detail.");
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
