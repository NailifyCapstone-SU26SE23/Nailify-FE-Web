import { axiosClient } from "../../../../lib/axiosClient";

export const chairsService = {
  getChairsBySalon: async (salonId) => {
    const response = await axiosClient.get(`/salons/${salonId}/chairs`);
    // Assuming the response structure is { data: { items: [...] } }
    return response.data?.data?.items || [];
  },

  getLiveChairStatus: async (salonId, date) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const atTime = `${hours}:${minutes}:${seconds}`;

    const response = await axiosClient.get(`/salons/${salonId}/chairs-status`, {
      params: { atDate: date, atTime },
    });
    const items = response.data?.data || [];
    return items.map(item => ({
      ...item,
      currentCustomer: item.occupiedByCustomerName,
    }));
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
