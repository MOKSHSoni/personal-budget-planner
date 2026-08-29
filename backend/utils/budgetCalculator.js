/**
 * Budget allocation algorithm (deterministic, no randomness / ML).
 *
 * Step 1: total monthly income.
 * Step 2: subtract required fixed-category spend (Rent, Electricity,
 *         Internet, EMI, Insurance) -> discretionary remainder.
 * Step 3: split the discretionary remainder across variable categories in
 *         proportion to their priority weight (Low 1, Medium 2, High 3,
 *         Very High 4).
 * Guarantees: no negative recommendation, total allocation never exceeds
 *             total monthly income.
 */

const PRIORITY_WEIGHTS = { Low: 1, Medium: 2, High: 3, "Very High": 4 };

const FIXED_INCOME_RATIOS = {
  emi: 0.20,        // 20% of monthly income (safe debt servicing ratio)
  insurance: 0.05,  // 5% of monthly income (protection / healthcare allocation)
  rent: 0.30,       // 30% of monthly income (housing guideline)
  internet: 0.02,   // 2% of monthly income (connectivity)
};

function priorityWeight(priority) {
  return PRIORITY_WEIGHTS[priority] || 1;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Computes the algorithmic limit benchmark for a fixed category based on monthly income.
 */
function getFixedRecommendedLimit(name, income, currentLimit, spent) {
  const lower = String(name || "").toLowerCase();
  let ratio = null;

  if (lower.includes("emi") || lower.includes("loan") || lower.includes("mortgage")) {
    ratio = FIXED_INCOME_RATIOS.emi;
  } else if (lower.includes("insurance") || lower.includes("policy") || lower.includes("lic")) {
    ratio = FIXED_INCOME_RATIOS.insurance;
  } else if (lower.includes("rent") || lower.includes("housing") || lower.includes("flat") || lower.includes("home")) {
    ratio = FIXED_INCOME_RATIOS.rent;
  } else if (lower.includes("internet") || lower.includes("wifi") || lower.includes("broadband")) {
    ratio = FIXED_INCOME_RATIOS.internet;
  }

  if (ratio !== null && income > 0) {
    return round2(income * ratio);
  }

  if (Number(currentLimit) > 0) return Number(currentLimit);
  return Number(spent) || 0;
}

/**
 * @param {number} totalIncome
 * @param {Array} categories [{ id, name, type, priority, monthly_limit, spent }]
 */
function allocateBudget(totalIncome, categories) {
  const income = Math.max(0, Number(totalIncome) || 0);
  const list = Array.isArray(categories) ? categories : [];

  const fixed = list.filter((c) => c.type === "fixed");
  const variable = list.filter((c) => c.type !== "fixed");

  // Step 2 — required fixed spend:
  // Use user-set monthly limit if present, or algorithmic income-based recommendation.
  let fixedRequiredTotal = 0;
  const fixedAllocations = fixed.map((c) => {
    const recommended = getFixedRecommendedLimit(c.name, income, c.monthly_limit, c.spent);
    const required = Math.max(
      0,
      Number(c.monthly_limit) > 0 ? Number(c.monthly_limit) : recommended
    );
    fixedRequiredTotal += required;
    return { category: c, recommended: required, raw_recommended: recommended };
  });

  // Fixed spend can never exceed income in the recommendation.
  let scale = 1;
  if (fixedRequiredTotal > income && fixedRequiredTotal > 0) {
    scale = income / fixedRequiredTotal;
  }
  const scaledFixed = fixedAllocations.map((a) => ({
    ...a,
    recommended: round2(a.recommended * scale),
  }));
  const fixedTotal = round2(scaledFixed.reduce((s, a) => s + a.recommended, 0));

  // Step 3 — discretionary remainder split by priority weight.
  const discretionary = Math.max(0, round2(income - fixedTotal));
  const weightSum = variable.reduce((s, c) => s + priorityWeight(c.priority), 0);

  const variableAllocations = variable.map((c) => {
    const weight = priorityWeight(c.priority);
    const recommended =
      weightSum > 0 ? round2((discretionary * weight) / weightSum) : 0;
    return { category: c, recommended, weight };
  });

  const rows = [...scaledFixed, ...variableAllocations].map((a) => {
    const spent = Math.max(0, Number(a.category.spent) || 0);
    const recommended = Math.max(0, a.recommended);
    const limit =
      Number(a.category.monthly_limit) > 0
        ? Number(a.category.monthly_limit)
        : recommended;
    const exceeded = spent > limit;
    const utilisationPercent = limit > 0 ? round2((spent / limit) * 100) : 0;
    return {
      category_id: a.category.id,
      category_name: a.category.name,
      type: a.category.type,
      priority: a.category.priority || "Low",
      priority_weight: priorityWeight(a.category.priority),
      monthly_limit: round2(limit),
      recommended_limit: round2(recommended),
      spent: round2(spent),
      // "remaining" in a budget allocation view = limit - spent
      remaining: round2(limit - spent),
      exceeded,
      exhausted: !exceeded && utilisationPercent >= 100,
      nearly_exhausted: !exceeded && utilisationPercent >= 80 && utilisationPercent < 100,
      utilisation_percent: utilisationPercent,
    };
  });

  const totalRecommended = round2(
    rows.reduce((s, r) => s + r.recommended_limit, 0)
  );

  return {
    total_income: round2(income),
    fixed_required_total: fixedTotal,
    discretionary_remainder: discretionary,
    total_recommended: Math.min(totalRecommended, round2(income)),
    weights: PRIORITY_WEIGHTS,
    allocations: rows,
  };
}

/** Savings = Total Income - Total Expenses for the selected month. */
function calculateSavings(totalIncome, totalExpenses) {
  return round2((Number(totalIncome) || 0) - (Number(totalExpenses) || 0));
}

function validateAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "Amount must be a number";
  if (n < 0) return "Amount cannot be negative";
  if (n > 1000000000) return "Amount is unrealistically large";
  return null;
}

function isValidMonth(month) {
  return typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

module.exports = {
  PRIORITY_WEIGHTS,
  FIXED_INCOME_RATIOS,
  priorityWeight,
  getFixedRecommendedLimit,
  allocateBudget,
  calculateSavings,
  validateAmount,
  isValidMonth,
  round2,
};
