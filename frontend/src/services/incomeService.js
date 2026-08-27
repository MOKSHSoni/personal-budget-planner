import api from "./api";

const incomeService = {
  list: (month) => api.get("/income", { params: month ? { month } : {} }).then((r) => r.data),
  create: (payload) => api.post("/income", payload).then((r) => r.data),
  update: (id, payload) => api.put(`/income/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/income/${id}`).then((r) => r.data),
  monthlyTotal: (month) => api.get(`/income/total/${month}`).then((r) => r.data),
};

export default incomeService;
