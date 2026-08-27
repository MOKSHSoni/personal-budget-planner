import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  PieChart,
  ArrowDownLeft,
  Lock,
  Wallet,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import budgetService from "../services/budgetService";
import { getErrorMessage } from "../services/api";
import { currentMonth, formatCurrency, formatMonth } from "../utils/formatCurrency";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import CountUp from "../components/common/CountUp";
import { MetricSkeleton } from "../components/common/Skeleton";
import BudgetCard from "../components/cards/BudgetCard";

const PRIORITIES = ["Low", "Medium", "High", "Very High"];

export default function Budgets() {
  const { currency } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ monthly_limit: "", priority: "Low" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPlan(await budgetService.list(month));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(allocation) {
    setEditing(allocation);
    setForm({ monthly_limit: String(allocation.monthly_limit), priority: allocation.priority });
    setFormError("");
    setModalOpen(true);
  }

  async function save() {
    if (Number(form.monthly_limit) < 0) return setFormError("Limit cannot be negative");
    setSaving(true);
    setFormError("");
    try {
      await budgetService.save({
        category_id: editing.category_id,
        monthly_limit: Number(form.monthly_limit) || 0,
        priority: form.priority,
      });
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function applyRecommendation() {
    setApplying(true);
    setError("");
    try {
      await budgetService.applyRecommendation(month);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budget Planner
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Set and manage limits across fixed and variable categories for {formatMonth(month)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="field w-auto font-medium"
          />
          <Button onClick={applyRecommendation} loading={applying}>
            <Sparkles className="h-4 w-4" />
            <span>Apply Recommendations</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && !plan ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        </div>
      ) : plan ? (
        <>
          {/* Top 3 Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Income
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  <CountUp value={plan.total_income} currency={currency} isCurrency={true} />
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <ArrowDownLeft className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fixed Commitments
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  <CountUp value={plan.fixed_required_total} currency={currency} isCurrency={true} />
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Lock className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Discretionary Remainder
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-brand-600 dark:text-brand-400">
                  <CountUp value={plan.discretionary_remainder} currency={currency} isCurrency={true} />
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                <Wallet className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Allocation Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plan.allocations.map((allocation) => (
              <BudgetCard
                key={allocation.category_id}
                allocation={allocation}
                currency={currency}
                onEdit={openEdit}
              />
            ))}
          </div>
        </>
      ) : null}

      {/* Edit Budget Modal */}
      <Modal
        open={modalOpen}
        title={`Edit Budget — ${editing?.category_name || ""}`}
        subtitle={`Set monthly spend limit and priority for this category`}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save Changes
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
            label="Monthly Limit"
            type="number"
            min="0"
            step="0.01"
            value={form.monthly_limit}
            onChange={(e) => setForm({ ...form, monthly_limit: e.target.value })}
            placeholder="0.00"
          />
          <Input
            as="select"
            label="Priority Level"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Input>
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Algorithm Recommended Limit:
            </span>{" "}
            {formatCurrency(editing?.recommended_limit || 0, currency)}
          </div>
        </div>
      </Modal>
    </div>
  );
}

