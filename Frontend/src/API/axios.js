import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
});

api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem("accessToken");

    config.headers = config.headers || {};

    if (token && token !== "null" && token !== "undefined") {
      try {
        // Pre-emptively refresh the token if it's expired or about to expire in the next 10 seconds
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpiring = Math.floor(Date.now() / 1000) >= (payload.exp - 10);
        
        if (isExpiring) {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
            const res = await axios.post(`${baseURL}/auth/token/refresh/`, {
              refresh: refreshToken,
            });
            token = res.data.access;
            localStorage.setItem("accessToken", token);
          }
        }
      } catch (e) {
        // If decoding or refresh fails, we will just pass the old token and let the response interceptor handle the 401
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors (token refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
        const res = await axios.post(`${baseURL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        localStorage.setItem("accessToken", res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

        // If the original request was a multipart/form-data (FormData), 
        // we must clear the Content-Type header so axios can regenerate the boundary.
        if (originalRequest.data instanceof FormData) {
          delete originalRequest.headers["Content-Type"];
        }

        // Retry the original request with new token
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
