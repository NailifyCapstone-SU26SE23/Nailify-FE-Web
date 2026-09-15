import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchStaffBookings,
  fetchStaffSalonBookings,
  getTodayDateParam,
  normalizeStaffBooking,
} from "../features/staff/bookings/services/staffBookingService";

import { storage } from "../shared/utils/storage";

const STAFF_BOOKING_SCOPES = {
  mine: "mine",
  salon: "salon",
};

const STAFF_BOOKINGS_STORAGE_KEY = "nailify.staff.bookings";

export const fetchStaffBookingsThunk = createAsyncThunk(
  "staffBookings/fetchStaffBookings",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchStaffBookings();
      const normalizedData = Array.isArray(data) ? data.map(normalizeStaffBooking) : [];
      return normalizedData;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load assigned bookings.");
    }
  }
);

export const fetchStaffSalonBookingsThunk = createAsyncThunk(
  "staffBookings/fetchStaffSalonBookings",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchStaffSalonBookings();
      const normalizedData = Array.isArray(data) ? data.map(normalizeStaffBooking) : [];
      return normalizedData;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load salon bookings.");
    }
  }
);

const todayDate = getTodayDateParam();

const defaultFilters = {
  query: "",
  dateFrom: todayDate,
  dateTo: todayDate,
  salonFilter: "All salons",
  statusFilter: "All",
  staffFilter: "All staff",
  staffTimeSortDirection: "asc",
  staffBookingScope: STAFF_BOOKING_SCOPES.mine,
};

const persistedFilters = storage.get(STAFF_BOOKINGS_STORAGE_KEY, {});

const initialState = {
  staffBookings: [],
  staffSalonBookings: [],
  isLoading: true,
  loadError: "",
  filters: {
    ...defaultFilters,
    ...persistedFilters,
  },
};

const staffBookingsSlice = createSlice({
  name: "staffBookings",
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch Staff Bookings (Mine)
      .addCase(fetchStaffBookingsThunk.pending, (state) => {
        state.isLoading = true;
        state.loadError = "";
      })
      .addCase(fetchStaffBookingsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffBookings = action.payload;
      })
      .addCase(fetchStaffBookingsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.loadError = action.payload;
      })

      // Fetch Staff Salon Bookings (Salon)
      .addCase(fetchStaffSalonBookingsThunk.pending, (state) => {
        state.isLoading = true;
        state.loadError = "";
      })
      .addCase(fetchStaffSalonBookingsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffSalonBookings = action.payload;
      })
      .addCase(fetchStaffSalonBookingsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.loadError = action.payload;
      });
  },
});

export const { setFilter, setAllFilters } = staffBookingsSlice.actions;
export const staffBookingsReducer = staffBookingsSlice.reducer;
