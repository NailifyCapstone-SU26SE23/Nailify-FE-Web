import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./authSlice";
import { bookingReducer } from "./bookingSlice";
import { layoutReducer } from "./layoutSlice";
import { nailDesignReducer } from "./nailDesignSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    layout: layoutReducer,
    nailDesign: nailDesignReducer,
  },
});
