import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { AUTH_STATUS } from "../constants/authConstants";
import { authService } from "../services/authService";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from "./authStorage";
import { ROLES } from "../../../../shared/constants/roles";

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

export const loginGoogle = createAsyncThunk(
  "auth/loginGoogle",
  async (idToken, { rejectWithValue }) => {
    try {
      return await authService.loginGoogle(idToken);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const getIsVi = () => {
  try {
    const lang = localStorage.getItem("nailify_language");
    if (lang) return lang === "vi";
    return navigator.language?.toLowerCase().startsWith("vi");
  } catch {
    return true; // Default to Vietnamese if localStorage is unavailable
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action) {
      state.user = action.payload?.user ?? state.user;
      state.accessToken = action.payload?.accessToken ?? state.accessToken;
      state.isAuthenticated = Boolean(state.accessToken);
      state.status = AUTH_STATUS.succeeded;
      state.error = null;
      saveAuthSession({
        accessToken: state.accessToken,
        user: state.user,
      });
    },
    logout(state, action) {
      // Don't show logout toast if they weren't fully authenticated anyway or if silent is requested
      const wasAuth = state.isAuthenticated;
      const silent = action.payload?.silent;
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.status = AUTH_STATUS.idle;
      state.error = null;
      clearAuthSession();
      if (wasAuth && !silent) {
        toast.success(getIsVi() ? "Đăng xuất thành công." : "Signed out successfully.", { id: "auth-toast" });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = AUTH_STATUS.loading;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        const isInternalRole = Object.values(ROLES).includes(action.payload.user?.role?.toLowerCase());
        if (!isInternalRole) {
          state.status = AUTH_STATUS.failed;
          state.error = getIsVi() ? "Tài khoản khách hàng không thể đăng nhập vào hệ thống nội bộ." : "Customer accounts cannot log in to the internal system.";
          state.isAuthenticated = false;
          toast.error(state.error, { id: "auth-toast", duration: 5000 });
          return;
        }

        state.status = AUTH_STATUS.succeeded;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        saveAuthSession(action.payload);
        toast.success(getIsVi() ? "Đăng nhập thành công." : "Signed in successfully.", { id: "auth-toast" });
      })
      .addCase(login.rejected, (state, action) => {
        state.status = AUTH_STATUS.failed;
        state.error = action.payload ?? (getIsVi() ? "Đăng nhập thất bại." : "Sign-in failed.");
        state.isAuthenticated = false;
        toast.error(state.error, { id: "auth-toast" });
      })
      .addCase(loginGoogle.pending, (state) => {
        state.status = AUTH_STATUS.loading;
        state.error = null;
      })
      .addCase(loginGoogle.fulfilled, (state, action) => {
        const isInternalRole = Object.values(ROLES).includes(action.payload.user?.role?.toLowerCase());
        if (!isInternalRole) {
          state.status = AUTH_STATUS.failed;
          state.error = getIsVi() ? "Tài khoản khách hàng không thể đăng nhập vào hệ thống nội bộ." : "Customer accounts cannot log in to the internal system.";
          state.isAuthenticated = false;
          toast.error(state.error, { id: "auth-toast", duration: 5000 });
          return;
        }

        state.status = AUTH_STATUS.succeeded;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        saveAuthSession(action.payload);
        toast.success(getIsVi() ? "Đăng nhập với Google thành công." : "Signed in with Google successfully.", { id: "auth-toast" });
      })
      .addCase(loginGoogle.rejected, (state, action) => {
        state.status = AUTH_STATUS.failed;
        state.error = action.payload ?? (getIsVi() ? "Đăng nhập với Google thất bại." : "Google Sign-in failed.");
        state.isAuthenticated = false;
        toast.error(state.error, { id: "auth-toast" });
      });
  },
});

export const { logout, setSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
