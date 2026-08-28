import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  ArrowDownLeft,
  Briefcase,
  Laptop,
  TrendingUp,
  Coins,
  Edit2,
  Trash2,
  Calendar,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import incomeService from "../services/incomeService";
import { getErrorMessage } from "../services/api";
import { currentMonth, formatCurrency, formatMonth } from "../utils/formatCurrency";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import CountUp from "../components/common/CountUp";
import { TableSkeleton } from "../components/common/Skeleton";

const SOURCES = ["Salary", "Freelancing", "Investments", "Other"];
const EMPTY = { source: "Salary", customSource: "", amount: "", month: currentMonth() };

function getSourceIcon(source = "") {
  const lower = source.toLowerCase();
  if (lower.includes("salary") || lower.includes("job")) return Briefcase;
  if (lower.includes("freelance") || lower.includes("contract")) return Laptop;
  if (lower.includes("invest") || lower.includes("dividend") || lower.includes("stock")) return TrendingUp;
  return Coins;
}

export default function Income() {
  const { currency } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState({ incomes: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await incomeService.list(month));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, month });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(income) {
    setEditing(income);
    setForm({
      source: SOURCES.includes(income.source) ? income.source : "Custom",
      customSource: SOURCES.includes(income.source) ? "" : income.source,
      amount: String(income.amount),
      month: income.month,
    });
    setFormError("");
    setModalOpen(true);
  }

  async function save() {
    const source = form.source === "Custom" ? form.customSource.trim() : form.source;
    if (!source) return setFormError("Please enter an income source");
    if (!(Number(form.amount) > 0)) return setFormError("Amount must be greater than zero");

    setSaving(true);
    setFormError("");
    try {
      const payload = { source, amount: Number(form.amount), month: form.month };
      if (editing) await incomeService.update(editing.id, payload);
      else await incomeService.create(payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(income) {
    if (!window.confirm(`Delete income "${income.source}"?`)) return;
    try {
      await incomeService.remove(income.id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Income
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Recorded revenue and income sources for {formatMonth(month)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="field w-auto font-medium"
          />
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span>Add Income</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Summary Highlight */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Monthly Income
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
            <CountUp value={data.total} currency={currency} isCurrency={true} />
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <ArrowDownLeft className="h-6 w-6" strokeWidth={2} />
        </div>
      </div>

      {/* Incomes Table / List */}
      <div>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : data.incomes.length === 0 ? (
          <EmptyState
            icon={ArrowDownLeft}
            title="No income recorded"
            description={`No income entries found for ${formatMonth(month)}. Add your salary, freelance earnings, or other income.`}
            actionLabel="+ Add Income"
            onAction={openCreate}
          />
        ) : (
          <div className="card overflow-x-auto p-0 shadow-card">
            <table className="w-full text-left">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                <tr>
                  <th className="table-cell">Source</th>
                  <th className="table-cell">Period</th>
                  <th className="table-cell text-right">Amount</th>
                  <th className="table-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {data.incomes.map((income) => {
                  const Icon = getSourceIcon(income.source);
                  return (
                    <tr
                      key={income.id}
                      className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="table-cell font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                          </div>
                          <span>{income.source}</span>
                        </div>
                      </td>
                      <td className="table-cell text-xs text-slate-400">
                        {formatMonth(income.month)}
                      </td>
                      <td className="table-cell text-right text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(income.amount, currency)}
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(income)}
                            title="Edit income"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <Edit2 className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => remove(income)}
                            title="Delete income"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 active:scale-95 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/50"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Income Modal */}
      <Modal
        open={modalOpen}
        title={editing ? "Edit Income" : "Add Income"}
        subtitle="Record your monthly earnings"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing ? "Update Income" : "Save Income"}
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
            label="Income Source"
            name="source"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          >
            {[...SOURCES, "Custom"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Input>
          {form.source === "Custom" && (
            <Input
              label="Custom Source Name"
              name="customSource"
              value={form.customSource}
              onChange={(e) => setForm({ ...form, customSource: e.target.value })}
              placeholder="e.g. Consulting, Royalties, Rental Income"
            />
          )}
          <Input
            label="Amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="Period Month"
            name="month"
            type="month"
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}

