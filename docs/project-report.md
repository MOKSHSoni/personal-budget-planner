# Personal Budget Planner — Project Report

## 1. Introduction

The Personal Budget Planner is a full-stack web application that helps an individual record
income and expenses, plan category budgets by priority, track savings goals and review monthly
reports. It was built as a college project with a strict separation between a REST API backend
and a React frontend, so the same API can later serve a mobile client.

## 2. Objectives

- Record monthly income from multiple sources and compute total income automatically.
- Track expenses against fixed and variable categories with search and filtering.
- Recommend a monthly budget per category using a deterministic, explainable algorithm.
- Track savings goals with required monthly savings and expected completion dates.
- Produce monthly reports and in-app alerts for overspending and pending goal contributions.

## 3. Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 (Vite), Tailwind CSS, React Router, Axios, Recharts |
| Backend | Node.js, Express.js |
| Database | MySQL 8 accessed with the `mysql2` driver (raw parameterized SQL, no ORM) |
| Security | bcrypt password hashing, JWT bearer tokens, CORS restricted to the client origin |

No ORM, no Docker, no cloud services and no AI/ML components are used.

## 4. System architecture

```text
React (Vite, :5173)  --HTTP/JSON + JWT-->  Express REST API (:5000)  --mysql2-->  MySQL
```

- `routes/` map URLs to controllers and attach auth + validation middleware.
- `controllers/` handle HTTP concerns only and delegate maths to `utils/`.
- `models/` contain every SQL statement, all parameterized with `?` placeholders.
- `utils/budgetCalculator.js` and `utils/goalCalculator.js` hold all financial calculations.
- The frontend performs no financial arithmetic; it renders API values and formats currency.

## 5. Database design

Six tables, all referencing `Users(id)` with `ON DELETE CASCADE`:

| Table | Key fields |
| --- | --- |
| Users | id, name, email (unique), password (bcrypt hash), currency, salary_date, theme, created_at |
| Income | id, user_id, source, amount, month (`YYYY-MM`) |
| ExpenseCategory | id, user_id, name, type (fixed / variable), unique per (user, name) |
| Expenses | id, user_id, category_id, amount, date, description |
| Budgets | id, user_id, category_id, monthly_limit, priority, unique per (user, category) |
| Goals | id, user_id, goal_name, target_amount, saved_amount, deadline, priority |

## 6. Budget allocation algorithm

1. Compute total income for the selected month.
2. Compute the required fixed spend (Rent, Electricity, Internet, EMI, Insurance), scaling it
   down proportionally if it exceeds income.
3. Discretionary remainder = income − fixed requirement.
4. Allocate the remainder to variable categories in proportion to priority weight
   (Low 1, Medium 2, High 3, Very High 4): `share = remainder × weight ÷ sum(weights)`.
5. Clamp every recommendation at zero or above; the total never exceeds monthly income.
6. Flag `exceeded` when spend > limit and `nearly_exhausted` at 80% or more of the limit.

Worked example — income 50,000; fixed requirement 15,000 (Rent); variable priorities
Food High(3), Fuel Medium(2), Shopping Low(1), Entertainment Low(1), Travel Low(1):
remainder 35,000, weight sum 8 → Food 13,125; Fuel 8,750; the other three 4,375 each.

## 7. Goal calculations

`remaining = target − saved`, `progress% = saved ÷ target × 100`,
`required monthly saving = remaining ÷ months until the deadline`, and the expected completion
date is derived from the current monthly saving capacity (income − expenses for the month).
Goal contribution suggestions split that capacity by goal priority weight.

## 8. Security

- Passwords stored only as bcrypt hashes (10 salt rounds).
- Stateless JWTs signed with a secret from the environment; `authMiddleware` protects every
  non-auth route and re-loads the user on each request.
- Every SQL statement uses `?` placeholders — no string concatenation of user input.
- Each query filters by `user_id`, so users can only reach their own rows.
- CORS is limited to the origin configured in `CLIENT_ORIGIN`.

## 9. Testing performed

The API was exercised end to end against a live MySQL-compatible server: register (with the
10 default categories created), login, profile update, income CRUD and totals, expense CRUD
with filters, budget upsert plus allocation output, apply-recommendation, goal create and
contribute, report summary/monthly/notifications, validation failures (400) and unauthenticated
access (401). The frontend production build compiles without errors.

## 10. Future scope

React Native client on the same API, recurring transactions, CSV export, and multi-currency
conversion rates.
