import { createSlice } from "@reduxjs/toolkit";
import { storage } from "../shared/utils/storage";

const BOOKING_STORAGE_KEY = "nailify.booking";

function normalizePersistedBookingState(value) {
  if (!value || typeof value !== "object") {
    return {
      activeBookingId: null,
      designConfirmations: {},
    };
  }

  const activeBookingId = value.activeBookingId ?? null;
  const rawConfirmations = value.designConfirmations;

  const designConfirmations = rawConfirmations && typeof rawConfirmations === "object"
    ? Object.fromEntries(
      Object.entries(rawConfirmations).filter(([bookingId, isConfirmed]) => (
        String(bookingId || "").trim() && Boolean(isConfirmed)
      )),
    )
    : {};

  return {
    activeBookingId,
    designConfirmations,
  };
}

function loadPersistedBookingState() {
  return normalizePersistedBookingState(storage.get(BOOKING_STORAGE_KEY, null));
}

const bookingSlice = createSlice({
  name: "booking",
  initialState: loadPersistedBookingState(),
  reducers: {
    clearActiveBooking(state) {
      state.activeBookingId = null;
    },
    clearDesignConfirmation(state, action) {
      delete state.designConfirmations[action.payload];
    },
    confirmCurrentDesign(state, action) {
      const bookingId = String(action.payload || "").trim();

      if (!bookingId) {
        return;
      }

      state.designConfirmations[bookingId] = true;
    },
    setActiveBooking(state, action) {
      state.activeBookingId = action.payload;
    },
  },
});

export const BOOKING_STORAGE = {
  key: BOOKING_STORAGE_KEY,
};

export function sanitizeBookingStateForStorage(bookingState) {
  return normalizePersistedBookingState(bookingState);
}

export const {
  clearActiveBooking,
  clearDesignConfirmation,
  confirmCurrentDesign,
  setActiveBooking,
} = bookingSlice.actions;
export const bookingReducer = bookingSlice.reducer;
