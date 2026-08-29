const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Goal = require("../models/Goal");
const Investment = require("../models/Investment");
const { allocateBudget, calculateSavings, round2 } = require("../utils/budgetCalculator");
const { computeGoal } = require("../utils/goalCalculator");
const { buildCategoryRows } = require("./budgetController");

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/** Builds in-app notifications from budget + goal state (no push/email). */
function buildNotifications(plan, goals, savings) {
  const notifications = [];

  for (const a of plan.allocations) {
    const exhausted = a.exhausted || Number(a.utilisation_percent) >= 100;
    if (a.exceeded) {
      notifications.push({
        type: "budget_exceeded",
        severity: "danger",
        message: `Budget exceeded for ${a.category_name}: spent ${a.spent} of ${a.monthly_limit}.`,
      });
    } else if (exhausted) {
      notifications.push({
        type: "budget_exhausted",
        severity: "danger",
        message: `${a.category_name} budget is exhausted (100% used).`,
      });
    } else if (a.nearly_exhausted) {
      notifications.push({
        type: "budget_nearly_exhausted",
        severity: "warning",
        message: `${a.category_name} budget is nearly exhausted (${a.utilisation_percent}% used).`,
      });
    }
  }

  for (const g of goals) {
    if (g.is_complete) continue;
    if (g.required_monthly_saving > 0 && g.required_monthly_saving > Math.max(0, savings)) {
      notifications.push({
        type: "goal_contribution_pending",
        severity: "warning",
        message: `${g.goal_name} needs ${g.required_monthly_saving} saved this month, but only ${round2(Math.max(0, savings))} is available.`,
      });
    } else if (g.required_monthly_saving > 0) {
      notifications.push({
        type: "goal_contribution_pending",
        severity: "info",
        message: `Contribute ${g.required_monthly_saving} to ${g.goal_name} this month to stay on track.`,
      });
    }
  }

  return notifications;
}

/** GET /api/reports/summary?month=YYYY-MM — powers the dashboard & reports overview. */
async function summary(req, res, next) {
  try {
    const month = req.query.month || currentMonth();
    const userId = req.user.id;

    const [
      totalIncome,
      totalExpenses,
      totalInvestments,
      categoryBreakdown,
      rawGoals,
      investmentStats,
      investmentDistribution,
      allIncomeRows,
      allExpenseRows,
    ] = await Promise.all([
      Income.totalForMonth(userId, month),
      Expense.totalForMonth(userId, month),
      Investment.totalForMonth(userId, month),
      Expense.totalsByCategory(userId, month),
      Goal.findAllByUser(userId),
      Investment.allTimeStats(userId),
      Investment.totalsByType(userId, month),
      Income.monthlyTotals(userId, 60),
      Expense.monthlyTotals(userId, 60),
    ]);

    const savings = calculateSavings(totalIncome, totalExpenses);
    const rows = await buildCategoryRows(userId, month);
    const plan = allocateBudget(totalIncome, rows);
    const goals = rawGoals.map((g) => computeGoal(g, Math.max(0, savings)));

    const goalTarget = round2(goals.reduce((s, g) => s + Number(g.target_amount), 0));
    const goalSaved = round2(goals.reduce((s, g) => s + Number(g.saved_amount), 0));

    // Cumulative Savings calculation across all historical months
    const lifetimeIncome = allIncomeRows.reduce((s, r) => s + Number(r.total), 0);
    const lifetimeExpenses = allExpenseRows.reduce((s, r) => s + Number(r.total), 0);
    const allTimeCumulativeSavings = round2(lifetimeIncome - lifetimeExpenses);

    res.json({
      month,
      totals: {
        income: round2(totalIncome),
        expenses: round2(totalExpenses),
        investments: round2(totalInvestments),
        savings,
        remaining: savings,
        net_cash_added: round2(totalIncome - totalExpenses - totalInvestments),
        cumulative_savings: allTimeCumulativeSavings,
      },
      category_breakdown: categoryBreakdown.filter((c) => c.total > 0),
      budget: plan,
      investments: {
        month_total: round2(totalInvestments),
        all_time: investmentStats,
        distribution: investmentDistribution,
      },
      wallet: {
        cumulative_savings: allTimeCumulativeSavings,
        total_invested: round2(investmentStats.total_invested),
        current_portfolio_value: round2(investmentStats.current_value),
        total_net_worth: round2(allTimeCumulativeSavings + investmentStats.current_value),
      },
      goals: {
        items: goals,
        total_target: goalTarget,
        total_saved: goalSaved,
        overall_progress_percent: goalTarget > 0 ? round2((goalSaved / goalTarget) * 100) : 0,
      },
      notifications: buildNotifications(plan, goals, savings),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/reports/monthly?months=6 — trend data for charts. */
async function monthly(req, res, next) {
  try {
    const limit = Math.min(24, Math.max(1, Number(req.query.months) || 6));
    const userId = req.user.id;

    const [incomeRows, expenseRows, investmentRows] = await Promise.all([
      Income.monthlyTotals(userId, limit),
      Expense.monthlyTotals(userId, limit),
      Investment.monthlyTotals(userId, limit),
    ]);

    const months = Array.from(
      new Set([
        ...incomeRows.map((r) => r.month),
        ...expenseRows.map((r) => r.month),
        ...investmentRows.map((r) => r.month),
      ])
    ).sort();

    let cumulativeSavings = 0;
    const trend = months.map((m) => {
      const income = Number(incomeRows.find((r) => r.month === m)?.total || 0);
      const expenses = Number(expenseRows.find((r) => r.month === m)?.total || 0);
      const investments = Number(investmentRows.find((r) => r.month === m)?.total || 0);
      const savings = calculateSavings(income, expenses);
      cumulativeSavings = round2(cumulativeSavings + savings);

      return {
        month: m,
        income: round2(income),
        expenses: round2(expenses),
        investments: round2(investments),
        savings,
        remaining: savings,
        net_cash_added: round2(income - expenses - investments),
        cumulative_savings: cumulativeSavings,
      };
    });

    res.json({ trend, months: trend.length });
  } catch (err) {
    next(err);
  }
}

/** GET /api/reports/notifications */
async function notifications(req, res, next) {
  try {
    const month = req.query.month || currentMonth();
    const userId = req.user.id;
    const [totalIncome, totalExpenses, rawGoals] = await Promise.all([
      Income.totalForMonth(userId, month),
      Expense.totalForMonth(userId, month),
      Goal.findAllByUser(userId),
    ]);
    const savings = calculateSavings(totalIncome, totalExpenses);
    const rows = await buildCategoryRows(userId, month);
    const plan = allocateBudget(totalIncome, rows);
    const goals = rawGoals.map((g) => computeGoal(g, Math.max(0, savings)));
    res.json({ month, notifications: buildNotifications(plan, goals, savings) });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, monthly, notifications };
