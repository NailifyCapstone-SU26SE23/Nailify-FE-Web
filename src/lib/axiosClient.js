import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim();

export const axiosClient = axios.create({
  baseURL: baseURL || "",
});

// Add a request interceptor to handle Content-Type
axiosClient.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => Promise.reject(error)
);
