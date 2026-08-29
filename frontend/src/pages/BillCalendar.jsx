import { useCallback, useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  TrendingUp,
  Receipt,
  Edit2,
  Trash2,
  ArrowDownLeft,
  Sparkles,
  CalendarCheck,
  Check,
  Bell,
  Coins,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import billCalendarService from "../services/billCalendarService";
import { categoryService } from "../services/expenseService";
import { getErrorMessage } from "../services/api";
import {
  currentMonth,
  formatCurrency,
  formatDate,
  formatMonth,
  toDateInput,
} from "../utils/formatCurrency";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import CountUp from "../components/common/CountUp";
import { MetricSkeleton } from "../components/common/Skeleton";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function BillCalendar() {
  const { currency } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Modals
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [reminderForm, setReminderForm] = useState({
    name: "",
    amount: "",
    due_day: "1",
    category_id: "",
    type: "fixed",
    notes: "",
  });
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderError, setReminderError] = useState("");

  // Pay Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    date: toDateInput(new Date()),
    description: "",
  });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [calData, catData] = await Promise.all([
        billCalendarService.getMonth(month),
        categoryService.list(),
      ]);
      setData(calData);
      setCategories(catData.categories || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigation helpers
  function prevMonth() {
    const [y, m] = month.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setMonth(prevDate.toISOString().slice(0, 7));
  }

  function nextMonth() {
    const [y, m] = month.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    setMonth(nextDate.toISOString().slice(0, 7));
  }

  function goToCurrentMonth() {
    setMonth(currentMonth());
    setSelectedDay(new Date().getDate());
  }

  // Calendar Math
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const firstDayOfWeek = new Date(year, monthNum - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const totalDays = data?.days_in_month || 31;
  const todayStr = data?.today || new Date().toISOString().slice(0, 10);

  // Selected Day Events
  const dayEvents = data?.day_events?.[selectedDay] || [];

  function openCreateReminder() {
    setEditingReminder(null);
    setReminderForm({
      name: "",
      amount: "",
      due_day: String(selectedDay || 1),
      category_id: categories[0]?.id ? String(categories[0].id) : "",
      type: "fixed",
      notes: "",
    });
    setReminderError("");
    setReminderModalOpen(true);
  }

  function openEditReminder(reminder) {
    setEditingReminder(reminder);
    setReminderForm({
      name: reminder.name,
      amount: String(reminder.amount),
      due_day: String(reminder.due_day),
      category_id: reminder.category_id ? String(reminder.category_id) : "",
      type: reminder.type || "fixed",
      notes: reminder.notes || "",
    });
    setReminderError("");
    setReminderModalOpen(true);
  }

  async function handleSaveReminder() {
    if (!reminderForm.name.trim()) return setReminderError("Please enter a bill / reminder name.");
    if (!(Number(reminderForm.amount) > 0)) return setReminderError("Amount must be greater than zero.");
    const day = Number(reminderForm.due_day);
    if (!(day >= 1 && day <= 31)) return setReminderError("Due day must be between 1 and 31.");

    setSavingReminder(true);
    setReminderError("");
    try {
      const payload = {
        name: reminderForm.name.trim(),
        amount: Number(reminderForm.amount),
        due_day: day,
        category_id: reminderForm.category_id ? Number(reminderForm.category_id) : null,
        type: reminderForm.type,
        notes: reminderForm.notes,
      };
      if (editingReminder) {
        await billCalendarService.updateReminder(editingReminder.id, payload);
      } else {
        await billCalendarService.createReminder(payload);
      }
      setReminderModalOpen(false);
      await loadData();
    } catch (err) {
      setReminderError(getErrorMessage(err));
    } finally {
      setSavingReminder(false);
    }
  }

  async function handleDeleteReminder(reminder) {
    if (!window.confirm(`Delete reminder for "${reminder.name}"?`)) return;
    try {
      await billCalendarService.deleteReminder(reminder.id);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function openPayModal(event) {
    setPayTarget(event);
    setPayForm({
      amount: String(event.amount),
      date: event.due_date,
      description: `${event.name} Payment`,
    });
    setPayError("");
    setPayModalOpen(true);
  }

  async function handleConfirmPayment() {
    if (!(Number(payForm.amount) > 0)) return setPayError("Please enter a valid amount.");
    setPaying(true);
    setPayError("");
    try {
      await billCalendarService.quickPay({
        reminder_id: payTarget.id,
        amount: Number(payForm.amount),
        date: payForm.date,
        description: payForm.description,
        category_id: payTarget.category_id,
        type: payTarget.type,
      });
      setPayModalOpen(false);
      await loadData();
    } catch (err) {
      setPayError(getErrorMessage(err));
    } finally {
      setPaying(false);
    }
  }

  const metrics = data?.metrics || {
    total_scheduled: 0,
    total_paid: 0,
    total_pending: 0,
    paid_count: 0,
    pending_count: 0,
    overdue_count: 0,
    next_bill: null,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Bill Calendar & Due Dates
            </h1>
            <span className="badge bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <CalendarCheck className="h-3 w-3" />
              Schedule & Reminders
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Track fixed commitments, monthly SIPs, utilities, and upcoming bill deadlines for {formatMonth(month)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Controls */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-subtle dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={prevMonth}
              title="Previous Month"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200">
              {formatMonth(month)}
            </span>
            <button
              onClick={nextMonth}
              title="Next Month"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={goToCurrentMonth}>
            Today
          </Button>

          <Button onClick={openCreateReminder}>
            <Plus className="h-4 w-4" />
            <span>+ Add Bill Reminder</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Top 4 Metrics */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {loading && !data ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <div className="card-interactive flex flex-col justify-between p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Scheduled Due
                </p>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <CalendarIcon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2 min-w-0">
                <p className="text-base sm:text-lg lg:text-xl font-bold tabular-nums text-slate-900 dark:text-white truncate">
                  <CountUp value={metrics.total_scheduled} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {data?.events?.length || 0} scheduled bill{data?.events?.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="card-interactive flex flex-col justify-between p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Paid This Month
                </p>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2 min-w-0">
                <p className="text-base sm:text-lg lg:text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 truncate">
                  <CountUp value={metrics.total_paid} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {metrics.paid_count} completed
                </p>
              </div>
            </div>

            <div className="card-interactive flex flex-col justify-between p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pending / Due
                </p>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-500/20">
                  <Clock className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2 min-w-0">
                <p className="text-base sm:text-lg lg:text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400 truncate">
                  <CountUp value={metrics.total_pending} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {metrics.pending_count} pending {metrics.overdue_count > 0 && `(${metrics.overdue_count} overdue)`}
                </p>
              </div>
            </div>

            <div className="card-interactive flex flex-col justify-between p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Next Due Bill
                </p>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/20">
                  <Bell className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2 min-w-0">
                {metrics.next_bill ? (
                  <>
                    <p className="text-base sm:text-lg lg:text-xl font-bold tabular-nums text-purple-600 dark:text-purple-400 truncate">
                      {formatCurrency(metrics.next_bill.amount, currency)}
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate font-semibold">
                      {metrics.next_bill.name} (Day {metrics.next_bill.due_day})
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      All Clear! 🎉
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
                      No pending bills
                    </p>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main 2-Column Calendar Layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Calendar Grid (8 cols) */}
        <div className="card lg:col-span-8 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {formatMonth(month)} Schedule Grid
              </h2>
              <p className="text-xs text-slate-400">
                Click any day to view scheduled obligations and record payments
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Paid
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Due
              </span>
              <span className="flex items-center gap-1 text-rose-600 font-semibold">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Overdue
              </span>
            </div>
          </div>

          {/* Weekdays Row */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          {/* Month Days Matrix */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty padding tiles */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-20 sm:h-24 rounded-xl border border-transparent bg-slate-50/30 dark:bg-slate-900/20 opacity-40"
              />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const dayPad = String(day).padStart(2, "0");
              const dateStr = `${month}-${dayPad}`;
              const isToday = dateStr === todayStr;
              const isSelected = selectedDay === day;
              const eventsForDay = data?.day_events?.[day] || [];
              const hasOverdue = eventsForDay.some((e) => e.status === "overdue");
              const hasDueToday = eventsForDay.some((e) => e.status === "due_today");
              const hasPending = eventsForDay.some((e) => e.status !== "paid");
              const hasPaid = eventsForDay.some((e) => e.status === "paid");

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`h-20 sm:h-24 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20 dark:border-brand-400 dark:bg-brand-950/40"
                      : isToday
                      ? "border-emerald-400 bg-emerald-50/30 dark:border-emerald-500/60 dark:bg-emerald-950/20"
                      : "border-slate-200/70 bg-white/80 hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-5 w-5 flex items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? "bg-emerald-600 text-white"
                          : isSelected
                          ? "bg-brand-600 text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {day}
                    </span>
                    {eventsForDay.length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    )}
                  </div>

                  {/* Day Events Pills */}
                  <div className="space-y-1 overflow-hidden">
                    {eventsForDay.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`truncate rounded px-1 py-0.5 text-[9px] font-bold tracking-tight ${
                          ev.status === "paid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : ev.status === "overdue"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : ev.status === "due_today"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                        title={`${ev.name}: ${formatCurrency(ev.amount, currency)} (${ev.status})`}
                      >
                        {ev.name}
                      </div>
                    ))}
                    {eventsForDay.length > 2 && (
                      <p className="text-[8px] font-bold text-slate-400 pl-0.5">
                        +{eventsForDay.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector & Reminders Drawer (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Day {selectedDay} Schedule ({formatMonth(month)})
                </h3>
                <p className="text-xs text-slate-400">
                  {dayEvents.length} obligation{dayEvents.length === 1 ? "" : "s"} scheduled
                </p>
              </div>
              <button
                onClick={openCreateReminder}
                title="Add reminder on this day"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {dayEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CalendarIcon className="h-8 w-8 mx-auto text-slate-300 mb-2 dark:text-slate-600" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  No bills scheduled on Day {selectedDay}
                </p>
                <p className="mt-1 text-[11px]">Click the '+' button to schedule a bill on this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayEvents.map((event) => {
                  const isPaid = event.status === "paid";
                  const isOverdue = event.status === "overdue";

                  return (
                    <div
                      key={event.id}
                      className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                        isPaid
                          ? "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                          : isOverdue
                          ? "border-rose-200/80 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20"
                          : "border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {event.name}
                            </h4>
                            <span
                              className={`badge text-[9px] uppercase ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : isOverdue
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {event.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Due on Day {event.due_day} · {event.type}
                          </p>
                        </div>

                        <p className="text-xs font-black tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(event.amount, currency)}
                        </p>
                      </div>

                      {event.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          "{event.notes}"
                        </p>
                      )}

                      {/* Action Row */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditReminder(event)}
                            title="Edit reminder"
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteReminder(event)}
                            title="Delete reminder"
                            className="p-1 text-rose-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        {!isPaid && (
                          <Button
                            size="sm"
                            onClick={() => openPayModal(event)}
                            className="text-xs py-1 px-2.5 h-7"
                          >
                            <Check className="h-3 w-3" />
                            <span>Mark Paid</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All Scheduled Reminders Quick List */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                All Monthly Recurring Commitments
              </h3>
              <span className="badge text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {data?.reminders?.length || 0} active
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {(data?.reminders || []).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 px-1">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {r.name}
                    </p>
                    <p className="text-[10px] text-slate-400">Day {r.due_day} of every month</p>
                  </div>
                  <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatCurrency(r.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Bill Reminder Modal */}
      <Modal
        open={reminderModalOpen}
        title={editingReminder ? "Edit Bill Reminder" : "Add Bill Reminder"}
        subtitle="Set up a scheduled payment obligation or due date"
        onClose={() => setReminderModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReminderModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReminder} loading={savingReminder}>
              {editingReminder ? "Update Reminder" : "Save Reminder"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {reminderError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {reminderError}
            </p>
          )}

          <Input
            label="Bill / Commitment Name"
            placeholder="e.g. House Rent, Car Loan EMI, Mutual Fund SIP, Netflix"
            value={reminderForm.name}
            onChange={(e) => setReminderForm({ ...reminderForm, name: e.target.value })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              value={reminderForm.amount}
              onChange={(e) => setReminderForm({ ...reminderForm, amount: e.target.value })}
              placeholder="0.00"
            />
            <Input
              label="Due Day of Month (1 - 31)"
              type="number"
              min="1"
              max="31"
              value={reminderForm.due_day}
              onChange={(e) => setReminderForm({ ...reminderForm, due_day: e.target.value })}
              placeholder="e.g. 5"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              as="select"
              label="Obligation Type"
              value={reminderForm.type}
              onChange={(e) => setReminderForm({ ...reminderForm, type: e.target.value })}
            >
              <option value="fixed">Fixed Commitment</option>
              <option value="variable">Variable Expense / Bill</option>
              <option value="investment">Investment SIP</option>
              <option value="income">Recurring Income</option>
            </Input>

            <Input
              as="select"
              label="Linked Category"
              value={reminderForm.category_id}
              onChange={(e) => setReminderForm({ ...reminderForm, category_id: e.target.value })}
            >
              <option value="">None / Custom</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </Input>
          </div>

          <Input
            label="Notes / Payment Method (Optional)"
            placeholder="e.g. Auto-debit from HDFC, Landlord UPI: landlord@upi"
            value={reminderForm.notes}
            onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })}
          />
        </div>
      </Modal>

      {/* Quick Pay Modal */}
      <Modal
        open={payModalOpen}
        title={`Record Payment — ${payTarget?.name || ""}`}
        subtitle={`Log payment to mark this due date as paid for ${formatMonth(month)}`}
        onClose={() => setPayModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment} loading={paying}>
              Confirm Payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {payError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {payError}
            </p>
          )}

          <Input
            label="Payment Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
          />

          <Input
            label="Payment Date"
            type="date"
            value={payForm.date}
            onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
          />

          <Input
            label="Description / Reference"
            value={payForm.description}
            onChange={(e) => setPayForm({ ...payForm, description: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
