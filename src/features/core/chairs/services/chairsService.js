import { axiosClient } from "../../../../lib/axiosClient";

export const chairsService = {
  getChairsBySalon: async (salonId) => {
    const response = await axiosClient.get(`/salons/${salonId}/chairs`);
    // Assuming the response structure is { data: { items: [...] } }
    return response.data?.data?.items || [];
  },

  getLiveChairStatus: async (salonId, date) => {
    // We can fetch liveChairStatus from the dashboard endpoint
    const response = await axiosClient.get(`/Dashboard/receptionist/${salonId}`, {
      params: { date },
    });
    return response.data?.liveChairStatus || [];
  },

  getChairDetail: async (chairId) => {
    const response = await axiosClient.get(`/chairs/${chairId}`);
    return response.data?.data || null;
  },

  getSalonBookings: async (salonId, params) => {
    const response = await axiosClient.get(`/Bookings/salon/${salonId}`, { params });
    return response.data?.data || { items: [], metaData: {} };
  },

  assignBookingToChair: async (bookingId, chairId) => {
    const response = await axiosClient.post(`/Bookings/${bookingId}/assign-chair/${chairId}`);
    return response.data?.data || null;
  }
};
