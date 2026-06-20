import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./authSlice";
import { bookingReducer } from "./bookingSlice";
import { layoutReducer } from "./layoutSlice";
import { nailDesignReducer } from "./nailDesignSlice";
import {
  SERVICE_SESSION_STORAGE,
  serviceSessionReducer,
} from "./serviceSessionSlice";
import { storage } from "../shared/utils/storage";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    layout: layoutReducer,
    nailDesign: nailDesignReducer,
    serviceSession: serviceSessionReducer,
  },
});

store.subscribe(() => {
  storage.set(
    SERVICE_SESSION_STORAGE.key,
    store.getState().serviceSession.sessions,
  );
});
