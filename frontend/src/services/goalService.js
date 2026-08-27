import api from "./api";

const goalService = {
  list: (month) => api.get("/goals", { params: month ? { month } : {} }).then((r) => r.data),
  get: (id) => api.get(`/goals/${id}`).then((r) => r.data),
  create: (payload) => api.post("/goals", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/goals/${id}`, payload).then((r) => r.data),
  contribute: (id, amount) => api.post(`/goals/${id}/contribute`, { amount }).then((r) => r.data),
  remove: (id) => api.delete(`/goals/${id}`).then((r) => r.data),
};

export const reportService = {
  summary: (month) => api.get("/reports/summary", { params: month ? { month } : {} }).then((r) => r.data),
  monthly: (months = 6) => api.get("/reports/monthly", { params: { months } }).then((r) => r.data),
  notifications: (month) =>
    api.get("/reports/notifications", { params: month ? { month } : {} }).then((r) => r.data),
};

export default goalService;
