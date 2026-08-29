const { pool } = require("../config/db");

const BillReminder = {
  async findAllByUser(userId) {
    const sql = `
      SELECT r.*, c.name AS category_name, c.type AS category_type
      FROM BillReminders r
      LEFT JOIN ExpenseCategory c ON r.category_id = c.id
      WHERE r.user_id = ?
      ORDER BY r.due_day ASC, r.id ASC
    `;
    const [rows] = await pool.query(sql, [userId]);
    return rows;
  },

  async findById(id, userId) {
    const sql = `
      SELECT r.*, c.name AS category_name, c.type AS category_type
      FROM BillReminders r
      LEFT JOIN ExpenseCategory c ON r.category_id = c.id
      WHERE r.id = ? AND r.user_id = ?
    `;
    const [rows] = await pool.query(sql, [id, userId]);
    return rows[0] || null;
  },

  async create(userId, data) {
    const sql = `
      INSERT INTO BillReminders (user_id, name, amount, due_day, category_id, type, is_recurring, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [res] = await pool.query(sql, [
      userId,
      data.name,
      data.amount,
      data.due_day,
      data.category_id || null,
      data.type || "fixed",
      data.is_recurring !== undefined ? data.is_recurring : 1,
      data.notes || null,
    ]);
    return this.findById(res.insertId, userId);
  },

  async update(id, userId, data) {
    const sql = `
      UPDATE BillReminders
      SET name = COALESCE(?, name),
          amount = COALESCE(?, amount),
          due_day = COALESCE(?, due_day),
          category_id = ?,
          type = COALESCE(?, type),
          is_recurring = COALESCE(?, is_recurring),
          notes = COALESCE(?, notes)
      WHERE id = ? AND user_id = ?
    `;
    await pool.query(sql, [
      data.name,
      data.amount,
      data.due_day,
      data.category_id !== undefined ? data.category_id : null,
      data.type,
      data.is_recurring,
      data.notes,
      id,
      userId,
    ]);
    return this.findById(id, userId);
  },

  async remove(id, userId) {
    const [res] = await pool.query("DELETE FROM BillReminders WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);
    return res.affectedRows > 0;
  },
};

module.exports = BillReminder;
