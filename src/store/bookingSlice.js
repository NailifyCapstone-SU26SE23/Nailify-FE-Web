import { createSlice } from "@reduxjs/toolkit";

const bookingSlice = createSlice({
  name: "booking",
  initialState: {
    activeBookingId: null,
  },
  reducers: {
    clearActiveBooking(state) {
      state.activeBookingId = null;
    },
    setActiveBooking(state, action) {
      state.activeBookingId = action.payload;
    },
  },
});

export const { clearActiveBooking, setActiveBooking } = bookingSlice.actions;
export const bookingReducer = bookingSlice.reducer;
