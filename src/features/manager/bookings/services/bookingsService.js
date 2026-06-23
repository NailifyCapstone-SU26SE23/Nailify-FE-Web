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

function unwrapResponse(response, fallbackMessage, isDetail = false) {
  const payload = response?.data;

  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }

  // Handle nested booking key for detail endpoints
  if (isDetail && payload.data && payload.data.booking) {
    return payload.data.booking;
  }
  
  // Handle both formats: data.items (for lists) or just data (for single items)
  if (payload.data && payload.data.items) {
    return payload.data.items;
  }
  return payload.data;
}

export async function fetchBookingsBySalonId(salonId) {
  console.log("Fetching bookings for salon:", salonId);
  try {
    const response = await axiosClient.get(`/Bookings/salon/${salonId}`, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to load bookings.");
  } catch (error) {
    console.error("Error fetching bookings:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to load bookings.", { cause: error });
  }
}

export async function fetchBookingById(bookingId) {
  const normalizedId = String(bookingId || "").trim();

  if (!normalizedId) {
    throw new Error("Booking ID is required.");
  }

  console.log("Fetching booking by ID:", normalizedId);
  try {
    const response = await axiosClient.get(`/Bookings/${normalizedId}`, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to load booking details.", true);
  } catch (error) {
    console.error("Error fetching booking:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to load booking details.", { cause: error });
  }
}

export async function confirmBooking(bookingId) {
  const normalizedId = String(bookingId || "").trim();

  if (!normalizedId) {
    throw new Error("Booking ID is required.");
  }

  console.log("Confirming booking:", normalizedId);
  try {
    const response = await axiosClient.post(`/Bookings/${normalizedId}/confirm`, null, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to confirm booking.");
  } catch (error) {
    console.error("Error confirming booking:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to confirm booking.", { cause: error });
  }
}

export async function rejectBooking(bookingId) {
  const normalizedId = String(bookingId || "").trim();

  if (!normalizedId) {
    throw new Error("Booking ID is required.");
  }

  console.log("Rejecting booking:", normalizedId);
  try {
    const response = await axiosClient.post(`/Bookings/${normalizedId}/reject`, null, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to reject booking.");
  } catch (error) {
    console.error("Error rejecting booking:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to reject booking.", { cause: error });
  }
}

export async function cancelBooking(bookingId) {
  const normalizedId = String(bookingId || "").trim();

  if (!normalizedId) {
    throw new Error("Booking ID is required.");
  }

  console.log("Cancelling booking:", normalizedId);
  try {
    const response = await axiosClient.post(`/Bookings/${normalizedId}/cancel`, null, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to cancel booking.");
  } catch (error) {
    console.error("Error cancelling booking:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to cancel booking.", { cause: error });
  }
}

export async function fetchSalonStaff(salonId, options = {}) {
  const normalizedId = String(salonId || "").trim();

  if (!normalizedId) {
    throw new Error("Salon ID is required.");
  }

  const { 
    pageNumber = 1, 
    pageSize = 100, 
    role = "Staff_Artist" 
  } = options;

  console.log("Fetching salon staff:", normalizedId, { pageNumber, pageSize, role });
  try {
    const response = await axiosClient.get(`/Users/salon/${normalizedId}/staff`, {
      headers: getAuthHeaders(),
      params: {
        pageNumber,
        pageSize,
        role
      }
    });

    return unwrapResponse(response, "Failed to load salon staff.");
  } catch (error) {
    console.error("Error fetching salon staff:", error.response?.data || error);
    throw new Error(error.response?.data?.message || error.message || "Failed to load salon staff.", { cause: error });
  }
}

export async function assignArtistToBooking(bookingId, staffArtistId) {
  const normalizedBookingId = String(bookingId || "").trim();
  const normalizedStaffId = String(staffArtistId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }
  if (!normalizedStaffId) {
    throw new Error("Staff Artist ID is required.");
  }

  console.log("assignArtistToBooking - Booking ID:", normalizedBookingId, "Staff Artist ID:", normalizedStaffId);
  
  // Get full URL for debugging
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";
  const fullUrl = `${baseUrl}/api/Bookings/${normalizedBookingId}/receptionist-assign-artist`;
  console.log("assignArtistToBooking - Full URL:", fullUrl);
  
  try {
    const response = await axiosClient.post(`/Bookings/${normalizedBookingId}/receptionist-assign-artist`, 
      { staffArtistId: normalizedStaffId },
      { headers: getAuthHeaders() }
    );

    console.log("assignArtistToBooking response status:", response.status);
    console.log("assignArtistToBooking response:", response);
    return unwrapResponse(response, "Failed to assign artist to booking.");
  } catch (error) {
    console.error("Error assigning artist to booking:");
    console.error("- Response status:", error.response?.status);
    console.error("- Response data:", error.response?.data);
    console.error("- Request config:", error.config);
    console.error("- Error message:", error.message);
    throw new Error(error.response?.data?.message || error.message || "Failed to assign artist to booking.", { cause: error });
  }
}
