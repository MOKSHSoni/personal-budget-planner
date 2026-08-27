import api from "./api";

export const categoryService = {
  list: () => api.get("/categories").then((r) => r.data),
  create: (payload) => api.post("/categories", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/categories/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
  restoreDefaults: () => api.post("/categories/restore-defaults").then((r) => r.data),
};

const expenseService = {
  list: (filters = {}) => api.get("/expenses", { params: filters }).then((r) => r.data),
  create: (payload) => api.post("/expenses", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/expenses/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/expenses/${id}`).then((r) => r.data),
  byCategory: (month) => api.get(`/expenses/by-category/${month}`).then((r) => r.data),
};

export default expenseService;
