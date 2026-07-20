import axios from "axios";
import { getErrorMessage } from "../shared/utils/getErrorMessage";
import { jwtDecode } from "jwt-decode";

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim();

export const axiosClient = axios.create({
  baseURL: baseURL || "",
});

// Add a request interceptor to handle Content-Type and Token Expiration
axiosClient.interceptors.request.use(
  (config) => {
    // 1. Handle Content-Type
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    // 2. Pre-emptively check token expiration to avoid CORS failures on 401
    try {
      const authData = localStorage.getItem("nailify_auth");
      if (authData) {
        const session = JSON.parse(authData);
        if (session && session.token) {
          const decoded = jwtDecode(session.token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp && decoded.exp < currentTime) {
            // Token is expired!
            localStorage.removeItem("nailify_auth");
            
            if (window.location.pathname !== "/login") {
              window.location.href = "/login?reason=session_expired";
            }
            
            // Cancel the request before it fires
            return Promise.reject(new Error("Đã hết hạn token. Vui lòng đăng nhập lại"));
          }
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
      localStorage.removeItem("nailify_auth");
      
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?reason=session_expired";
      }
    }

    return Promise.reject(error);
  }
);
