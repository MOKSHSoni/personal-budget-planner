ER diagram (export a rendered image of this as database/er-diagram.png):

```text
                +-------------------+
                |      Users        |
                | id (PK)           |
                | name, email       |
                | password, theme   |
                | currency,         |
                | salary_date       |
                | created_at        |
                +---------+---------+
                          | 1
      +-------------------+-------------------+-----------------+
      | *                 | *                 | *               | *
+-----+------+   +--------+---------+   +-----+------+   +------+------+
|  Income    |   | ExpenseCategory  |   |   Goals    |   |  Budgets    |
| id (PK)    |   | id (PK)          |   | id (PK)    |   | id (PK)     |
| user_id FK |   | user_id FK       |   | user_id FK |   | user_id FK  |
| source     |   | name             |   | goal_name  |   | category_id FK
| amount     |   | type(fixed/var)  |   | target_amt |   | monthly_limit
| month      |   +--------+---------+   | saved_amt  |   | priority    |
+------------+            | 1           | deadline   |   +-------------+
                          |             | priority   |
                          | *           +------------+
                    +-----+-------+
                    |  Expenses   |
                    | id (PK)     |
                    | user_id FK  |
                    | category_id FK
                    | amount      |
                    | date        |
                    | description |
                    +-------------+
```

Relationships: Users 1—* Income, ExpenseCategory, Budgets, Goals, Expenses;
ExpenseCategory 1—* Expenses and 1—1 Budgets (unique per user + category).
