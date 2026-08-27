const { round2, priorityWeight } = require("./budgetCalculator");

function monthsBetween(from, to) {
  // Normalize dates to start-of-day for consistent calculation
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  if (b < a) return 0; // Handle past dates
  const months =
    (b.getFullYear() - a.getFullYear()) * 12 +
    (b.getMonth() - a.getMonth()) +
    (b.getDate() >= a.getDate() ? 0 : -1);
  return Math.max(0, months);
}

/**
 * Computes: remaining amount, % progress, months left, required monthly
 * savings and expected completion date given a monthly saving capacity.
 */
function computeGoal(goal, monthlySavingCapacity = 0, today = new Date()) {
  const target = Math.max(0, Number(goal.target_amount) || 0);
  const saved = Math.max(0, Number(goal.saved_amount) || 0);
  const remaining = round2(Math.max(0, target - saved));
  const progress_percent = target > 0 ? round2(Math.min(100, (saved / target) * 100)) : 0;

  const monthsLeft = goal.deadline ? monthsBetween(today, goal.deadline) : null;
  const usableMonths = monthsLeft !== null && monthsLeft > 0 ? monthsLeft : 1;
  const required_monthly_saving = remaining > 0 ? round2(remaining / usableMonths) : 0;

  const capacity = Math.max(0, Number(monthlySavingCapacity) || 0);
  let expected_completion_date = null;
  let months_at_current_rate = null;
  if (remaining === 0) {
    expected_completion_date = new Date(today).toISOString().slice(0, 10);
    months_at_current_rate = 0;
  } else if (capacity > 0) {
    months_at_current_rate = Math.ceil(remaining / capacity);
    const d = new Date(today);
    d.setMonth(d.getMonth() + months_at_current_rate);
    expected_completion_date = d.toISOString().slice(0, 10);
  }

  const on_track =
    remaining === 0 ||
    (monthsLeft !== null && capacity > 0 && months_at_current_rate <= Math.max(monthsLeft, 1));

  return {
    ...goal,
    target_amount: round2(target),
    saved_amount: round2(saved),
    remaining_amount: remaining,
    progress_percent,
    months_left: monthsLeft,
    required_monthly_saving,
    months_at_current_rate,
    expected_completion_date,
    on_track,
    priority_weight: priorityWeight(goal.priority),
    is_complete: remaining === 0 && target > 0,
  };
}

/** Splits a monthly saving capacity across goals by priority weight. */
function suggestContributions(goals, monthlySavingCapacity) {
  const capacity = Math.max(0, Number(monthlySavingCapacity) || 0);
  const active = goals.filter((g) => Number(g.saved_amount) < Number(g.target_amount));
  const weightSum = active.reduce((s, g) => s + priorityWeight(g.priority), 0);
  return goals.map((g) => {
    const isActive = active.some((a) => a.id === g.id);
    const suggested =
      isActive && weightSum > 0
        ? round2((capacity * priorityWeight(g.priority)) / weightSum)
        : 0;
    return { goal_id: g.id, suggested_contribution: suggested };
  });
}

module.exports = { computeGoal, suggestContributions, monthsBetween };
