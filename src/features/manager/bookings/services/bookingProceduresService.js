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

function unwrapResponse(response, fallbackMessage) {
  const payload = response?.data;
  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }
  return payload.data;
}

/**
 * BR-01.1: Kiểm tra khả năng làm đè ca Interleaving (Passive Overlapping) khi Khách A Check-in
 */
export async function evaluateInterleavingOpportunity(bookingId) {
  const normalizedId = String(bookingId || "").trim();
  if (!normalizedId) throw new Error("Booking ID is required.");

  try {
    const response = await axiosClient.get(`/BookingProcedures/bookings/${normalizedId}/interleaving-opportunity`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to evaluate interleaving opportunity.");
  } catch (error) {
    console.error("Error evaluating interleaving opportunity:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to evaluate interleaving opportunity.");
  }
}

/**
 * BR-01.2: Tự động điều phối Thợ phụ C làm bước chuẩn bị Prep cho Khách A
 */
export async function autoAssignPrepArtist(bookingId, mainArtistId) {
  const normalizedBookingId = String(bookingId || "").trim();
  const normalizedArtistId = String(mainArtistId || "").trim();
  if (!normalizedBookingId || !normalizedArtistId) throw new Error("Booking ID and Main Artist ID are required.");

  try {
    const response = await axiosClient.post(
      `/BookingProcedures/bookings/${normalizedBookingId}/auto-assign-prep-artist?mainArtistId=${normalizedArtistId}`,
      {},
      { headers: getAuthHeaders() }
    );
    return unwrapResponse(response, "Failed to auto-assign prep artist.");
  } catch (error) {
    console.error("Error auto-assigning prep artist:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to auto-assign prep artist.");
  }
}

/**
 * BR-03.1: Mô phỏng xung đột dịch vụ phát sinh trên POS / App thợ
 */
export async function simulateOnsiteAddon(payload) {
  try {
    const response = await axiosClient.post(`/BookingProcedures/onsite-addon/simulate`, payload, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to simulate on-site add-on.");
  } catch (error) {
    console.error("Error simulating on-site add-on:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to simulate on-site add-on.");
  }
}

/**
 * BR-03.2: Lễ tân / Manager xác nhận phân công thợ phụ phát sinh trên POS
 */
export async function confirmOnsiteAddon(payload) {
  try {
    const response = await axiosClient.post(`/BookingProcedures/onsite-addon/confirm`, payload, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to confirm on-site add-on.");
  } catch (error) {
    console.error("Error confirming on-site add-on:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to confirm on-site add-on.");
  }
}

/**
 * BR-05.1: Manager bật chế độ Tạm nghỉ Khẩn cấp (Emergency Off) cho Thợ Nail
 */
export async function triggerEmergencyOff(artistId, payload) {
  const normalizedId = String(artistId || "").trim();
  if (!normalizedId) throw new Error("Artist ID is required.");

  try {
    const response = await axiosClient.post(`/EmergencyOff/${normalizedId}/emergency-off`, payload, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to trigger emergency off.");
  } catch (error) {
    console.error("Error triggering emergency off:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to trigger emergency off.");
  }
}
