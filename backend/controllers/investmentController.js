const Investment = require("../models/Investment");
const { round2 } = require("../utils/budgetCalculator");

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function list(req, res, next) {
  try {
    const { month, type, search } = req.query;
    const items = await Investment.findAllByUser(req.user.id, { month, type, search });
    const total = round2(items.reduce((s, i) => s + Number(i.amount), 0));
    const totalValue = round2(items.reduce((s, i) => s + Number(i.current_value || i.amount), 0));

    res.json({
      investments: items,
      total,
      total_current_value: totalValue,
      total_gain: round2(totalValue - total),
      types: Investment.INVESTMENT_TYPES,
      filters: { month: month || null, type: type || null, search: search || null },
    });
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const month = req.query.month || currentMonth();
    const userId = req.user.id;

    const [monthTotal, allTime, byTypeMonth, byTypeAllTime] = await Promise.all([
      Investment.totalForMonth(userId, month),
      Investment.allTimeStats(userId),
      Investment.totalsByType(userId, month),
      Investment.totalsByType(userId, null),
    ]);

    res.json({
      month,
      month_total: round2(monthTotal),
      all_time: {
        total_invested: round2(allTime.total_invested),
        current_value: round2(allTime.current_value),
        total_gain: round2(allTime.total_gain),
        gain_percent: round2(allTime.gain_percent),
        total_entries: allTime.total_entries,
      },
      distribution_month: byTypeMonth,
      distribution_all_time: byTypeAllTime,
      types: Investment.INVESTMENT_TYPES,
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, type, amount, current_value, date, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Investment name is required" });
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const item = await Investment.create(req.user.id, {
      name: name.trim(),
      type: type || "Mutual Funds / SIP",
      amount: round2(numAmount),
      current_value: current_value ? round2(Number(current_value)) : round2(numAmount),
      date: String(date || new Date().toISOString()).slice(0, 10),
      month: String(date || new Date().toISOString()).slice(0, 7),
      notes: notes ? notes.trim() : null,
    });

    res.status(201).json({ investment: item });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const current = await Investment.findById(req.params.id, req.user.id);
    if (!current) {
      return res.status(404).json({ message: "Investment not found" });
    }

    const name = req.body.name !== undefined ? req.body.name.trim() : current.name;
    const type = req.body.type || current.type;
    const amount = req.body.amount !== undefined ? Number(req.body.amount) : Number(current.amount);
    const currentValue = req.body.current_value !== undefined ? Number(req.body.current_value) : Number(current.current_value);
    const date = req.body.date ? String(req.body.date).slice(0, 10) : current.date;
    const notes = req.body.notes !== undefined ? req.body.notes : current.notes;

    if (!name) {
      return res.status(400).json({ message: "Investment name is required" });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const item = await Investment.update(req.params.id, req.user.id, {
      name,
      type,
      amount: round2(amount),
      current_value: Number.isFinite(currentValue) ? round2(currentValue) : round2(amount),
      date,
      month: String(date).slice(0, 7),
      notes,
    });

    res.json({ investment: item });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ok = await Investment.remove(req.params.id, req.user.id);
    if (!ok) {
      return res.status(404).json({ message: "Investment not found" });
    }
    res.json({ message: "Investment deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getSummary, create, update, remove };
