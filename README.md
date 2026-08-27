# Personal Budget Planner

Full-stack personal budgeting app: React (Vite) + Tailwind frontend, Express REST API, MySQL
via the `mysql2` driver with raw parameterized SQL (no ORM), JWT + bcrypt auth.

All financial logic (budget allocation, goal maths, monthly totals, validation) lives in the
backend under `backend/utils/`. The frontend only renders values returned by the API, so any
other client — e.g. a React Native app later — gets the same complete behaviour.

## Features

- Register / login / logout with JWT, protected routes, profile GET & PUT
- 10 default expense categories created for every new user at registration
- Income CRUD with per-month totals
- Expense CRUD with search and month/category filters, custom categories
- Budget planner with priority weights (Low 1, Medium 2, High 3, Very High 4)
- Dashboard: income, spent, remaining, saved, goal progress + Recharts charts
- Goals with required monthly saving, % progress and expected completion date
- Reports: pie chart, bar chart, monthly trend line, monthly table
- In-app alerts: budget exceeded, budget nearly exhausted, goal contribution pending
- Settings: currency, salary date, light/dark theme, profile edit

## Requirements

- Node.js 18+
- MySQL 8 (or MariaDB 10.6+) running locally

## 1. Database

```bash
# create schema (creates the budget_planner database and all tables)
mysql -u root -p < database/schema.sql

# OPTIONAL: development-only sample data (demo@example.com / password123)
mysql -u root -p budget_planner < database/seed.sql
```

`database/seed.sql` is for development only. Real users get their own 10 default categories
from the backend registration flow (`ExpenseCategory.createDefaultsForUser`).

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env    # then edit the values
npm run dev             # or: npm start
```

`backend/.env`:

| Variable | Example | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | `secret` | MySQL password |
| `DB_NAME` | `budget_planner` | Database name |
| `JWT_SECRET` | long random string | Signs JWTs |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allow-list for the Vite frontend |

Check it is up: `curl http://localhost:5000/api/health`

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm run dev             # http://localhost:5173
```

Run both together: two terminals, backend first (the frontend needs the API for login).

## Budget allocation algorithm (backend/utils/budgetCalculator.js)

1. Total monthly income for the selected month.
2. Subtract the required fixed-category spend (Rent, Electricity, Internet, EMI, Insurance —
   the stored monthly limit, or the actual spend when no limit is set) → **discretionary remainder**.
   Fixed requirements are scaled down proportionally if they exceed income.
3. Split the discretionary remainder across variable categories in proportion to their priority
   weight (Low 1, Medium 2, High 3, Very High 4).
4. Recommendations are never negative and never total more than the monthly income.
5. Categories where actual spend exceeds the limit are flagged (`exceeded`), and categories at
   80%+ of the limit are flagged `nearly_exhausted`.

## Definitions

- **Savings** = Total Income − Total Expenses for the selected month.
- **Remaining** = the same available balance, except inside a budget allocation view where it
  means allocated limit − spent for that category.
- Transfers between a user's own categories are not treated as expenses.

## Project structure

```
budget-planner/
├── frontend/   React + Vite + Tailwind + React Router + Axios + Recharts
├── backend/    Express + mysql2 + JWT + bcrypt (controllers / routes / models / middleware / utils)
├── database/   schema.sql, seed.sql, er-diagram.png
└── docs/       api-documentation.md, project-report.md, screenshots/
```

Full endpoint reference: [docs/api-documentation.md](docs/api-documentation.md)
