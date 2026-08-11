import { axiosClient } from "../../../../lib/axiosClient";

export const receptionistWalkInBookingService = {
  getNailDesigns: async (params = {}) => {
    try {
      const response = await axiosClient.get("/NailDesigns", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching Nail Designs:", error);
      throw error;
    }
  },

  getNailVariantsByDesignId: async (nailDesignId) => {
    try {
      const response = await axiosClient.get("/NailVariants", {
        params: { nailDesignId, pageSize: 50 }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching nail variants:", error);
      throw error;
    }
  },

  getServices: async (params = {}) => {
    try {
      const response = await axiosClient.get("/Services", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching Services:", error);
      throw error;
    }
  },

  getAllNailVariants: async (params = {}) => {
    try {
      const response = await axiosClient.get("/NailVariants", {
        params: { pageSize: 100, ...params }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all nail variants:", error);
      throw error;
    }
  },

  getSuggestedArtists: async (payload) => {
    try {
      const response = await axiosClient.post("/Bookings/suggested-artists", payload);
      return response.data;
    } catch (error) {
      console.error("Error fetching suggested artists:", error);
      throw error;
    }
  },

  createBooking: async (payload) => {
    try {
      const response = await axiosClient.post("/Bookings", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  createWalkInQueue: async (payload) => {
    try {
      const response = await axiosClient.post("/WalkInQueues", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating Walk-In Queue:", error);
      throw error;
    }
  },

  getTodayQueue: async (salonId) => {
    try {
      const response = await axiosClient.get(`/WalkInQueues/salon/${salonId}/today`);
      return response.data;
    } catch (error) {
      console.error("Error fetching today Walk-In Queue:", error);
      throw error;
    }
  },

  callQueue: async (queueId) => {
    try {
      const response = await axiosClient.post(`/WalkInQueues/${queueId}/call`);
      return response.data;
    } catch (error) {
      console.error("Error calling queue:", error);
      throw error;
    }
  },

  assignArtistToQueue: async (queueId, payload) => {
    try {
      const response = await axiosClient.post(`/WalkInQueues/${queueId}/assign-artist`, payload);
      return response.data;
    } catch (error) {
      console.error("Error assigning artist to queue:", error);
      throw error;
    }
  },

  completeQueue: async (queueId) => {
    try {
      const response = await axiosClient.post(`/WalkInQueues/${queueId}/complete`);
      return response.data;
    } catch (error) {
      console.error("Error completing queue:", error);
      throw error;
    }
  },

  markQueueLeft: async (queueId) => {
    try {
      const response = await axiosClient.post(`/WalkInQueues/${queueId}/mark-left`);
      return response.data;
    } catch (error) {
      console.error("Error marking queue left:", error);
      throw error;
    }
  },

  prioritizeQueue: async (queueId) => {
    try {
      const response = await axiosClient.post(`/WalkInQueues/${queueId}/prioritize`);
      return response.data;
    } catch (error) {
      console.error("Error prioritizing queue:", error);
      throw error;
    }
  },

  convertQueueToBooking: async (queueId, payload = {}) => {
    try {
      const response = await axiosClient.post(`/WalkInQueues/${queueId}/convert-to-booking`, payload);
      return response.data;
    } catch (error) {
      console.error("Error converting queue to booking:", error);
      throw error;
    }
  },

  getAvailableArtists: async (salonId) => {
    try {
      const response = await axiosClient.get("/NailArtists", {
        params: { pageSize: 50, salonId }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching artists:", error);
      throw error;
    }
  },

  getArtistSchedule: async (artistId, startDate, endDate) => {
    try {
      const response = await axiosClient.get(`/Schedules/artist/${artistId}`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching schedule for artist ${artistId}:`, error);
      throw error;
    }
  },

  searchCustomers: async (searchTerm) => {
    try {
      const response = await axiosClient.get("/Users", {
        params: { role: "Customer", pageSize: 10, searchTerm }
      });
      return response.data;
    } catch (error) {
      console.error("Error searching customers:", error);
      throw error;
    }
  },

  registerCustomer: async (payload) => {
    try {
      const response = await axiosClient.post("/Auth/register", payload);
      return response.data;
    } catch (error) {
      console.error("Error registering customer:", error);
      throw error;
    }
  },

  getArtistAvailableSlots: async (nailArtistId, bookingDate) => {
    try {
      const response = await axiosClient.get("/Bookings/artist-available-slots", {
        params: { NailArtistId: nailArtistId, BookingDate: bookingDate }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching artist slots:", error);
      return error.response?.data || { isSucceeded: false, message: "Unknown error" };
    }
  },

  getLateCancelledBookings: async (salonId) => {
    try {
      const response = await axiosClient.get(`/Bookings/salon/${salonId}/late-cancelled`);
      return response.data;
    } catch (error) {
      console.error("Error fetching late cancelled bookings:", error);
      throw error;
    }
  },

  lateCheckInBooking: async (bookingId) => {
    try {
      const response = await axiosClient.post(`/Bookings/${bookingId}/late-checkin`);
      return response.data;
    } catch (error) {
      console.error("Error performing late check-in:", error);
      throw error;
    }
  }
};
