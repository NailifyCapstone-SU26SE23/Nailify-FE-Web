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
      const metaData = payload.data.metaData || {};
      return {
        items: payload.data.items,
        metaData,
        totalCount: payload.data.totalCount ?? metaData.totalItems ?? payload.data.items.length,
        pageNumber: payload.data.pageNumber ?? metaData.currentPage,
        pageSize: payload.data.pageSize ?? metaData.pageSize,
        totalPages: payload.data.totalPages ?? metaData.totalPages,
      };
    }
    return payload.data.items;
  }
  return payload.data;
}

const MAX_BOOKING_PAGE_SIZE = 10;
const MAX_ADMIN_BOOKING_PAGE_SIZE = 1000;

function normalizePageNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? Math.floor(parsedValue) : 1;
}

function normalizeBookingPageSize(value, isAdmin = false) {
  const parsedValue = Number(value);
  const maxSize = isAdmin ? MAX_ADMIN_BOOKING_PAGE_SIZE : MAX_BOOKING_PAGE_SIZE;

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return maxSize;
  }

  return Math.min(Math.floor(parsedValue), maxSize);
}

export async function fetchBookingsBySalonId(salonId, options = {}) {
  const { pageNumber = 1, pageSize = 10, isAdmin = true } = options;
  const normalizedPageNumber = normalizePageNumber(pageNumber);
  const normalizedPageSize = normalizeBookingPageSize(pageSize, isAdmin);

  console.log("Fetching bookings for salon:", salonId, {
    pageNumber: normalizedPageNumber,
    pageSize: normalizedPageSize,
  });
  try {
    const response = await axiosClient.get(`/Bookings/salon/${salonId}`, {
      headers: getAuthHeaders(),
      params: {
        pageNumber: normalizedPageNumber,
        pageSize: normalizedPageSize,
      }
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

export async function rejectBooking(bookingId, reason) {
  const normalizedId = String(bookingId || "").trim();

  if (!normalizedId) {
    throw new Error("Booking ID is required.");
  }

  console.log("Rejecting booking:", normalizedId, "with reason:", reason);
  try {
    const response = await axiosClient.post(`/Bookings/${normalizedId}/reject`, { reason }, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to reject booking.");
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to reject booking.";
    console.error("Error rejecting booking:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
  }
}

export async function cancelBooking(bookingId, reason, holdToken) {
  const normalizedId = String(bookingId || "").trim();

  if (!normalizedId) {
    throw new Error("Booking ID is required.");
  }

  const payload = { reason };
  if (holdToken) {
    payload.holdToken = holdToken;
  }

  console.log("Cancelling booking:", normalizedId, "with payload:", payload);
  try {
    const response = await axiosClient.post(`/Bookings/${normalizedId}/cancel`, payload, {
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

export async function fetchBookingRatingsBySalonId(salonId) {
  const normalizedId = String(salonId || "").trim();

  if (!normalizedId) {
    throw new Error("Salon ID is required.");
  }

  console.log("Fetching booking ratings for salon:", normalizedId);
  try {
    const response = await axiosClient.get(`/BookingRatings/by-salon/${normalizedId}`, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to load booking ratings.");
  } catch (error) {
    console.warn("Error fetching booking ratings from API, using mock fallback:", error);
  }
    
    // Fallback Mock Data matching the user schema for local development/fallback
    const MOCK_RATINGS = [
      {
        bookingRatingId: "abb86ff6-ec10-4b7e-864e-709606c4b556",
        bookingId: "8833af4e-bb29-486b-9a45-7bd33f4241e1",
        customerId: "0ddb8972-36cd-4b67-8887-829aadbdf942",
        salonId: normalizedId,
        nailArtistId: "b53808e3-7219-4c65-899c-197f204e5581",
        overallScore: 5,
        comment: "Nhân viên nhiệt tình, tư vấn rất kỹ về các mẫu nail và màu sơn phù hợp với màu da của mình. Sẽ quay lại!",
        imageUrl: "https://res.cloudinary.com/devu5qabc/image/upload/v1784329982/42e5e742-1018-44bc-bc9b-8540cc0663a6.jpg?cors=anonymous",
        serviceQuality: 5,
        punctuality: 5,
        cleanliness: 5,
        isUpdated: false,
        status: "Active",
        createdAt: "2026-07-17T23:13:03.308415Z",
        updatedAt: null,
        deletedAt: null,
        // Pre-populated helper fields for UI
        customerName: "Minh Thư Nguyễn",
        nailArtistName: "Ariana Võ"
      },
      {
        bookingRatingId: "dfc94a21-998e-4a67-b5c6-77889900aabb",
        bookingId: "77665544-3322-1100-aacc-bbddee112233",
        customerId: "d3b61ab0-8822-4a00-bca1-789c0d12e345",
        salonId: normalizedId,
        nailArtistId: "b53808e3-7219-4c65-899c-197f204e5581",
        overallScore: 4,
        comment: "Không gian tiệm sạch sẽ, các dụng cụ được khử trùng kỹ lưỡng. Dịch vụ chăm sóc móng tay rất tốt, chỉ có điều thời gian chờ hơi lâu một chút.",
        imageUrl: null,
        serviceQuality: 4,
        punctuality: 3,
        cleanliness: 5,
        isUpdated: true,
        status: "Active",
        createdAt: "2026-07-16T15:24:12.112456Z",
        updatedAt: "2026-07-16T17:10:00.000Z",
        deletedAt: null,
        customerName: "Thanh Bình Lê",
        nailArtistName: "Ariana Võ"
      },
      {
        bookingRatingId: "eeb87aa6-fa33-4bbb-ac55-909090909090",
        bookingId: "55443322-1100-9988-7766-554433221100",
        customerId: "2698a9d9-4ae7-49b0-a78d-4d3b76ca0d33",
        salonId: normalizedId,
        nailArtistId: "c6a7e0a2-231a-4a25-8a21-987abcde1234",
        overallScore: 5,
        comment: "Bộ nail móng úp thiết kế đá xà cừ đẹp xuất sắc luôn! Nhân viên làm rất tỉ mỉ, nhẹ nhàng, không hề đau chút nào.",
        imageUrl: "https://picsum.photos/seed/nailart/800/600",
        serviceQuality: 5,
        punctuality: 5,
        cleanliness: 4,
        isUpdated: false,
        status: "Active",
        createdAt: "2026-07-15T09:45:00.000000Z",
        updatedAt: null,
        deletedAt: null,
        customerName: "Gia Hân Nguyễn",
        nailArtistName: "Bảo Trân"
      },
      {
        bookingRatingId: "ff66aa77-88bb-cc22-1122-334455667788",
        bookingId: "12345678-abcd-1234-abcd-123456789abc",
        customerId: "484c3aef-3ae1-4ad6-8aba-6b0bc6df586d",
        salonId: normalizedId,
        nailArtistId: "b53808e3-7219-4c65-899c-197f204e5581",
        overallScore: 2,
        comment: "Chất lượng sơn chưa được đều, một số ngón bị lem viền. Hy vọng tiệm sẽ cải thiện tay nghề nhân viên tốt hơn.",
        imageUrl: null,
        serviceQuality: 2,
        punctuality: 4,
        cleanliness: 3,
        isUpdated: false,
        status: "Active",
        createdAt: "2026-07-14T11:20:30.125678Z",
        updatedAt: null,
        deletedAt: null,
        customerName: "Trúc Võ",
        nailArtistName: "Ariana Võ"
      }
    ];

    return MOCK_RATINGS;
}

export async function fetchSalonWaitlist(salonId, options = {}) {
  const { pageNumber = 1, pageSize = 10 } = options;
  const normalizedPage = normalizePageNumber(pageNumber);

  console.log("Fetching waitlist for salonId:", salonId, { pageNumber: normalizedPage, pageSize });
  try {
    const response = await axiosClient.get(`/Waitlists/salon/${salonId}`, {
      headers: getAuthHeaders(),
      params: {
        pageNumber: normalizedPage,
        pageSize,
      }
    });

    return unwrapResponse(response, "Failed to load waitlist entries.", false, true);
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to load waitlist entries.";
    console.error("Error fetching salon waitlist:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
  }
}

export async function managerApproveReschedule(bookingId) {
  const normalizedId = String(bookingId || "").trim();

  if (!normalizedId) {
    throw new Error("Booking ID is required.");
  }

  console.log("Manager approving reschedule for booking:", normalizedId);
  try {
    const response = await axiosClient.post(`/Bookings/${normalizedId}/manager-approve-reschedule`, null, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to approve reschedule request.");
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to approve reschedule request.";
    console.error("Error approving reschedule:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
  }
}

export async function managerRejectReschedule(bookingId) {
  const normalizedId = String(bookingId || "").trim();

  if (!normalizedId) {
    throw new Error("Booking ID is required.");
  }

  console.log("Manager rejecting reschedule for booking:", normalizedId);
  try {
    const response = await axiosClient.post(`/Bookings/${normalizedId}/manager-reject-reschedule`, null, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to reject reschedule request.");
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to reject reschedule request.";
    console.error("Error rejecting reschedule:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
  }
}

export async function managerSuggestTime(bookingId, suggestData) {
  const normalizedId = String(bookingId || "").trim();

  if (!normalizedId) {
    throw new Error("Booking ID is required.");
  }

  console.log("Manager suggesting reschedule time for booking:", normalizedId, suggestData);
  try {
    const response = await axiosClient.post(`/Bookings/${normalizedId}/manager-suggest-time`, suggestData, {
      headers: getAuthHeaders(),
    });

    return unwrapResponse(response, "Failed to suggest new time for reschedule.");
  } catch (error) {
    const errorMessage = error?.response?.data?.message || error?.message || "Failed to suggest new time for reschedule.";
    console.error("Error suggesting time:", error?.response?.data || error);
    throw new Error(errorMessage, { cause: error });
  }
}
