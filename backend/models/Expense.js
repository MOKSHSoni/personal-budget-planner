const { pool } = require("../config/db");

const Expense = {
  async findAllByUser(userId, { month, categoryId, search } = {}) {
    let sql = `SELECT e.id, e.user_id, e.category_id, e.amount, e.date, e.description,
                      c.name AS category_name, c.type AS category_type
               FROM Expenses e
               LEFT JOIN ExpenseCategory c ON c.id = e.category_id
               WHERE e.user_id = ?`;
    const params = [userId];
    if (month) {
      sql += " AND DATE_FORMAT(e.date, '%Y-%m') = ?";
      params.push(month);
    }
    if (categoryId) {
      sql += " AND e.category_id = ?";
      params.push(categoryId);
    }
    if (search) {
      sql += " AND (e.description LIKE ? OR c.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY e.date DESC, e.id DESC";
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await pool.execute(
      `SELECT e.id, e.user_id, e.category_id, e.amount, e.date, e.description,
              c.name AS category_name, c.type AS category_type
       FROM Expenses e LEFT JOIN ExpenseCategory c ON c.id = e.category_id
       WHERE e.id = ? AND e.user_id = ? LIMIT 1`,
      [id, userId]
    );
    return rows[0] || null;
  },

  async create(userId, { category_id, amount, date, description }) {
    const [res] = await pool.execute(
      "INSERT INTO Expenses (user_id, category_id, amount, date, description) VALUES (?, ?, ?, ?, ?)",
      [userId, category_id, amount, date, description || null]
    );
    return Expense.findById(res.insertId, userId);
  },

  async update(id, userId, { category_id, amount, date, description }) {
    await pool.execute(
      "UPDATE Expenses SET category_id = ?, amount = ?, date = ?, description = ? WHERE id = ? AND user_id = ?",
      [category_id, amount, date, description || null, id, userId]
    );
    return Expense.findById(id, userId);
  },

  async remove(id, userId) {
    const [res] = await pool.execute("DELETE FROM Expenses WHERE id = ? AND user_id = ?", [id, userId]);
    return res.affectedRows > 0;
  },

  async totalForMonth(userId, month) {
    const [rows] = await pool.execute(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM Expenses WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?",
      [userId, month]
    );
    return Number(rows[0].total) || 0;
  },

  async totalsByCategory(userId, month) {
    const [rows] = await pool.execute(
      `SELECT c.id AS category_id, c.name AS category_name, c.type,
              COALESCE(SUM(e.amount), 0) AS total
       FROM ExpenseCategory c
       LEFT JOIN Expenses e
         ON e.category_id = c.id AND e.user_id = c.user_id
        AND DATE_FORMAT(e.date, '%Y-%m') = ?
       WHERE c.user_id = ?
       GROUP BY c.id, c.name, c.type
       ORDER BY total DESC`,
      [month, userId]
    );
    return rows.map((r) => ({ ...r, total: Number(r.total) || 0 }));
  },

  async monthlyTotals(userId, limit = 12) {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(date, '%Y-%m') AS month, COALESCE(SUM(amount),0) AS total
       FROM Expenses WHERE user_id = ? GROUP BY month ORDER BY month DESC LIMIT ?`,
      [userId, Number(limit)]
    );
    return rows.reverse();
  },
};

module.exports = Expense;
