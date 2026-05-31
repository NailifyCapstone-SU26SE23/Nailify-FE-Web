import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { AUTH_STATUS } from "../constants/authConstants";
import { authService } from "../services/authService";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from "./authStorage";

const persistedSession = loadAuthSession();

const initialState = {
  user: persistedSession?.user ?? null,
  accessToken: persistedSession?.accessToken ?? null,
  isAuthenticated: Boolean(persistedSession?.accessToken),
  status: AUTH_STATUS.idle,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.status = AUTH_STATUS.idle;
      state.error = null;
      clearAuthSession();
      toast.success("Signed out successfully.");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = AUTH_STATUS.loading;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = AUTH_STATUS.succeeded;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        saveAuthSession(action.payload);
        toast.success("Signed in successfully.");
      })
      .addCase(login.rejected, (state, action) => {
        state.status = AUTH_STATUS.failed;
        state.error = action.payload ?? "Sign-in failed.";
        state.isAuthenticated = false;
      });
  },
});

export const { logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
