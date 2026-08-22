import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./authSlice";
import {
  BOOKING_STORAGE,
  bookingReducer,
  sanitizeBookingStateForStorage,
} from "./bookingSlice";
import { layoutReducer } from "./layoutSlice";
import { nailDesignReducer } from "./nailDesignSlice";
import {
  SERVICE_SESSION_STORAGE,
  serviceSessionReducer,
  sanitizeServiceSessionsForStorage,
} from "./serviceSessionSlice";
import { storage } from "../shared/utils/storage";
import { managerBookingsReducer } from "./managerBookingsSlice";
import { receptionistBookingsReducer } from "./receptionistBookingsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    layout: layoutReducer,
    nailDesign: nailDesignReducer,
    serviceSession: serviceSessionReducer,
    managerBookings: managerBookingsReducer,
    receptionistBookings: receptionistBookingsReducer,
  },
});

store.subscribe(() => {
  storage.set(
    BOOKING_STORAGE.key,
    sanitizeBookingStateForStorage(store.getState().booking),
  );
  storage.set(
    SERVICE_SESSION_STORAGE.key,
    sanitizeServiceSessionsForStorage(store.getState().serviceSession.sessions),
  );
});
