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

function unwrapResponse(response, fallbackMessage, isDetail = false, includePagination = false) {
  const payload = response?.data;
  console.log("unwrapResponse payload:", payload);

  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }

  // Handle nested booking key for detail endpoints
  if (isDetail && payload.data && payload.data.booking) {
    return payload.data.booking;
  }

  // Handle both formats: data.items (for lists) or just data (for single items)
  if (payload.data && payload.data.items) {
    if (includePagination) {
      return {
        items: payload.data.items,
        totalCount: payload.data.totalCount,
        pageNumber: payload.data.pageNumber,
        pageSize: payload.data.pageSize,
        totalPages: payload.data.totalPages
      };
    }
    return payload.data.items;
  }
  return payload.data;
}

export async function fetchBookingsBySalonId(salonId, options = {}) {
  const { pageNumber = 1, pageSize = 10 } = options;
  console.log("Fetching bookings for salon:", salonId, { pageNumber, pageSize });
  try {
    const response = await axiosClient.get(`/Bookings/salon/${salonId}`, {
      headers: getAuthHeaders(),
      params: { pageNumber, pageSize }
    });

    return unwrapResponse(response, "Failed to load bookings.", false, true);
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to load bookings.";
    console.error("Error fetching bookings:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
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
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to load booking details.";
    console.error("Error fetching booking:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
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
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to confirm booking.";
    console.error("Error confirming booking:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
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
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to reject booking.";
    console.error("Error rejecting booking:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
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
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to cancel booking.";
    console.error("Error cancelling booking:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
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
    const response = await axiosClient.get(`/Users`, {
      headers: getAuthHeaders(),
      params: {
        pageNumber,
        pageSize,
        role,
        salonId: normalizedId
      }
    });

    return unwrapResponse(response, "Failed to load salon staff.");
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to load salon staff.";
    console.error("Error fetching salon staff:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
  }
}

export async function updateBooking(bookingId, updateData) {
  const normalizedBookingId = String(bookingId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }

  console.log("updateBooking - Booking ID:", normalizedBookingId, "Update data:", updateData);

  try {
    const response = await axiosClient.put(`/Bookings/${normalizedBookingId}`,
      updateData,
      { headers: getAuthHeaders() }
    );

    console.log("updateBooking response status:", response?.status);
    console.log("updateBooking response:", response);
    return unwrapResponse(response, "Failed to update booking.");
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to update booking.";
    console.error("Error updating booking:");
    console.error("- Response status:", error?.response?.status);
    console.error("- Response data:", error?.response?.data);
    console.error("- Request config:", error?.config);
    console.error("- Error message:", error?.message);
    throw new Error(errorMessage, { cause: error });
  }
}

// Old assign API (POST /receptionist-assign-artist)
export async function assignArtistToBookingOld(bookingId, staffArtistId, slotInfo = null) {
  const normalizedBookingId = String(bookingId || "").trim();
  const normalizedStaffId = String(staffArtistId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }
  if (!normalizedStaffId) {
    throw new Error("Staff Artist ID is required.");
  }

  console.log("assignArtistToBookingOld - Booking ID:", normalizedBookingId, "Staff Artist ID:", normalizedStaffId, "Slot:", slotInfo);

  const payload = { staffArtistId: normalizedStaffId };
  if (slotInfo) {
    payload.slotStartTime = slotInfo.startTime;
    payload.slotEndTime = slotInfo.endTime;
  }

  try {
    const response = await axiosClient.post(`/Bookings/${normalizedBookingId}/receptionist-assign-artist`,
      payload,
      { headers: getAuthHeaders() }
    );
    console.log("assignArtistToBookingOld response status:", response?.status);
    return unwrapResponse(response, "Failed to assign artist to booking (old endpoint).");
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to assign artist to booking (old endpoint).";
    console.error("Error assigning artist to booking (old endpoint):");
    console.error("- Response status:", error?.response?.status);
    console.error("- Response data:", error?.response?.data);
    console.error("- Request config:", error?.config);
    throw new Error(errorMessage, { cause: error });
  }
}

// New assign API using PUT /Bookings/{id}
export async function assignArtistToBooking(bookingId, staffArtistId, slotInfo = null, bookingDate = null, bookingItems = []) {
  const normalizedBookingId = String(bookingId || "").trim();
  const normalizedStaffId = String(staffArtistId || "").trim();

  if (!normalizedBookingId) {
    throw new Error("Booking ID is required.");
  }
  if (!normalizedStaffId) {
    throw new Error("Staff Artist ID is required.");
  }

  console.log("assignArtistToBooking - Booking ID:", normalizedBookingId, "Staff Artist ID:", normalizedStaffId, "Slot:", slotInfo, "Booking date:", bookingDate);

  const payload = { nailArtistId: normalizedStaffId };
  if (bookingDate) {
    payload.bookingDate = bookingDate;
  }
  if (slotInfo) {
    payload.startTime = slotInfo.startTime;
  }
  if (bookingItems && bookingItems.length > 0) {
    payload.bookingItems = bookingItems;
  }

  try {
    const response = await axiosClient.put(`/Bookings/${normalizedBookingId}`,
      payload,
      { headers: getAuthHeaders() }
    );
    console.log("assignArtistToBooking response status:", response?.status);
    return unwrapResponse(response, "Failed to assign artist to booking (new endpoint).");
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to assign artist to booking (new endpoint).";
    console.error("Error assigning artist to booking (new endpoint):");
    console.error("- Response status:", error?.response?.status);
    console.error("- Response data:", error?.response?.data);
    console.error("- Request config:", error?.config);
    throw new Error(errorMessage, { cause: error });
  }
}

export async function fetchArtistBusySlots(nailArtistId, bookingDate) {
  console.log("=== fetchArtistBusySlots ===");
  console.log("Params:", { nailArtistId, bookingDate });

  try {
    const response = await axiosClient.get("/Bookings/artist-available-slots", {
      headers: getAuthHeaders(),
      params: {
        nailArtistId,
        bookingDate
      }
    });

    console.log("Axios raw response:", response);
    console.log("Axios response.data:", response?.data);

    return unwrapResponse(response, "Failed to load artist busy slots.");
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to load artist busy slots.";
    console.error("=== fetchArtistBusySlots ERROR ===");
    console.error("Error:", error);
    console.error("Error response data:", error?.response?.data);
    throw new Error(errorMessage, { cause: error });
  }
}

export async function fetchUserById(userId) {
  const normalizedId = String(userId || "").trim();

  if (!normalizedId) {
    throw new Error("User ID is required.");
  }

  console.log("Fetching user by ID:", normalizedId);
  try {
    const response = await axiosClient.get(`/Users/${normalizedId}`, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to load user details.");
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to load user details.";
    console.error("Error fetching user:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
  }
}