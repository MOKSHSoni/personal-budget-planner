const Expense = require("../models/Expense");
const ExpenseCategory = require("../models/ExpenseCategory");
const { round2 } = require("../utils/budgetCalculator");

async function list(req, res, next) {
  try {
    const { month, category_id: categoryId, search } = req.query;
    const expenses = await Expense.findAllByUser(req.user.id, { month, categoryId, search });
    const total = round2(expenses.reduce((s, e) => s + Number(e.amount), 0));
    res.json({ expenses, total, filters: { month: month || null, category_id: categoryId || null, search: search || null } });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { category_id, amount, date, description } = req.body;
    const category = await ExpenseCategory.findById(category_id, req.user.id);
    if (!category) return res.status(400).json({ message: "Invalid category" });

    const expense = await Expense.create(req.user.id, {
      category_id,
      amount: Number(amount),
      date: String(date).slice(0, 10),
      description,
    });
    res.status(201).json({ expense });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const current = await Expense.findById(req.params.id, req.user.id);
    if (!current) return res.status(404).json({ message: "Expense not found" });

    const category_id = req.body.category_id ?? current.category_id;
    const category = await ExpenseCategory.findById(category_id, req.user.id);
    if (!category) return res.status(400).json({ message: "Invalid category" });

    const expense = await Expense.update(req.params.id, req.user.id, {
      category_id,
      amount: Number(req.body.amount ?? current.amount),
      date: String(req.body.date ?? current.date).slice(0, 10),
      description: req.body.description ?? current.description,
    });
    res.json({ expense });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const ok = await Expense.remove(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) { next(err); }
}

async function byCategory(req, res, next) {
  try {
    const month = req.params.month;
    const breakdown = await Expense.totalsByCategory(req.user.id, month);
    res.json({ month, breakdown, total: round2(breakdown.reduce((s, r) => s + r.total, 0)) });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove, byCategory };
