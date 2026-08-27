const Budget = require("../models/Budget");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const ExpenseCategory = require("../models/ExpenseCategory");
const { allocateBudget, round2 } = require("../utils/budgetCalculator");

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/** Builds the category rows (priority + limit + spent) the calculator needs. */
async function buildCategoryRows(userId, month) {
  const [categories, budgets, spendRows] = await Promise.all([
    ExpenseCategory.findAllByUser(userId),
    Budget.findAllByUser(userId),
    Expense.totalsByCategory(userId, month),
  ]);
  const budgetByCategory = new Map(budgets.map((b) => [b.category_id, b]));
  const spentByCategory = new Map(spendRows.map((r) => [r.category_id, Number(r.total) || 0]));

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    priority: budgetByCategory.get(c.id)?.priority || "Low",
    monthly_limit: Number(budgetByCategory.get(c.id)?.monthly_limit || 0),
    spent: spentByCategory.get(c.id) || 0,
    budget_id: budgetByCategory.get(c.id)?.id || null,
  }));
}

async function list(req, res, next) {
  try {
    const month = req.query.month || currentMonth();
    const rows = await buildCategoryRows(req.user.id, month);
    const totalIncome = await Income.totalForMonth(req.user.id, month);
    const plan = allocateBudget(totalIncome, rows);
    res.json({ month, ...plan, budgets: rows });
  } catch (err) { next(err); }
}

/** Recommendation-only view (same algorithm, no persistence). */
async function recommend(req, res, next) {
  try {
    const month = req.query.month || currentMonth();
    const rows = await buildCategoryRows(req.user.id, month);
    const totalIncome = await Income.totalForMonth(req.user.id, month);
    res.json({ month, ...allocateBudget(totalIncome, rows) });
  } catch (err) { next(err); }
}

async function upsert(req, res, next) {
  try {
    const { category_id, monthly_limit, priority } = req.body;
    const category = await ExpenseCategory.findById(category_id, req.user.id);
    if (!category) return res.status(400).json({ message: "Invalid category" });

    const budget = await Budget.upsert(req.user.id, {
      category_id,
      monthly_limit: round2(Number(monthly_limit) || 0),
      priority,
    });
    res.status(201).json({ budget });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const current = await Budget.findById(req.params.id, req.user.id);
    if (!current) return res.status(404).json({ message: "Budget not found" });
    const budget = await Budget.upsert(req.user.id, {
      category_id: current.category_id,
      monthly_limit: round2(Number(req.body.monthly_limit ?? current.monthly_limit)),
      priority: req.body.priority ?? current.priority,
    });
    res.json({ budget });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const ok = await Budget.remove(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ message: "Budget not found" });
    res.json({ message: "Budget deleted" });
  } catch (err) { next(err); }
}

/** Applies the recommended limits as the stored monthly limits. */
async function applyRecommendation(req, res, next) {
  try {
    const month = req.body.month || currentMonth();
    const rows = await buildCategoryRows(req.user.id, month);
    const totalIncome = await Income.totalForMonth(req.user.id, month);
    const plan = allocateBudget(totalIncome, rows);
    for (const a of plan.allocations) {
      await Budget.upsert(req.user.id, {
        category_id: a.category_id,
        monthly_limit: a.recommended_limit,
        priority: a.priority,
      });
    }
    res.json({ message: "Recommended limits applied", month, applied: plan.allocations.length });
  } catch (err) { next(err); }
}

module.exports = { list, recommend, upsert, update, remove, applyRecommendation, buildCategoryRows };
