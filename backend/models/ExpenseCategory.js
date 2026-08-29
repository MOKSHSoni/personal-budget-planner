const { pool } = require("../config/db");

const DEFAULT_CATEGORIES = [
  { name: "Rent", type: "fixed" },
  { name: "Internet", type: "fixed" },
  { name: "EMI", type: "fixed" },
  { name: "Insurance", type: "fixed" },
  { name: "Electricity", type: "variable" },
  { name: "Food", type: "variable" },
  { name: "Fuel", type: "variable" },
  { name: "Shopping", type: "variable" },
  { name: "Entertainment", type: "variable" },
  { name: "Travel", type: "variable" },
];

const ExpenseCategory = {
  DEFAULT_CATEGORIES,

  /** Inserts the 10 default categories for a newly registered user. */
  async createDefaultsForUser(userId, connection = pool) {
    const values = [];
    const placeholders = DEFAULT_CATEGORIES.map((c) => {
      values.push(userId, c.name, c.type);
      return "(?, ?, ?)";
    }).join(", ");
    await connection.query(
      `INSERT INTO ExpenseCategory (user_id, name, type) VALUES ${placeholders}`,
      values
    );
    return DEFAULT_CATEGORIES.length;
  },

  async findAllByUser(userId) {
    const [rows] = await pool.execute(
      "SELECT id, user_id, name, type FROM ExpenseCategory WHERE user_id = ? ORDER BY type ASC, name ASC",
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await pool.execute(
      "SELECT id, user_id, name, type FROM ExpenseCategory WHERE id = ? AND user_id = ? LIMIT 1",
      [id, userId]
    );
    return rows[0] || null;
  },

  async create(userId, { name, type }) {
    const [res] = await pool.execute(
      "INSERT INTO ExpenseCategory (user_id, name, type) VALUES (?, ?, ?)",
      [userId, name, type]
    );
    return ExpenseCategory.findById(res.insertId, userId);
  },

  async update(id, userId, { name, type }) {
    await pool.execute(
      "UPDATE ExpenseCategory SET name = ?, type = ? WHERE id = ? AND user_id = ?",
      [name, type, id, userId]
    );
    return ExpenseCategory.findById(id, userId);
  },

  async remove(id, userId) {
    const [res] = await pool.execute(
      "DELETE FROM ExpenseCategory WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return res.affectedRows > 0;
  },
};

module.exports = ExpenseCategory;
