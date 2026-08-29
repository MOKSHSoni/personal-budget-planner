const { pool } = require("../config/db");

const INVESTMENT_TYPES = [
  "Mutual Funds / SIP",
  "Stocks / Equities",
  "Fixed Deposit / RD",
  "Gold / SGB",
  "PPF / EPF / NPS",
  "Real Estate / REITs",
  "Cryptocurrency",
  "Other Investments",
];

const Investment = {
  INVESTMENT_TYPES,

  async findAllByUser(userId, { month, type, search } = {}) {
    const conditions = ["user_id = ?"];
    const params = [userId];

    if (month) {
      conditions.push("month = ?");
      params.push(month);
    }
    if (type) {
      conditions.push("type = ?");
      params.push(type);
    }
    if (search) {
      conditions.push("(name LIKE ? OR notes LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(
      `SELECT id, user_id, name, type, amount, current_value, date, month, notes
       FROM Investments
       WHERE ${conditions.join(" AND ")}
       ORDER BY date DESC, id DESC`,
      params
    );
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await pool.execute(
      `SELECT id, user_id, name, type, amount, current_value, date, month, notes
       FROM Investments
       WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId]
    );
    return rows[0] || null;
  },

  async create(userId, { name, type, amount, current_value, date, month, notes }) {
    const m = month || String(date).slice(0, 7);
    const [res] = await pool.execute(
      `INSERT INTO Investments (user_id, name, type, amount, current_value, date, month, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        type || "Mutual Funds / SIP",
        amount,
        current_value !== undefined && current_value !== null && current_value !== ""
          ? Number(current_value)
          : Number(amount),
        date,
        m,
        notes || null,
      ]
    );
    return Investment.findById(res.insertId, userId);
  },

  async update(id, userId, { name, type, amount, current_value, date, month, notes }) {
    const m = month || String(date).slice(0, 7);
    await pool.execute(
      `UPDATE Investments
       SET name = ?, type = ?, amount = ?, current_value = ?, date = ?, month = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        name,
        type,
        amount,
        current_value !== undefined && current_value !== null && current_value !== ""
          ? Number(current_value)
          : Number(amount),
        date,
        m,
        notes || null,
        id,
        userId,
      ]
    );
    return Investment.findById(id, userId);
  },

  async remove(id, userId) {
    const [res] = await pool.execute(
      "DELETE FROM Investments WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return res.affectedRows > 0;
  },

  async totalForMonth(userId, month) {
    const [rows] = await pool.execute(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM Investments WHERE user_id = ? AND month = ?",
      [userId, month]
    );
    return Number(rows[0]?.total) || 0;
  },

  async allTimeStats(userId) {
    const [rows] = await pool.execute(
      `SELECT
         COALESCE(SUM(amount), 0) AS total_invested,
         COALESCE(SUM(COALESCE(current_value, amount)), 0) AS current_value,
         COUNT(id) AS total_entries
       FROM Investments
       WHERE user_id = ?`,
      [userId]
    );
    const totalInvested = Number(rows[0]?.total_invested) || 0;
    const currentValue = Number(rows[0]?.current_value) || 0;
    const totalGain = currentValue - totalInvested;
    const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
    return {
      total_invested: totalInvested,
      current_value: currentValue,
      total_gain: totalGain,
      gain_percent: gainPercent,
      total_entries: Number(rows[0]?.total_entries) || 0,
    };
  },

  async totalsByType(userId, month = null) {
    let sql = `
      SELECT
        type,
        COALESCE(SUM(amount), 0) AS total_invested,
        COALESCE(SUM(COALESCE(current_value, amount)), 0) AS current_value,
        COUNT(id) AS count
      FROM Investments
      WHERE user_id = ?
    `;
    const params = [userId];
    if (month) {
      sql += " AND month = ?";
      params.push(month);
    }
    sql += " GROUP BY type ORDER BY total_invested DESC";

    const [rows] = await pool.execute(sql, params);
    return rows.map((r) => ({
      type: r.type,
      total_invested: Number(r.total_invested) || 0,
      current_value: Number(r.current_value) || 0,
      count: Number(r.count) || 0,
    }));
  },

  async monthlyTotals(userId, limit = 12) {
    const [rows] = await pool.execute(
      `SELECT month, COALESCE(SUM(amount), 0) AS total
       FROM Investments
       WHERE user_id = ?
       GROUP BY month
       ORDER BY month DESC
       LIMIT ${Number(limit) || 12}`,
      [userId]
    );
    return rows.map((r) => ({ month: r.month, total: Number(r.total) || 0 }));
  },
};

module.exports = Investment;
