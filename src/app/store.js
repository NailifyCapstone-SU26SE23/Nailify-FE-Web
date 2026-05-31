import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "../features/auth/model/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});
