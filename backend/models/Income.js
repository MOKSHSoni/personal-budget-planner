const { pool } = require("../config/db");

const Income = {
  async findAllByUser(userId, month) {
    if (month) {
      const [rows] = await pool.execute(
        "SELECT id, user_id, source, amount, month FROM Income WHERE user_id = ? AND month = ? ORDER BY id DESC",
        [userId, month]
      );
      return rows;
    }
    const [rows] = await pool.execute(
      "SELECT id, user_id, source, amount, month FROM Income WHERE user_id = ? ORDER BY month DESC, id DESC",
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await pool.execute(
      "SELECT id, user_id, source, amount, month FROM Income WHERE id = ? AND user_id = ? LIMIT 1",
      [id, userId]
    );
    return rows[0] || null;
  },

  async create(userId, { source, amount, month }) {
    const [res] = await pool.execute(
      "INSERT INTO Income (user_id, source, amount, month) VALUES (?, ?, ?, ?)",
      [userId, source, amount, month]
    );
    return Income.findById(res.insertId, userId);
  },

  async update(id, userId, { source, amount, month }) {
    await pool.execute(
      "UPDATE Income SET source = ?, amount = ?, month = ? WHERE id = ? AND user_id = ?",
      [source, amount, month, id, userId]
    );
    return Income.findById(id, userId);
  },

  async remove(id, userId) {
    const [res] = await pool.execute("DELETE FROM Income WHERE id = ? AND user_id = ?", [id, userId]);
    return res.affectedRows > 0;
  },

  async totalForMonth(userId, month) {
    const [rows] = await pool.execute(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM Income WHERE user_id = ? AND month = ?",
      [userId, month]
    );
    return Number(rows[0].total) || 0;
  },

  async monthlyTotals(userId, limit = 12) {
    const [rows] = await pool.query(
      "SELECT month, COALESCE(SUM(amount),0) AS total FROM Income WHERE user_id = ? GROUP BY month ORDER BY month DESC LIMIT ?",
      [userId, Number(limit)]
    );
    return rows.reverse();
  },
};

module.exports = Income;
