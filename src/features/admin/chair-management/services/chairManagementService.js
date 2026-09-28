import { axiosClient } from "../../../../lib/axiosClient";
import { loadAuthSession } from "../../../core/auth/model/authStorage";

function getAuthHeaders() {
  const session = loadAuthSession();
  const token = session?.accessToken || session?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function unwrapResponse(response, fallbackMessage) {
  const payload = response?.data;
  if (!payload?.isSucceeded) {
    throw new Error(payload?.message || fallbackMessage);
  }
  return payload.data;
}

export const chairManagementService = {
  getChairsBySalonId: async ({ salonId, pageIndex = 1, pageSize = 10, orderBy }) => {
    if (!salonId) throw new Error("Salon ID is required");
    const params = new URLSearchParams();
    if (pageIndex) params.append("PageIndex", pageIndex);
    if (pageSize) params.append("PageSize", pageSize);
    if (orderBy) params.append("OrderBy", orderBy);

    const response = await axiosClient.get(`/salons/${salonId}/chairs?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to fetch chairs");
  },

  getAvailableChairs: async ({ salonId, bookingDate, startTime, duration }) => {
    if (!salonId) throw new Error("Salon ID is required");
    const params = new URLSearchParams();
    if (bookingDate) params.append("bookingDate", bookingDate);
    if (startTime) params.append("startTime", startTime);
    if (duration) params.append("duration", duration);

    const response = await axiosClient.get(`/salons/${salonId}/available-chairs?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to fetch available chairs");
  },

  getChairById: async (id) => {
    if (!id) throw new Error("Chair ID is required");
    const response = await axiosClient.get(`/chairs/${id}`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to fetch chair details");
  },

  createChair: async (chairData) => {
    const response = await axiosClient.post("/chairs", chairData, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to create chair");
  },

  updateChair: async (id, chairData) => {
    if (!id) throw new Error("Chair ID is required");
    const response = await axiosClient.put(`/chairs/${id}`, chairData, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to update chair");
  },

  deleteChair: async (id) => {
    if (!id) throw new Error("Chair ID is required");
    const response = await axiosClient.delete(`/chairs/${id}`, {
      headers: getAuthHeaders(),
    });
    return unwrapResponse(response, "Failed to delete chair");
  }
};
