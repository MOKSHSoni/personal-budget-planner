const { pool } = require("../config/db");

const Budget = {
  async findAllByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT b.id, b.user_id, b.category_id, b.monthly_limit, b.priority,
              c.name AS category_name, c.type AS category_type
       FROM Budgets b JOIN ExpenseCategory c ON c.id = b.category_id
       WHERE b.user_id = ? ORDER BY c.type ASC, c.name ASC`,
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await pool.execute(
      `SELECT b.id, b.user_id, b.category_id, b.monthly_limit, b.priority,
              c.name AS category_name, c.type AS category_type
       FROM Budgets b JOIN ExpenseCategory c ON c.id = b.category_id
       WHERE b.id = ? AND b.user_id = ? LIMIT 1`,
      [id, userId]
    );
    return rows[0] || null;
  },

  async findByCategory(userId, categoryId) {
    const [rows] = await pool.execute(
      "SELECT * FROM Budgets WHERE user_id = ? AND category_id = ? LIMIT 1",
      [userId, categoryId]
    );
    return rows[0] || null;
  },

  /** Insert or update the single budget row per (user, category). */
  async upsert(userId, { category_id, monthly_limit, priority }) {
    const existing = await Budget.findByCategory(userId, category_id);
    if (existing) {
      await pool.execute(
        "UPDATE Budgets SET monthly_limit = ?, priority = ? WHERE id = ? AND user_id = ?",
        [monthly_limit, priority, existing.id, userId]
      );
      return Budget.findById(existing.id, userId);
    }
    const [res] = await pool.execute(
      "INSERT INTO Budgets (user_id, category_id, monthly_limit, priority) VALUES (?, ?, ?, ?)",
      [userId, category_id, monthly_limit, priority]
    );
    return Budget.findById(res.insertId, userId);
  },

  async remove(id, userId) {
    const [res] = await pool.execute("DELETE FROM Budgets WHERE id = ? AND user_id = ?", [id, userId]);
    return res.affectedRows > 0;
  },
};

module.exports = Budget;
