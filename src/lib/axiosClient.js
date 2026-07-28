import axios from "axios";
import { getErrorMessage } from "../shared/utils/getErrorMessage";
import { jwtDecode } from "jwt-decode";
import { AUTH_STORAGE_KEY } from "../features/core/auth/constants/authConstants";

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim();

export const axiosClient = axios.create({
  baseURL: baseURL || "",
});

// Add a request interceptor to handle Content-Type, Token Expiration, and Authorization Header
axiosClient.interceptors.request.use(
  (config) => {
    // 1. Handle Content-Type
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    // 2. Pre-emptively check token expiration and ATTACH Authorization Header
    try {
      const authData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (authData) {
        const session = JSON.parse(authData);
        const token = session?.token || session?.accessToken || session?.jwt;
        if (token) {
          try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (decoded.exp && decoded.exp < currentTime) {
              // Token is expired!
              localStorage.removeItem(AUTH_STORAGE_KEY);
              const loginPath = window.location.pathname.startsWith("/internal") ? "/internal/login" : "/login";
              if (!window.location.pathname.includes("/login")) {
                window.location.href = `${loginPath}?reason=session_expired`;
              }
              return Promise.reject(new Error("Đã hết hạn token. Vui lòng đăng nhập lại"));
            }
          } catch (e) {
            // Ignore decode errors
          }

          // Attach Bearer Token to Request Headers
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // Ignore parse/decode errors
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Override the default error message
    error.message = getErrorMessage(error, error.message);

    const isUnauthorized = error.response && error.response.status === 401;
    const isTokenError = error.message && error.message.toLowerCase().includes("token");

    if (isUnauthorized || isTokenError) {
      // Clear token manually to avoid async import issues
      localStorage.removeItem(AUTH_STORAGE_KEY);
      const loginPath = window.location.pathname.startsWith("/internal") ? "/internal/login" : "/login";
      if (!window.location.pathname.includes("/login")) {
        window.location.href = `${loginPath}?reason=session_expired`;
      }
    }

    return Promise.reject(error);
  }
);

