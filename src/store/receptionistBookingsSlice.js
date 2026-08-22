import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchReceptionistBookings, fetchReceptionistSalonDetail, getReceptionistSalonId } from "../features/receptionist/bookings/services/receptionistBookingService";

const RECEPTIONIST_BOOKING_FETCH_SIZE = 10;

function toDateInputValue(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function getTodayDateParam() {
  return toDateInputValue(new Date());
}

function normalizeBooking(booking) {
  return {
    bookingId: booking.bookingId,
    customerName: booking.customerName || "Unknown customer",
    artistName: booking.artistName || "Unassigned",
    salonName: booking.salonName,
    bookingDate: booking.bookingDate,
    bookingDateValue: toDateInputValue(booking.bookingDate),
    startTime: booking.startTime,
    totalPrice: booking.totalPrice,
    status: booking.status || "Pending",
    totalDuration: booking.totalDuration,
    services: booking.bookingItems?.map((item) => item.serviceName).filter(Boolean) ?? [],
  };
}

export const fetchReceptionistBookingsThunk = createAsyncThunk(
  "receptionistBookings/fetchBookings",
  async ({ startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const firstPageResult = await fetchReceptionistBookings({
        startDate,
        endDate,
        pageNumber: 1,
        pageSize: RECEPTIONIST_BOOKING_FETCH_SIZE,
        includePagination: true,
      });
      let allBookings = Array.isArray(firstPageResult?.items) ? [...firstPageResult.items] : [];
      const totalPages = Math.max(1, Number(firstPageResult?.pagination?.totalPages || 1));

      if (totalPages > 1) {
        const remainingPageRequests = [];
        for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
          remainingPageRequests.push(
            fetchReceptionistBookings({
              startDate,
              endDate,
              pageNumber,
              pageSize: RECEPTIONIST_BOOKING_FETCH_SIZE,
              includePagination: true,
            })
          );
        }
        const remainingResults = await Promise.all(remainingPageRequests);
        remainingResults.forEach((pageResult) => {
          if (Array.isArray(pageResult?.items)) {
            allBookings = allBookings.concat(pageResult.items);
          }
        });
      }
      return allBookings.map(normalizeBooking);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load bookings.");
    }
  }
);

export const fetchReceptionistSalonDetailThunk = createAsyncThunk(
  "receptionistBookings/fetchSalonDetail",
  async (_, { rejectWithValue }) => {
    try {
      const salonId = getReceptionistSalonId();
      if (!salonId) return rejectWithValue("No salon ID found.");
      
      const salon = await fetchReceptionistSalonDetail(salonId);
      return salon;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load salon detail.");
    }
  }
);

const initialState = {
  bookings: [],
  salonName: "Receptionist Booking Management",
  salonMeta: "Bookings are loaded from salon API.",
  isLoading: false,
  error: "",
  filters: {
    query: "",
    dateFrom: getTodayDateParam(),
    dateTo: getTodayDateParam(),
    salonFilter: "All salons",
    statusFilter: "All",
    staffFilter: "All staff",
  },
  hasLoadedOnce: false,
};

const receptionistBookingsSlice = createSlice({
  name: "receptionistBookings",
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
      const index = state.bookings.findIndex(b => b.bookingId === id);
      if (index !== -1) {
        // Only update status and potentially normalize again if full booking data is provided
        // Since we only pass { status: "CheckedIn" } usually, we'll just merge it.
        state.bookings[index] = { ...state.bookings[index], ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bookings
      .addCase(fetchReceptionistBookingsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = "";
      })
      .addCase(fetchReceptionistBookingsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload;
        state.hasLoadedOnce = true;
      })
      .addCase(fetchReceptionistBookingsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch bookings";
      })
      // Fetch Salon Detail
      .addCase(fetchReceptionistSalonDetailThunk.fulfilled, (state, action) => {
        const salon = action.payload;
        state.salonName = salon?.name || "Receptionist Booking Management";
        state.salonMeta = [salon?.address, salon?.phone].filter(Boolean).join(" | ") || "Bookings are loaded from salon API.";
      })
      .addCase(fetchReceptionistSalonDetailThunk.rejected, (state, action) => {
        state.salonName = "Receptionist Booking Management";
        state.salonMeta = action.payload || "Failed to load salon detail.";
      });
  },
});

export const { setFilter, setAllFilters, updateBookingLocally } = receptionistBookingsSlice.actions;

export const receptionistBookingsReducer = receptionistBookingsSlice.reducer;
