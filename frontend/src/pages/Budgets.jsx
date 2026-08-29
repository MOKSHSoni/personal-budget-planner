import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  PieChart,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Wallet,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Layers,
  PiggyBank,
  CheckCircle2,
  SlidersHorizontal,
  Lightbulb,
  Receipt,
  Coins,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import budgetService from "../services/budgetService";
import { getErrorMessage } from "../services/api";
import { currentMonth, formatCurrency, formatMonth } from "../utils/formatCurrency";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import CountUp from "../components/common/CountUp";
import { MetricSkeleton, ChartSkeleton } from "../components/common/Skeleton";
import BudgetCard from "../components/cards/BudgetCard";

const PRIORITIES = ["Low", "Medium", "High", "Very High"];

export default function Budgets() {
  const { currency } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'fixed' | 'variable' | 'investments'

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ monthly_limit: "", priority: "Low" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await budgetService.list(month);
      setPlan(data);
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

  const summary = plan?.summary || {
    total_income: plan?.total_income || 0,
    total_fixed_spent: 0,
    total_fixed_limit: plan?.fixed_required_total || 0,
    total_variable_spent: 0,
    total_variable_limit: 0,
    total_expenses: 0,
    total_invested: 0,
    total_saved: 0,
    net_surplus: 0,
    savings_rate_percent: 0,
  };

  const fixedAllocations = plan?.fixed_allocations || (plan?.allocations || []).filter((a) => a.type === "fixed");
  const variableAllocations = plan?.variable_allocations || (plan?.allocations || []).filter((a) => a.type === "variable");
  const investments = plan?.investments || [];

  // Percentages of total income
  const income = summary.total_income > 0 ? summary.total_income : 1;
  const fixedPercent = Math.min(100, Math.round((summary.total_fixed_spent / income) * 100));
  const varPercent = Math.min(100, Math.round((summary.total_variable_spent / income) * 100));
  const invPercent = Math.min(100, Math.round((summary.total_invested / income) * 100));
  const savedPercent = Math.max(0, 100 - (fixedPercent + varPercent + invPercent));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Budget Planner & Cashflow Breakdown
            </h1>
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              Full Financial Blueprint
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Complete overview of Income, Fixed Commitments, Expenses, Investments, and Monthly Savings for {formatMonth(month)}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        </div>
      ) : plan ? (
        <>
          {/* Top 5 Complete Financial Summary Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* 1. Total Income */}
            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Income
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  <CountUp value={summary.total_income} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Monthly earnings</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <ArrowDownLeft className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            {/* 2. Fixed Commitments */}
            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fixed Commitments
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  <CountUp value={summary.total_fixed_spent} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Budget: {formatCurrency(summary.total_fixed_limit, currency)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Lock className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            {/* 3. Variable Expenses */}
            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Variable Expenses
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                  <CountUp value={summary.total_variable_spent} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Budget: {formatCurrency(summary.total_variable_limit, currency)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            {/* 4. Investments */}
            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Investments Made
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-purple-600 dark:text-purple-400">
                  <CountUp value={summary.total_invested} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {investments.length} allocation{investments.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <TrendingUp className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            {/* 5. Saved / Net Surplus */}
            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Monthly Saved
                </p>
                <p
                  className={`mt-1 text-2xl font-bold tabular-nums ${
                    summary.total_saved >= 0
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  <CountUp value={summary.total_saved} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                  {summary.savings_rate_percent}% savings rate
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                <Wallet className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* 100% Monthly Income Allocation Bar */}
          {summary.total_income > 0 && (
            <div className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Income Outflow Distribution
                </h3>
                <span className="text-xs font-medium text-slate-400">
                  Total Earnings: {formatCurrency(summary.total_income, currency)}
                </span>
              </div>

              {/* Progress bar with 4 segments */}
              <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 flex dark:bg-slate-800">
                {fixedPercent > 0 && (
                  <div
                    className="bg-slate-700 dark:bg-slate-400 transition-all duration-500"
                    style={{ width: `${fixedPercent}%` }}
                    title={`Fixed Commitments: ${fixedPercent}%`}
                  />
                )}
                {varPercent > 0 && (
                  <div
                    className="bg-rose-500 transition-all duration-500"
                    style={{ width: `${varPercent}%` }}
                    title={`Variable Expenses: ${varPercent}%`}
                  />
                )}
                {invPercent > 0 && (
                  <div
                    className="bg-purple-500 transition-all duration-500"
                    style={{ width: `${invPercent}%` }}
                    title={`Investments: ${invPercent}%`}
                  />
                )}
                {savedPercent > 0 && (
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${savedPercent}%` }}
                    title={`Net Saved: ${savedPercent}%`}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700 dark:bg-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Fixed ({fixedPercent}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-600 dark:text-slate-400">Variable ({varPercent}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="text-slate-600 dark:text-slate-400">Invested ({invPercent}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-400">Saved ({savedPercent}%)</span>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tabs: All / Fixed Commitments / Variable Spending / Investments */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-3 border-b-2 transition ${
                activeTab === "all"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              All Allocations ({plan.allocations.length})
            </button>
            <button
              onClick={() => setActiveTab("fixed")}
              className={`pb-3 border-b-2 transition ${
                activeTab === "fixed"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Fixed Commitments ({fixedAllocations.length})
            </button>
            <button
              onClick={() => setActiveTab("variable")}
              className={`pb-3 border-b-2 transition ${
                activeTab === "variable"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Variable Expenses ({variableAllocations.length})
            </button>
            <button
              onClick={() => setActiveTab("investments")}
              className={`pb-3 border-b-2 transition ${
                activeTab === "investments"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Investments ({investments.length})
            </button>
          </div>

          {/* Content matching selected tab */}
          {activeTab === "investments" ? (
            <div className="card space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Investments Recorded for {formatMonth(month)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Total Invested: {formatCurrency(summary.total_invested, currency)}
                  </p>
                </div>
                <span className="badge bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  {investments.length} asset{investments.length === 1 ? "" : "s"}
                </span>
              </div>

              {investments.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No investments recorded for {formatMonth(month)}. Use the Investments page to add allocations.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {investments.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {inv.name}
                          </p>
                          <span className="badge text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {inv.type}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-bold tabular-nums text-purple-600 dark:text-purple-400">
                        {formatCurrency(inv.amount, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(activeTab === "fixed"
                ? fixedAllocations
                : activeTab === "variable"
                ? variableAllocations
                : plan.allocations
              ).map((allocation) => (
                <BudgetCard
                  key={allocation.category_id}
                  allocation={allocation}
                  currency={currency}
                  onEdit={openEdit}
                />
              ))}
            </div>
          )}
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
