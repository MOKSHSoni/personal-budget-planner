const Goal = require("../models/Goal");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { computeGoal, suggestContributions } = require("../utils/goalCalculator");
const { calculateSavings } = require("../utils/budgetCalculator");

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function savingCapacity(userId, month) {
  const [income, expenses] = await Promise.all([
    Income.totalForMonth(userId, month),
    Expense.totalForMonth(userId, month),
  ]);
  return Math.max(0, calculateSavings(income, expenses));
}

async function list(req, res, next) {
  try {
    const month = req.query.month || currentMonth();
    const capacity = await savingCapacity(req.user.id, month);
    const raw = await Goal.findAllByUser(req.user.id);
    const suggestions = suggestContributions(raw, capacity);
    const goals = raw.map((g) => ({
      ...computeGoal(g, capacity),
      suggested_contribution:
        suggestions.find((s) => s.goal_id === g.id)?.suggested_contribution || 0,
    }));
    res.json({ goals, monthly_saving_capacity: capacity, month });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const goal = await Goal.findById(req.params.id, req.user.id);
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    const capacity = await savingCapacity(req.user.id, currentMonth());
    res.json({ goal: computeGoal(goal, capacity) });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { goal_name, target_amount, saved_amount = 0, deadline, priority } = req.body;
    if (Number(saved_amount) > Number(target_amount))
      return res.status(400).json({ message: "Saved amount cannot exceed the target amount" });

    const goal = await Goal.create(req.user.id, {
      goal_name: goal_name.trim(),
      target_amount: Number(target_amount),
      saved_amount: Number(saved_amount),
      deadline: deadline ? String(deadline).slice(0, 10) : null,
      priority,
    });
    const capacity = await savingCapacity(req.user.id, currentMonth());
    res.status(201).json({ goal: computeGoal(goal, capacity) });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const current = await Goal.findById(req.params.id, req.user.id);
    if (!current) return res.status(404).json({ message: "Goal not found" });

    const target_amount = Number(req.body.target_amount ?? current.target_amount);
    const saved_amount = Number(req.body.saved_amount ?? current.saved_amount);
    if (saved_amount > target_amount)
      return res.status(400).json({ message: "Saved amount cannot exceed the target amount" });

    const deadlineInput = req.body.deadline ?? current.deadline;
    const goal = await Goal.update(req.params.id, req.user.id, {
      goal_name: (req.body.goal_name ?? current.goal_name).trim(),
      target_amount,
      saved_amount,
      deadline: deadlineInput ? String(new Date(deadlineInput).toISOString()).slice(0, 10) : null,
      priority: req.body.priority ?? current.priority,
    });
    const capacity = await savingCapacity(req.user.id, currentMonth());
    res.json({ goal: computeGoal(goal, capacity) });
  } catch (err) { next(err); }
}

async function contribute(req, res, next) {
  try {
    const amount = Number(req.body.amount);
    const current = await Goal.findById(req.params.id, req.user.id);
    if (!current) return res.status(404).json({ message: "Goal not found" });

    const goal = await Goal.addContribution(req.params.id, req.user.id, amount);
    const capacity = await savingCapacity(req.user.id, currentMonth());
    res.json({ goal: computeGoal(goal, capacity) });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const ok = await Goal.remove(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ message: "Goal not found" });
    res.json({ message: "Goal deleted" });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, contribute, remove, savingCapacity };
