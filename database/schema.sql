-- Personal Budget Planner — database schema (MySQL 8)
-- Run:  mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS budget_planner
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE budget_planner;

-- Drop in dependency order (children first)
DROP TABLE IF EXISTS Goals;
DROP TABLE IF EXISTS Budgets;
DROP TABLE IF EXISTS Expenses;
DROP TABLE IF EXISTS ExpenseCategory;
DROP TABLE IF EXISTS Income;
DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password      VARCHAR(255)  NOT NULL,           -- bcrypt hash
  currency      VARCHAR(10)   NOT NULL DEFAULT 'INR',
  salary_date   TINYINT       NOT NULL DEFAULT 1, -- day of month salary arrives
  theme         ENUM('light','dark') NOT NULL DEFAULT 'light',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Income (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT            NOT NULL,
  source    VARCHAR(100)   NOT NULL,   -- Salary, Freelancing, Investments, Other, custom
  amount    DECIMAL(12,2)  NOT NULL,
  month     CHAR(7)        NOT NULL,   -- 'YYYY-MM'
  CONSTRAINT fk_income_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_income_user_month (user_id, month)
) ENGINE=InnoDB;

CREATE TABLE ExpenseCategory (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT           NOT NULL,
  name      VARCHAR(60)   NOT NULL,
  type      ENUM('fixed','variable') NOT NULL,
  CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_category_user_name (user_id, name)
) ENGINE=InnoDB;

CREATE TABLE Expenses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT            NOT NULL,
  category_id  INT            NOT NULL,
  amount       DECIMAL(12,2)  NOT NULL,
  date         DATE           NOT NULL,
  description  VARCHAR(255)   NULL,
  CONSTRAINT fk_expense_user     FOREIGN KEY (user_id)     REFERENCES Users(id) ON DELETE CASCADE,
  CONSTRAINT fk_expense_category FOREIGN KEY (category_id) REFERENCES ExpenseCategory(id) ON DELETE CASCADE,
  INDEX idx_expense_user_date (user_id, date),
  INDEX idx_expense_category (category_id)
) ENGINE=InnoDB;

CREATE TABLE Budgets (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT            NOT NULL,
  category_id    INT            NOT NULL,
  monthly_limit  DECIMAL(12,2)  NOT NULL DEFAULT 0,
  priority       ENUM('Low','Medium','High','Very High') NOT NULL DEFAULT 'Low',
  CONSTRAINT fk_budget_user     FOREIGN KEY (user_id)     REFERENCES Users(id) ON DELETE CASCADE,
  CONSTRAINT fk_budget_category FOREIGN KEY (category_id) REFERENCES ExpenseCategory(id) ON DELETE CASCADE,
  UNIQUE KEY uq_budget_user_category (user_id, category_id)
) ENGINE=InnoDB;

CREATE TABLE Goals (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT            NOT NULL,
  goal_name      VARCHAR(100)   NOT NULL,
  target_amount  DECIMAL(12,2)  NOT NULL,
  saved_amount   DECIMAL(12,2)  NOT NULL DEFAULT 0,
  deadline       DATE           NULL,
  priority       ENUM('Low','Medium','High','Very High') NOT NULL DEFAULT 'Medium',
  CONSTRAINT fk_goal_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_goal_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE Investments (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT            NOT NULL,
  name           VARCHAR(100)   NOT NULL,
  type           VARCHAR(50)    NOT NULL,
  amount         DECIMAL(12,2)  NOT NULL,
  current_value  DECIMAL(12,2)  NULL,
  date           DATE           NOT NULL,
  month          CHAR(7)        NOT NULL,
  notes          VARCHAR(255)   NULL,
  CONSTRAINT fk_investment_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_investment_user_month (user_id, month),
  INDEX idx_investment_user_type (user_id, type)
) ENGINE=InnoDB;

CREATE TABLE BillReminders (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT            NOT NULL,
  name           VARCHAR(100)   NOT NULL,
  amount         DECIMAL(12,2)  NOT NULL,
  due_day        INT            NOT NULL,
  category_id    INT            NULL,
  type           ENUM('fixed', 'variable', 'investment', 'income') DEFAULT 'fixed',
  is_recurring   BOOLEAN        DEFAULT TRUE,
  notes          TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reminder_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reminder_category FOREIGN KEY (category_id) REFERENCES ExpenseCategory(id) ON DELETE SET NULL,
  INDEX idx_reminder_user_day (user_id, due_day)
) ENGINE=InnoDB;
