const { pool } = require("../config/db");

const Goal = {
  async findAllByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT id, user_id, goal_name, target_amount, saved_amount, deadline, priority
       FROM Goals WHERE user_id = ? ORDER BY deadline IS NULL, deadline ASC, id DESC`,
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await pool.execute(
      `SELECT id, user_id, goal_name, target_amount, saved_amount, deadline, priority
       FROM Goals WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId]
    );
    return rows[0] || null;
  },

  async create(userId, { goal_name, target_amount, saved_amount = 0, deadline, priority }) {
    const [res] = await pool.execute(
      "INSERT INTO Goals (user_id, goal_name, target_amount, saved_amount, deadline, priority) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, goal_name, target_amount, saved_amount, deadline || null, priority]
    );
    return Goal.findById(res.insertId, userId);
  },

  async update(id, userId, { goal_name, target_amount, saved_amount, deadline, priority }) {
    await pool.execute(
      `UPDATE Goals SET goal_name = ?, target_amount = ?, saved_amount = ?, deadline = ?, priority = ?
       WHERE id = ? AND user_id = ?`,
      [goal_name, target_amount, saved_amount, deadline || null, priority, id, userId]
    );
    return Goal.findById(id, userId);
  },

  async addContribution(id, userId, amount) {
    await pool.execute(
      "UPDATE Goals SET saved_amount = LEAST(target_amount, saved_amount + ?) WHERE id = ? AND user_id = ?",
      [amount, id, userId]
    );
    return Goal.findById(id, userId);
  },

  async remove(id, userId) {
    const [res] = await pool.execute("DELETE FROM Goals WHERE id = ? AND user_id = ?", [id, userId]);
    return res.affectedRows > 0;
  },
};

module.exports = Goal;
