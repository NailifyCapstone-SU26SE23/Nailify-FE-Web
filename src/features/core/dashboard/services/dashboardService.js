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
};
