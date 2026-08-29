import api from "./api";

const billCalendarService = {
  async getMonth(month) {
    const res = await api.get("/calendar", { params: { month } });
    return res.data;
  },

  async createReminder(payload) {
    const res = await api.post("/calendar/reminders", payload);
    return res.data;
  },

  async updateReminder(id, payload) {
    const res = await api.put(`/calendar/reminders/${id}`, payload);
    return res.data;
  },

  async deleteReminder(id) {
    const res = await api.delete(`/calendar/reminders/${id}`);
    return res.data;
  },

  async quickPay(payload) {
    const res = await api.post("/calendar/pay", payload);
    return res.data;
  },
};

export default billCalendarService;
