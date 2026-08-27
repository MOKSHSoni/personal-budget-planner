import api from "./api";

const budgetService = {
  list: (month) => api.get("/budgets", { params: month ? { month } : {} }).then((r) => r.data),
  recommendation: (month) =>
    api.get("/budgets/recommendation", { params: month ? { month } : {} }).then((r) => r.data),
  save: (payload) => api.post("/budgets", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/budgets/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/budgets/${id}`).then((r) => r.data),
  applyRecommendation: (month) =>
    api.post("/budgets/apply-recommendation", { month }).then((r) => r.data),
};

export default budgetService;
