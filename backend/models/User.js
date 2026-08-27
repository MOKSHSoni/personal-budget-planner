const { pool } = require("../config/db");

const User = {
  async create({ name, email, password, currency = "INR", salary_date = 1, theme = "light" }) {
    const [result] = await pool.execute(
      "INSERT INTO Users (name, email, password, currency, salary_date, theme) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, password, currency, salary_date, theme]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.execute("SELECT * FROM Users WHERE email = ? LIMIT 1", [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      "SELECT id, name, email, currency, salary_date, theme, created_at FROM Users WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  },

  async updateProfile(id, { name, email, currency, salary_date, theme }) {
    await pool.execute(
      `UPDATE Users SET name = ?, email = ?, currency = ?, salary_date = ?, theme = ? WHERE id = ?`,
      [name, email, currency, salary_date, theme, id]
    );
    return User.findById(id);
  },

  async updatePassword(id, hashed) {
    await pool.execute("UPDATE Users SET password = ? WHERE id = ?", [hashed, id]);
  },
};

module.exports = User;
