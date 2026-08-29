import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  SlidersHorizontal,
  Search,
  Calendar,
  Tag,
  Receipt,
  X,
  CreditCard,
  Trash2,
  Lock,
  ArrowRight,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import expenseService, { categoryService } from "../services/expenseService";
import { getErrorMessage } from "../services/api";
import { currentMonth, formatCurrency, toDateInput } from "../utils/formatCurrency";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import CountUp from "../components/common/CountUp";
import { TransactionRowSkeleton } from "../components/common/Skeleton";
import ExpenseCard from "../components/cards/ExpenseCard";

export default function Expenses() {
  const { currency } = useAuth();
  const [filters, setFilters] = useState({ month: currentMonth(), category_id: "", search: "" });
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'variable' | 'fixed'
  const [data, setData] = useState({ expenses: [], total: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category_id: "", amount: "", date: toDateInput(new Date()), description: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", type: "variable" });
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState("");

  const loadCategories = useCallback(async () => {
    const res = await categoryService.list();
    setCategories(res.categories);
    return res.categories;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.month) params.month = filters.month;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.search) params.search = filters.search;
      const [expenseData] = await Promise.all([expenseService.list(params), loadCategories()]);
      setData(expenseData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, loadCategories]);

  useEffect(() => {
    load();
  }, [load]);

  const variableCategories = categories.filter((c) => c.type === "variable");

  function openCreate() {
    setEditing(null);
    setForm({
      category_id: variableCategories[0]?.id ? String(variableCategories[0].id) : "",
      amount: "",
      date: toDateInput(new Date()),
      description: "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(expense) {
    setEditing(expense);
    setForm({
      category_id: String(expense.category_id),
      amount: String(expense.amount),
      date: toDateInput(expense.date),
      description: expense.description || "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function save() {
    if (!form.category_id) return setFormError("Please choose a variable spending category");
    const selectedCat = categories.find((c) => String(c.id) === String(form.category_id));
    if (selectedCat && selectedCat.type === "fixed") {
      return setFormError(
        "Only variable spending can be added here. Fixed commitments (Rent, EMI, Insurance) must be recorded in the Fixed Commitments tab."
      );
    }
    if (!(Number(form.amount) > 0)) return setFormError("Amount must be greater than zero");
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        category_id: Number(form.category_id),
        amount: Number(form.amount),
        date: form.date,
        description: form.description,
      };
      if (editing) await expenseService.update(editing.id, payload);
      else await expenseService.create(payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(expense) {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await expenseService.remove(expense.id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function saveCategory() {
    if (!catForm.name.trim()) return setCatError("Category name is required");
    setCatSaving(true);
    setCatError("");
    try {
      await categoryService.create({ name: catForm.name.trim(), type: "variable" });
      setCatForm({ name: "", type: "variable" });
      setCatModalOpen(false);
      await load();
    } catch (err) {
      setCatError(getErrorMessage(err));
    } finally {
      setCatSaving(false);
    }
  }

  async function deleteCategory(id) {
    if (!window.confirm("Delete this category and all its expenses?")) return;
    try {
      await categoryService.remove(id);
      await load();
    } catch (err) {
      setCatError(getErrorMessage(err));
    }
  }

  const displayedExpenses = data.expenses.filter((exp) => {
    if (typeFilter === "variable") return exp.category_type !== "fixed";
    if (typeFilter === "fixed") return exp.category_type === "fixed";
    return true;
  });

  const displayedTotal = displayedExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const variableCount = data.expenses.filter((e) => e.category_type !== "fixed").length;
  const fixedCount = data.expenses.filter((e) => e.category_type === "fixed").length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Expenses
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Track, filter, and categorize your spending
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="secondary" onClick={() => setCatModalOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" />
            <span>Categories</span>
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Notice Banner for Fixed Commitments */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-brand-50/40 p-3.5 text-xs text-slate-700 dark:border-slate-800/80 dark:from-slate-900/60 dark:to-brand-950/20 dark:text-slate-300">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <span>
            Looking for <strong>Rent, EMI, or Insurance</strong>? Manage recurring fixed obligations with payment tracking in the new tab.
          </span>
        </div>
        <Link
          to="/fixed-commitments"
          className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 shrink-0"
        >
          <span>Go to Fixed Commitments</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Filter Bar & Summary */}
      <div className="grid gap-4 md:grid-cols-12 md:items-center">
        <div className="card md:col-span-8 space-y-3">
          {/* Sub-tabs: All vs Variable vs Fixed */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/60 w-fit">
            <button
              onClick={() => setTypeFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === "all"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              All ({data.expenses.length})
            </button>
            <button
              onClick={() => setTypeFilter("variable")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === "variable"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Variable Spending ({variableCount})
            </button>
            <button
              onClick={() => setTypeFilter("fixed")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === "fixed"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Fixed Commitments ({fixedCount})
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Month"
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            />
            <Input
              as="select"
              label="Category"
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </Input>
            <Input
              label="Search"
              placeholder="Merchant or description..."
              icon={Search}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        <div className="card md:col-span-4 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Filtered Spending
            </p>
            {(filters.month || filters.category_id || filters.search || typeFilter !== "all") && (
              <button
                onClick={() => {
                  setFilters({ month: "", category_id: "", search: "" });
                  setTypeFilter("all");
                }}
                className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                Reset
              </button>
            )}
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
            <CountUp value={displayedTotal} currency={currency} isCurrency={true} />
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {displayedExpenses.length} transaction{displayedExpenses.length === 1 ? "" : "s"} found
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
          </div>
        ) : displayedExpenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            description={
              filters.search || filters.category_id || typeFilter !== "all"
                ? "Try clearing your filters or changing tabs to see more transactions."
                : "Record your first expense to begin tracking your spending."
            }
            actionLabel="+ Add Expense"
            onAction={openCreate}
          />
        ) : (
          <div className="grid gap-3">
            {displayedExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                currency={currency}
                onEdit={openEdit}
                onDelete={remove}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        open={modalOpen}
        title={editing ? "Edit Expense" : "Add Expense"}
        subtitle="Record your spending details"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? "Update Expense" : "Save Expense"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {formError}
            </p>
          )}
          <Input
            as="select"
            label="Category (Variable Spending Only)"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">Select a variable category</option>
            {variableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Input>
          <Input
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            label="Description / Merchant"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Grocery Store, Coffee, Electricity bill"
          />
        </div>
      </Modal>

      {/* Manage Categories Modal */}
      <Modal
        open={catModalOpen}
        title="Variable Spending Categories"
        subtitle="Create or manage custom variable spending categories"
        onClose={() => setCatModalOpen(false)}
        footer={
          <Button variant="secondary" onClick={() => setCatModalOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          {catError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {catError}
            </p>
          )}
          <div className="flex gap-3">
            <Input
              label="New Variable Category Name"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              className="flex-1"
              placeholder="e.g. Health, Pets, Subscriptions"
            />
            <div className="flex items-end">
              <Button onClick={saveCategory} loading={catSaving}>
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-slate-100 max-h-60 overflow-y-auto dark:divide-slate-800">
            {variableCategories.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5 text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {c.name}
                </span>
                <button
                  onClick={() => deleteCategory(c.id)}
                  title="Delete category"
                  className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  );
}

