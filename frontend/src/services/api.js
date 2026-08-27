import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("bp_token")) {
      localStorage.removeItem("bp_token");
      localStorage.removeItem("bp_user");
      if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/** Turns any axios/network failure into a readable message for the UI. */
export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export default api;
