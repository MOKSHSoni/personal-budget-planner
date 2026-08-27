const Income = require("../models/Income");
const { round2 } = require("../utils/budgetCalculator");

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function list(req, res, next) {
  try {
    const month = req.query.month;
    const incomes = await Income.findAllByUser(req.user.id, month);
    const total = round2(incomes.reduce((s, i) => s + Number(i.amount), 0));
    res.json({ incomes, total, month: month || null });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { source, amount, month } = req.body;
    const income = await Income.create(req.user.id, {
      source: source.trim(),
      amount: Number(amount),
      month: month || currentMonth(),
    });
    res.status(201).json({ income });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const current = await Income.findById(req.params.id, req.user.id);
    if (!current) return res.status(404).json({ message: "Income not found" });
    const income = await Income.update(req.params.id, req.user.id, {
      source: (req.body.source ?? current.source).trim(),
      amount: Number(req.body.amount ?? current.amount),
      month: req.body.month ?? current.month,
    });
    res.json({ income });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const ok = await Income.remove(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ message: "Income not found" });
    res.json({ message: "Income deleted" });
  } catch (err) { next(err); }
}

async function monthlyTotal(req, res, next) {
  try {
    const month = req.params.month;
    res.json({ month, total: round2(await Income.totalForMonth(req.user.id, month)) });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove, monthlyTotal };
