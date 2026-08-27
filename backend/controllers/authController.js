const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const User = require("../models/User");
const ExpenseCategory = require("../models/ExpenseCategory");
const { generateToken } = require("../utils/generateToken");

/**
 * Registration flow: create user -> create the user's 10 default
 * categories -> return user. Wrapped in a transaction so a user is never
 * created without categories.
 */
async function register(req, res, next) {
  const { name, email, password } = req.body;
  const conn = await pool.getConnection();
  try {
    const existing = await User.findByEmail(email);
    if (existing) return res.status(409).json({ message: "Email is already registered" });

    const hashed = await bcrypt.hash(password, 10);

    await conn.beginTransaction();
    const [result] = await conn.execute(
      "INSERT INTO Users (name, email, password) VALUES (?, ?, ?)",
      [name.trim(), email.toLowerCase().trim(), hashed]
    );
    const userId = result.insertId;
    await ExpenseCategory.createDefaultsForUser(userId, conn);
    await conn.commit();

    const user = await User.findById(userId);
    return res.status(201).json({ user, token: generateToken(user) });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    return next(err);
  } finally {
    conn.release();
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const found = await User.findByEmail(email.toLowerCase().trim());
    if (!found) return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password, found.password);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    const user = await User.findById(found.id);
    return res.json({ user, token: generateToken(user) });
  } catch (err) {
    next(err);
  }
}

/** Stateless JWT: logout is client-side token disposal, acknowledged here. */
async function logout(req, res) {
  return res.json({ message: "Logged out successfully" });
}

async function getProfile(req, res) {
  return res.json({ user: req.user });
}

async function updateProfile(req, res, next) {
  try {
    const current = req.user;
    const {
      name = current.name,
      email = current.email,
      currency = current.currency,
      salary_date = current.salary_date,
      theme = current.theme,
      password,
    } = req.body;

    if (email !== current.email) {
      const clash = await User.findByEmail(email.toLowerCase().trim());
      if (clash) return res.status(409).json({ message: "Email is already in use" });
    }

    const user = await User.updateProfile(current.id, {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      currency,
      salary_date: Number(salary_date) || 1,
      theme,
    });

    if (password) {
      if (String(password).length < 6)
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      await User.updatePassword(current.id, await bcrypt.hash(password, 10));
    }

    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getProfile, updateProfile };
