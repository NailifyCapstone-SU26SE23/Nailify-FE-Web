import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchBookingsBySalonId, fetchSalonStaff } from "../features/manager/bookings/services/bookingsService";
import { getSalonId, getSalonIdAsync } from "../features/manager/staff-artist-management/services/nailArtistsService";
import dayjs from "dayjs";

export const fetchManagerBookingsThunk = createAsyncThunk(
  "managerBookings/fetchBookings",
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const salonId = (await getSalonIdAsync()) || getSalonId();
      if (!salonId) {
        return rejectWithValue("No salon ID found in session. Please log in as a salon manager.");
      }
      
      const result = await fetchBookingsBySalonId(salonId, {
        pageNumber: 1,
        pageSize: 1000,
        startDate: startDate,
        endDate: endDate
      });
      
      let apiBookings = [];
      if (result?.items) apiBookings = result.items;
      else if (Array.isArray(result)) apiBookings = result;
      
      return apiBookings;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load bookings.");
    }
  }
);

export const fetchManagerSalonStaffThunk = createAsyncThunk(
  "managerBookings/fetchSalonStaff",
  async (_, { rejectWithValue }) => {
    try {
      const salonId = (await getSalonIdAsync()) || getSalonId();
      if (!salonId) return rejectWithValue("No salon ID found.");

      const staffMembers = await fetchSalonStaff(salonId);
      return Array.isArray(staffMembers) ? staffMembers : staffMembers?.items || [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load salon staff.");
    }
  }
);

const initialState = {
  bookings: [],
  salonStaffList: [],
  isLoading: false,
  error: "",
  filters: {
    query: "",
    activeFilter: "All",
    dateFrom: dayjs().toISOString(),
    dateTo: dayjs().toISOString(),
    viewMode: "table",
    currentPage: 1,
  },
  hasLoadedOnce: false,
};

const managerBookingsSlice = createSlice({
  name: "managerBookings",
  initialState,
  reducers: {
    setFilter(state, action) {
      const { key, value } = action.payload;
      if (key in state.filters) {
        state.filters[key] = value;
      }
    },
    setAllFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    updateBookingLocally(state, action) {
      const { id, updates } = action.payload;
      const index = state.bookings.findIndex(b => b.bookingId === id || b.id === id);
      if (index !== -1) {
        state.bookings[index] = { ...state.bookings[index], ...updates };
      }
    },
    removeBookingLocally(state, action) {
      const { id } = action.payload;
      state.bookings = state.bookings.filter(b => b.bookingId !== id && b.id !== id);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bookings
      .addCase(fetchManagerBookingsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = "";
      })
      .addCase(fetchManagerBookingsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload;
        state.hasLoadedOnce = true;
      })
      .addCase(fetchManagerBookingsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch bookings";
      })
      // Fetch Staff
      .addCase(fetchManagerSalonStaffThunk.fulfilled, (state, action) => {
        state.salonStaffList = action.payload;
      });
  },
});

export const { setFilter, setAllFilters, updateBookingLocally, removeBookingLocally } = managerBookingsSlice.actions;

export const managerBookingsReducer = managerBookingsSlice.reducer;
