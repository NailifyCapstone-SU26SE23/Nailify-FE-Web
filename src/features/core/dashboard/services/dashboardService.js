import { axiosClient } from "../../../../lib/axiosClient";
import { loadAuthSession } from "../../auth/model/authStorage";

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
  
  if (payload && payload.isSucceeded === false) {
    throw new Error(payload?.message || fallbackMessage);
  }
  
  // Return payload.data if it exists (standard wrapper), otherwise return payload directly
  return payload?.data !== undefined ? payload.data : payload;
}

export const dashboardService = {
  getAdminDashboard: async (startDate, endDate, groupBy) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (groupBy) params.groupBy = groupBy;
    
    const response = await axiosClient.get("/Dashboard/admin", { 
      params,
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load dashboard data");
  },
  getStaffDashboard: async (artistId, startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosClient.get(`/Dashboard/nail-artist/${artistId}`, { 
      params,
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load staff dashboard data");
  },
  getStaffSkills: async (artistId) => {
    const response = await axiosClient.get(`/nail-artists/${artistId}/skills`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load staff skills");
  },
  getManagerDashboard: async (salonId, startDate, endDate, groupBy) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (groupBy) params.groupBy = groupBy;
    
    const response = await axiosClient.get(`/Dashboard/salon/${salonId}`, { 
      params,
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load manager dashboard data");
  },
  getRecentUsers: async () => {
    const response = await axiosClient.get("/Users", {
      params: { pageNumber: 1, pageSize: 8 },
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load recent users");
  },
  getSalonDetails: async (id) => {
    const response = await axiosClient.get(`/Salons/${id}`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load salon details");
  },
  getManagers: async () => {
    const response = await axiosClient.get("/Users", {
      params: { role: "Manager", pageSize: 100 },
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load managers");
  },
  getStaffs: async () => {
    const response = await axiosClient.get("/Users", {
      params: { role: "Staff", pageSize: 1000 },
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load staffs");
  },
  getSalonStaffs: async (salonId) => {
    const response = await axiosClient.get("/Users", {
      params: { pageNumber: 1, pageSize: 100, role: "Staff_Artist", salonId },
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load salon staffs");
  },
  getNailArtistDashboard: async (artistId, startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosClient.get(`/Dashboard/nail-artist/${artistId}`, {
      params,
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load artist dashboard");
  },
  getUserDetail: async (userId) => {
    const response = await axiosClient.get(`/Users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load user details");
  },
  getReceptionistDashboard: async (salonId, date) => {
    const params = {};
    if (date) params.date = date;
    const response = await axiosClient.get(`/Dashboard/receptionist/${salonId}`, {
      params,
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load receptionist dashboard data");
  },
  getWalkInQueue: async (salonId) => {
    const response = await axiosClient.get(`/WalkInQueues/salon/${salonId}/today`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load walk-in queue");
  },
  getWaitlist: async (salonId) => {
    const response = await axiosClient.get(`/Waitlists/salon/${salonId}?pageNumber=1&pageSize=10`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load waitlist");
  },
  getStaffArtists: async (salonId) => {
    const response = await axiosClient.get(`/Users/salon/${salonId}/staff?pageNumber=1&pageSize=100&role=Staff_Artist`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to load staff artists");
  },
  getArtistAvailableSlots: async (artistId, date) => {
    try {
      const response = await axiosClient.get(`/Bookings/artist-available-slots`, {
        params: {
          NailArtistId: artistId,
          BookingDate: date,
        },
        headers: getAuthHeaders(),
      });
      return unwrapResponse(response, "Failed to load artist slots");
    } catch (error) {
      if (error.response?.data?.message === "Thợ nail không có lịch làm việc trong ngày này.") {
        return { isOffToday: true };
      }
      throw error;
    }
  },
};
