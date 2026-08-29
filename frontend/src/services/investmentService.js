import api from "./api";

const investmentService = {
  list: (filters = {}) => api.get("/investments", { params: filters }).then((r) => r.data),
  summary: (month) => api.get("/investments/summary", { params: { month } }).then((r) => r.data),
  create: (payload) => api.post("/investments", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/investments/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/investments/${id}`).then((r) => r.data),
};

export default investmentService;
