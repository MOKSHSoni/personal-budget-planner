import { useCallback, useEffect, useState } from "react";
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

  function openCreate() {
    setEditing(null);
    setForm({
      category_id: categories[0]?.id ? String(categories[0].id) : "",
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
    if (!form.category_id) return setFormError("Please choose a category");
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
      await categoryService.create({ name: catForm.name.trim(), type: catForm.type });
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

      {/* Filter Bar & Summary */}
      <div className="grid gap-4 md:grid-cols-12 md:items-center">
        <div className="card md:col-span-8">
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
                  {c.name}
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
            {(filters.month || filters.category_id || filters.search) && (
              <button
                onClick={() => setFilters({ month: "", category_id: "", search: "" })}
                className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                Reset
              </button>
            )}
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
            <CountUp value={data.total} currency={currency} isCurrency={true} />
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {data.expenses.length} transaction{data.expenses.length === 1 ? "" : "s"} found
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
        ) : data.expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            description={
              filters.search || filters.category_id
                ? "Try clearing your filters to see more transactions."
                : "Record your first expense to begin tracking your spending."
            }
            actionLabel="+ Add Expense"
            onAction={openCreate}
          />
        ) : (
          <div className="grid gap-3">
            {data.expenses.map((expense) => (
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
            label="Category"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
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
        title="Expense Categories"
        subtitle="Create or manage custom spending categories"
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
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Name"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              className="sm:col-span-1"
              placeholder="e.g. Health"
            />
            <Input
              as="select"
              label="Type"
              value={catForm.type}
              onChange={(e) => setCatForm({ ...catForm, type: e.target.value })}
            >
              <option value="fixed">Fixed</option>
              <option value="variable">Variable</option>
            </Input>
            <div className="flex items-end">
              <Button className="w-full" onClick={saveCategory} loading={catSaving}>
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-slate-100 max-h-60 overflow-y-auto dark:divide-slate-800">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5 text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {c.name}{" "}
                  <span className="ml-1 text-[11px] font-normal text-slate-400">
                    ({c.type})
                  </span>
                </span>
                <Button size="sm" variant="danger" onClick={() => deleteCategory(c.id)}>
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  );
}

