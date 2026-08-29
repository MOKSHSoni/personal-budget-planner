-- Development-only sample data. This file is NOT run for real users:
-- every new account gets its own 10 default categories from the backend
-- registration flow (ExpenseCategory.createDefaultsForUser).
--
-- Run:  mysql -u root -p budget_planner < database/seed.sql
USE budget_planner;

-- Demo user (password below is the bcrypt hash of "password123")
INSERT INTO Users (name, email, password, currency, salary_date, theme)
VALUES ('Demo User', 'demo@example.com',
        '$2a$10$XmTPgYndjSkePowe7..cIeJtNovBRONYJKuyTMXtyzvGZJ2sq5OYa',
        'INR', 1, 'light');

SET @uid = LAST_INSERT_ID();

-- Reference set of the 10 default categories (5 fixed + 5 variable)
INSERT INTO ExpenseCategory (user_id, name, type) VALUES
  (@uid, 'Rent',          'fixed'),
  (@uid, 'Electricity',   'variable'), 
  (@uid, 'Internet',      'fixed'),
  (@uid, 'EMI',           'fixed'),
  (@uid, 'Insurance',     'fixed'),
  (@uid, 'Food',          'variable'),
  (@uid, 'Fuel',          'variable'),
  (@uid, 'Shopping',      'variable'),
  (@uid, 'Entertainment', 'variable'),
  (@uid, 'Travel',        'variable');

INSERT INTO Income (user_id, source, amount, month) VALUES
  (@uid, 'Salary',       50000.00, DATE_FORMAT(CURDATE(), '%Y-%m')),
  (@uid, 'Freelancing',   8000.00, DATE_FORMAT(CURDATE(), '%Y-%m')),
  (@uid, 'Salary',       50000.00, DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m'));

INSERT INTO Expenses (user_id, category_id, amount, date, description)
SELECT @uid, c.id, 15000.00, CURDATE(), 'Monthly rent' FROM ExpenseCategory c WHERE c.user_id = @uid AND c.name = 'Rent';
INSERT INTO Expenses (user_id, category_id, amount, date, description)
SELECT @uid, c.id, 1800.00, CURDATE(), 'Electricity bill' FROM ExpenseCategory c WHERE c.user_id = @uid AND c.name = 'Electricity';
INSERT INTO Expenses (user_id, category_id, amount, date, description)
SELECT @uid, c.id, 6200.00, CURDATE(), 'Groceries and eating out' FROM ExpenseCategory c WHERE c.user_id = @uid AND c.name = 'Food';
INSERT INTO Expenses (user_id, category_id, amount, date, description)
SELECT @uid, c.id, 2400.00, CURDATE(), 'Petrol' FROM ExpenseCategory c WHERE c.user_id = @uid AND c.name = 'Fuel';

INSERT INTO Budgets (user_id, category_id, monthly_limit, priority)
SELECT @uid, c.id, 15000.00, 'Very High' FROM ExpenseCategory c WHERE c.user_id = @uid AND c.name = 'Rent';
INSERT INTO Budgets (user_id, category_id, monthly_limit, priority)
SELECT @uid, c.id, 7000.00, 'High' FROM ExpenseCategory c WHERE c.user_id = @uid AND c.name = 'Food';
INSERT INTO Budgets (user_id, category_id, monthly_limit, priority)
SELECT @uid, c.id, 3000.00, 'Medium' FROM ExpenseCategory c WHERE c.user_id = @uid AND c.name = 'Fuel';
INSERT INTO Budgets (user_id, category_id, monthly_limit, priority)
SELECT @uid, c.id, 2000.00, 'Low' FROM ExpenseCategory c WHERE c.user_id = @uid AND c.name = 'Entertainment';

INSERT INTO Goals (user_id, goal_name, target_amount, saved_amount, deadline, priority) VALUES
  (@uid, 'Emergency Fund', 100000.00, 25000.00, DATE_ADD(CURDATE(), INTERVAL 10 MONTH), 'Very High'),
  (@uid, 'New Laptop',      80000.00, 20000.00, DATE_ADD(CURDATE(), INTERVAL 6 MONTH),  'High'),
  (@uid, 'Goa Trip',        30000.00,  5000.00, DATE_ADD(CURDATE(), INTERVAL 4 MONTH),  'Medium');
INSERT INTO Investments (user_id, name, type, amount, current_value, date, month, notes) VALUES
  (@uid, 'HDFC Top 100 Index Fund',  'Mutual Funds / SIP', 5000.00, 5450.00, CURDATE(), DATE_FORMAT(CURDATE(), '%Y-%m'), 'Monthly SIP'),
  (@uid, 'Nifty 50 Index ETF',       'Stocks / Equities',  4000.00, 4320.00, CURDATE(), DATE_FORMAT(CURDATE(), '%Y-%m'), 'Direct Equity ETF'),
  (@uid, 'Sovereign Gold Bond',      'Gold / SGB',         3000.00, 3250.00, CURDATE(), DATE_FORMAT(CURDATE(), '%Y-%m'), 'RBI Gold Bond Tranche'),
  (@uid, 'Public Provident Fund',    'PPF / EPF / NPS',    2500.00, 2500.00, CURDATE(), DATE_FORMAT(CURDATE(), '%Y-%m'), 'Government PPF Account');

-- 10. Bill Reminders & Calendar Schedule
INSERT INTO BillReminders (user_id, name, amount, due_day, category_id, type, is_recurring, notes) VALUES
  (@uid, 'House Rent',              15000.00,  1, 1,    'fixed',      1, 'Auto-transfer to landlord on 1st'),
  (@uid, 'Home/Car Loan EMI',       10000.00,  5, 4,    'fixed',      1, 'Auto-debit from HDFC Bank on 5th'),
  (@uid, 'Nifty 50 Index Fund SIP',  5000.00, 10, NULL, 'investment', 1, 'Monthly mutual fund SIP on 10th'),
  (@uid, 'Health & Term Insurance',  2500.00, 15, 5,    'fixed',      1, 'Health insurance premium on 15th'),
  (@uid, 'Fiber Broadband Bill',     1000.00, 20, 3,    'fixed',      1, 'Airtel broadband internet on 20th'),
  (@uid, 'Electricity Power Bill',   1800.00, 25, 2,    'variable',   1, 'State electricity power board on 25th');
