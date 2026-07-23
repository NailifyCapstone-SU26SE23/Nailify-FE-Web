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

  createBooking: async (payload) => {
    try {
      const response = await axiosClient.post("/Bookings", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating booking:", error);
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
  }
};
