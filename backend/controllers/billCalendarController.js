const BillReminder = require("../models/BillReminder");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Investment = require("../models/Investment");
const ExpenseCategory = require("../models/ExpenseCategory");

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

async function getMonthCalendar(req, res, next) {
  try {
    const month = req.query.month || currentMonth();
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const maxDays = daysInMonth(year, monthNum);

    const todayStr = new Date().toISOString().slice(0, 10);

    const [reminders, expenses, incomes, investments] = await Promise.all([
      BillReminder.findAllByUser(req.user.id),
      Expense.findAllByUser(req.user.id, { month }),
      Income.findAllByUser(req.user.id, { month }),
      Investment.findAllByUser(req.user.id, { month }),
    ]);

    // Map existing expenses by category_id and day
    const expenseByCat = new Map();
    for (const exp of expenses) {
      const dateStr = exp.date instanceof Date
        ? exp.date.toISOString().slice(0, 10)
        : String(exp.date).slice(0, 10);
      const day = parseInt(dateStr.slice(8, 10), 10);
      if (!expenseByCat.has(exp.category_id)) {
        expenseByCat.set(exp.category_id, []);
      }
      expenseByCat.get(exp.category_id).push(exp);
    }

    // Process reminders into monthly calendar events
    let totalScheduled = 0;
    let totalPaid = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    const calendarEvents = [];
    const dayEventsMap = {};
    for (let d = 1; d <= maxDays; d++) {
      dayEventsMap[d] = [];
    }

    for (const r of reminders) {
      const dueDay = Math.min(r.due_day, maxDays);
      const dayPad = String(dueDay).padStart(2, "0");
      const dueDate = `${month}-${dayPad}`;

      totalScheduled += Number(r.amount);

      // Check if this scheduled item has matching payment in expenses
      let isPaid = false;
      let matchedExpense = null;

      if (r.category_id && expenseByCat.has(r.category_id)) {
        const catExps = expenseByCat.get(r.category_id);
        if (catExps && catExps.length > 0) {
          isPaid = true;
          matchedExpense = catExps[0];
        }
      } else if (r.type === "investment") {
        const matchingInv = investments.find(
          (inv) => inv.name.toLowerCase().includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(inv.name.toLowerCase())
        );
        if (matchingInv) {
          isPaid = true;
        }
      }

      const isOverdue = !isPaid && dueDate < todayStr;
      const isDueToday = !isPaid && dueDate === todayStr;
      const isUpcoming = !isPaid && dueDate > todayStr;

      if (isPaid) {
        totalPaid += Number(r.amount);
        paidCount++;
      } else {
        pendingCount++;
        if (isOverdue) overdueCount++;
      }

      const event = {
        id: r.id,
        name: r.name,
        amount: Number(r.amount),
        due_day: dueDay,
        due_date: dueDate,
        category_id: r.category_id,
        category_name: r.category_name,
        type: r.type,
        is_recurring: r.is_recurring,
        notes: r.notes,
        status: isPaid ? "paid" : isOverdue ? "overdue" : isDueToday ? "due_today" : "upcoming",
        matched_expense_id: matchedExpense?.id || null,
      };

      calendarEvents.push(event);
      if (dayEventsMap[dueDay]) {
        dayEventsMap[dueDay].push(event);
      }
    }

    // Sort upcoming events to find the very next bill
    const upcomingEvents = calendarEvents
      .filter((e) => e.status !== "paid")
      .sort((a, b) => a.due_day - b.due_day);
    const nextBill = upcomingEvents[0] || null;

    res.json({
      month,
      year,
      month_num: monthNum,
      days_in_month: maxDays,
      today: todayStr,
      metrics: {
        total_scheduled: totalScheduled,
        total_paid: totalPaid,
        total_pending: Math.max(0, totalScheduled - totalPaid),
        paid_count: paidCount,
        pending_count: pendingCount,
        overdue_count: overdueCount,
        next_bill: nextBill,
      },
      events: calendarEvents,
      day_events: dayEventsMap,
      reminders,
    });
  } catch (err) {
    next(err);
  }
}

async function createReminder(req, res, next) {
  try {
    const { name, amount, due_day, category_id, type, is_recurring, notes } = req.body;
    if (!name || !(Number(amount) > 0) || !(Number(due_day) >= 1 && Number(due_day) <= 31)) {
      return res.status(400).json({ message: "Please provide valid name, amount, and due day (1-31)." });
    }

    const reminder = await BillReminder.create(req.user.id, {
      name: name.trim(),
      amount: Number(amount),
      due_day: Number(due_day),
      category_id: category_id ? Number(category_id) : null,
      type: type || "fixed",
      is_recurring: is_recurring !== undefined ? (is_recurring ? 1 : 0) : 1,
      notes: notes || "",
    });

    res.status(201).json({ reminder });
  } catch (err) {
    next(err);
  }
}

async function updateReminder(req, res, next) {
  try {
    const reminder = await BillReminder.findById(req.params.id, req.user.id);
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });

    const updated = await BillReminder.update(req.params.id, req.user.id, req.body);
    res.json({ reminder: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteReminder(req, res, next) {
  try {
    const ok = await BillReminder.remove(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ message: "Reminder not found" });
    res.json({ message: "Reminder deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function quickPay(req, res, next) {
  try {
    const { reminder_id, amount, date, description, category_id, type } = req.body;
    const reminder = await BillReminder.findById(reminder_id, req.user.id);
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });

    const payDate = date || new Date().toISOString().slice(0, 10);
    const payAmount = Number(amount || reminder.amount);

    if (reminder.type === "investment" || type === "investment") {
      const inv = await Investment.create(req.user.id, {
        name: reminder.name,
        type: "Mutual Funds / SIP",
        amount: payAmount,
        current_value: payAmount,
        date: payDate,
        notes: description || `SIP payment for ${reminder.name}`,
      });
      return res.json({ message: "Investment recorded successfully", investment: inv });
    }

    // Default: Log as expense
    const catId = category_id || reminder.category_id;
    let targetCatId = catId;

    if (!targetCatId) {
      const defaultCats = await ExpenseCategory.findAllByUser(req.user.id);
      targetCatId = defaultCats[0]?.id || 1;
    }

    const exp = await Expense.create(req.user.id, {
      category_id: targetCatId,
      amount: payAmount,
      date: payDate,
      description: description || `${reminder.name} Payment`,
    });

    res.json({ message: "Bill marked as paid and logged into expenses", expense: exp });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMonthCalendar,
  createReminder,
  updateReminder,
  deleteReminder,
  quickPay,
};
