const { validateAmount, isValidMonth } = require("../utils/budgetCalculator");

const PRIORITIES = ["Low", "Medium", "High", "Very High"];

/**
 * Tiny schema validator (no external validation library).
 * rules: { field: { required, type, enum, min, max } }
 */
function validateRequest(rules) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = body[field];
      const empty = value === undefined || value === null || value === "";

      if (rule.required && empty) {
        errors.push(`${field} is required`);
        continue;
      }
      if (empty) continue;

      switch (rule.type) {
        case "string":
          if (typeof value !== "string") errors.push(`${field} must be a string`);
          else if (rule.min && value.trim().length < rule.min)
            errors.push(`${field} must be at least ${rule.min} characters`);
          else if (rule.max && value.trim().length > rule.max)
            errors.push(`${field} must be at most ${rule.max} characters`);
          break;
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
            errors.push(`${field} must be a valid email`);
          break;
        case "amount": {
          const msg = validateAmount(value);
          if (msg) errors.push(`${field}: ${msg}`);
          break;
        }
        case "int":
          if (!Number.isInteger(Number(value))) errors.push(`${field} must be an integer`);
          break;
        case "month":
          if (!isValidMonth(value)) errors.push(`${field} must be in YYYY-MM format`);
          break;
        case "date":
          if (Number.isNaN(new Date(value).getTime())) errors.push(`${field} must be a valid date`);
          break;
        case "priority":
          if (!PRIORITIES.includes(value))
            errors.push(`${field} must be one of ${PRIORITIES.join(", ")}`);
          break;
        case "categoryType":
          if (!["fixed", "variable"].includes(value))
            errors.push(`${field} must be 'fixed' or 'variable'`);
          break;
        case "currency":
          if (!["INR", "USD", "EUR", "GBP", "JPY"].includes(value))
            errors.push(`${field} must be one of INR, USD, EUR, GBP, JPY`);
          break;
        case "theme":
          if (!["light", "dark"].includes(value))
            errors.push(`${field} must be 'light' or 'dark'`);
          break;
        default:
          break;
      }
    }

    if (errors.length) return res.status(400).json({ message: errors.join("; "), errors });
    next();
  };
}

module.exports = { validateRequest, PRIORITIES };
