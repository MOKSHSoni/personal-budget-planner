import api from "./api";

const authService = {
  register: (payload) => api.post("/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  getProfile: () => api.get("/auth/profile").then((r) => r.data),
  updateProfile: (payload) => api.put("/auth/profile", payload).then((r) => r.data),
};

export default authService;
