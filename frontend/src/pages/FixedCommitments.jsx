import { useCallback, useEffect, useState } from "react";
import {
  Lock,
  Plus,
  Calendar,
  Home,
  Shield,
  CreditCard,
  Zap,
  Wifi,
  Landmark,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  ArrowUpRight,
  SlidersHorizontal,
  Lightbulb,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import expenseService, { categoryService } from "../services/expenseService";
import budgetService from "../services/budgetService";
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
import { MetricSkeleton, TransactionRowSkeleton } from "../components/common/Skeleton";

function getCommitmentIcon(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("rent") || lower.includes("house") || lower.includes("flat")) return Home;
  if (lower.includes("insurance") || lower.includes("policy") || lower.includes("lic")) return Shield;
  if (lower.includes("emi") || lower.includes("loan") || lower.includes("mortgage")) return Landmark;
  if (lower.includes("electric") || lower.includes("power") || lower.includes("utility")) return Zap;
  if (lower.includes("internet") || lower.includes("wifi") || lower.includes("broadband")) return Wifi;
  if (lower.includes("card") || lower.includes("bill")) return CreditCard;
  return Receipt;
}

function getAlgorithmicRatioInfo(categoryName) {
  const lower = String(categoryName || "").toLowerCase();
  if (lower.includes("emi") || lower.includes("loan")) {
    return { ratio: 0.20, label: "20% of Income (Safe EMI Ceiling)" };
  }
  if (lower.includes("insurance") || lower.includes("policy")) {
    return { ratio: 0.05, label: "5% of Income (Health/Life Protection)" };
  }
  if (lower.includes("rent") || lower.includes("house")) {
    return { ratio: 0.30, label: "30% of Income (Housing Standard)" };
  }
  if (lower.includes("internet") || lower.includes("wifi")) {
    return { ratio: 0.02, label: "2% of Income (Connectivity)" };
  }
  return null;
}

export default function FixedCommitments() {
  const { currency } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingAlgo, setApplyingAlgo] = useState(false);

  // Data states
  const [fixedCategories, setFixedCategories] = useState([]);
  const [budgetPlan, setBudgetPlan] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Modals
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", date: toDateInput(new Date()), description: "" });
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState("");

  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitTarget, setLimitTarget] = useState(null);
  const [limitForm, setLimitForm] = useState({ monthly_limit: "", priority: "High" });
  const [limitSaving, setLimitSaving] = useState(false);
  const [limitError, setLimitError] = useState("");

  const [newCatModalOpen, setNewCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSaving, setNewCatSaving] = useState(false);
  const [newCatError, setNewCatError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catRes, planRes, expRes] = await Promise.all([
        categoryService.list(),
        budgetService.list(month),
        expenseService.list({ month }),
      ]);

      const fixedCats = catRes.categories.filter((c) => c.type === "fixed");
      setFixedCategories(fixedCats);
      setBudgetPlan(planRes);

      // Filter only fixed transactions
      const fixedCatIds = new Set(fixedCats.map((c) => c.id));
      const fixedTxs = expRes.expenses.filter((e) => fixedCatIds.has(e.category_id));
      setTransactions(fixedTxs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute fixed allocations
  const allocationsMap = new Map(
    (budgetPlan?.allocations || []).map((a) => [a.category_id, a])
  );

  const totalIncome = Number(budgetPlan?.total_income || 0);

  const commitmentCards = fixedCategories.map((cat) => {
    const allocation = allocationsMap.get(cat.id);
    const limit = Number(allocation?.monthly_limit || 0);
    const spent = Number(allocation?.spent || 0);
    const remaining = Math.max(0, limit - spent);
    const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
    const isPaidInFull = limit > 0 && spent >= limit;
    const isPartiallyPaid = spent > 0 && spent < limit;
    const isPending = spent === 0;
    const isOverpaid = limit > 0 && spent > limit;

    const algoInfo = getAlgorithmicRatioInfo(cat.name);
    const algoBenchmarkAmount =
      algoInfo && totalIncome > 0 ? Math.round(totalIncome * algoInfo.ratio) : null;

    return {
      category: cat,
      allocation,
      limit,
      spent,
      remaining,
      percent,
      isPaidInFull,
      isPartiallyPaid,
      isPending,
      isOverpaid,
      algoInfo,
      algoBenchmarkAmount,
    };
  });

  // Overview metrics
  const totalCommitted = commitmentCards.reduce((acc, c) => acc + c.limit, 0);
  const totalPaid = commitmentCards.reduce((acc, c) => acc + c.spent, 0);
  const totalPending = Math.max(0, totalCommitted - totalPaid);

  function openPayModal(card) {
    setPayTarget(card);
    setPayForm({
      amount: card.remaining > 0 ? String(card.remaining) : card.limit > 0 ? String(card.limit) : "",
      date: toDateInput(new Date()),
      description: `${card.category.name} payment for ${formatMonth(month)}`,
    });
    setPayError("");
    setPayModalOpen(true);
  }

  async function handleSavePayment() {
    if (!(Number(payForm.amount) > 0)) {
      return setPayError("Please enter a valid payment amount greater than zero.");
    }
    setPaySaving(true);
    setPayError("");
    try {
      await expenseService.create({
        category_id: payTarget.category.id,
        amount: Number(payForm.amount),
        date: payForm.date,
        description: payForm.description,
      });
      setPayModalOpen(false);
      await loadData();
    } catch (err) {
      setPayError(getErrorMessage(err));
    } finally {
      setPaySaving(false);
    }
  }

  function openLimitModal(card) {
    setLimitTarget(card);
    setLimitForm({
      monthly_limit: String(card.limit || card.algoBenchmarkAmount || ""),
      priority: card.allocation?.priority || "High",
    });
    setLimitError("");
    setLimitModalOpen(true);
  }

  async function handleSaveLimit() {
    if (Number(limitForm.monthly_limit) < 0) {
      return setLimitError("Limit cannot be negative.");
    }
    setLimitSaving(true);
    setLimitError("");
    try {
      await budgetService.save({
        category_id: limitTarget.category.id,
        monthly_limit: Number(limitForm.monthly_limit) || 0,
        priority: limitForm.priority,
      });
      setLimitModalOpen(false);
      await loadData();
    } catch (err) {
      setLimitError(getErrorMessage(err));
    } finally {
      setLimitSaving(false);
    }
  }

  async function handleApplyAlgorithmicLimits() {
    setApplyingAlgo(true);
    setError("");
    try {
      await budgetService.applyRecommendation(month);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setApplyingAlgo(false);
    }
  }

  async function handleCreateCommitment() {
    if (!newCatName.trim()) {
      return setNewCatError("Please provide a commitment name (e.g. Car Loan).");
    }
    setNewCatSaving(true);
    setNewCatError("");
    try {
      await categoryService.create({
        name: newCatName.trim(),
        type: "fixed",
      });
      setNewCatName("");
      setNewCatModalOpen(false);
      await loadData();
    } catch (err) {
      setNewCatError(getErrorMessage(err));
    } finally {
      setNewCatSaving(false);
    }
  }

  async function handleDeleteTransaction(tx) {
    if (!window.confirm("Delete this payment transaction?")) return;
    try {
      await expenseService.remove(tx.id);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Fixed Commitments
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Lock className="h-3 w-3" />
              Non-Discretionary
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Mandatory monthly obligations (Rent, EMI: 20% Income, Insurance: 5% Income, Utilities) for {formatMonth(month)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="field w-auto font-medium"
          />
          <Button
            variant="secondary"
            onClick={handleApplyAlgorithmicLimits}
            loading={applyingAlgo}
            title="Auto-calculate EMI (20%), Insurance (5%), and Rent (30%) from your income"
          >
            <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>Apply Algorithmic Limits</span>
          </Button>
          <Button variant="secondary" onClick={() => setNewCatModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>New Commitment</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Top 3 Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Committed
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  <CountUp value={totalCommitted} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {commitmentCards.length} recurring commitment{commitmentCards.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Lock className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Paid This Month
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  <CountUp value={totalPaid} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {transactions.length} payment{transactions.length === 1 ? "" : "s"} logged
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            <div className="card-interactive flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pending / Due
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  <CountUp value={totalPending} currency={currency} isCurrency={true} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {totalPending === 0 ? "All commitments paid!" : "Remaining obligations"}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Clock className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Commitment Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Commitment Breakdown & Algorithmic Limits
          </h2>
          <p className="text-xs text-slate-400">
            EMI (20%) · Insurance (5%) · Rent (30%)
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        ) : commitmentCards.length === 0 ? (
          <EmptyState
            title="No fixed commitments found"
            subtitle="Add recurring commitments like Rent, EMI, or Insurance to organize your monthly obligations."
            actionLabel="Add Commitment"
            onAction={() => setNewCatModalOpen(true)}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {commitmentCards.map((card) => {
              const Icon = getCommitmentIcon(card.category.name);

              return (
                <div
                  key={card.category.id}
                  className="card-interactive flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Icon, Name & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {card.category.name}
                          </h3>
                          <span
                            className={`badge mt-0.5 text-[10px] uppercase ${
                              card.isPaidInFull
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                                : card.isPartiallyPaid
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300"
                                : card.isOverpaid
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {card.isPaidInFull
                              ? "Paid in Full"
                              : card.isPartiallyPaid
                              ? "Partially Paid"
                              : card.isOverpaid
                              ? "Overpaid"
                              : "Pending Payment"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => openLimitModal(card)}
                        title="Edit monthly commitment limit"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Algorithmic Benchmark Pill */}
                    {card.algoInfo && (
                      <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-50/70 px-2.5 py-1 text-[11px] text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                        <Lightbulb className="h-3 w-3 shrink-0" />
                        <span className="font-semibold">{card.algoInfo.label}:</span>
                        <span>{formatCurrency(card.algoBenchmarkAmount || 0, currency)}</span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500 dark:text-slate-400">Payment Progress</span>
                        <span className="tabular-nums text-slate-800 dark:text-slate-200">
                          {card.limit > 0 ? `${card.percent}%` : "No limit set"}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            card.isPaidInFull
                              ? "bg-emerald-500"
                              : card.isPartiallyPaid
                              ? "bg-amber-500"
                              : "bg-slate-300 dark:bg-slate-600"
                          }`}
                          style={{ width: `${card.percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Numerical Stats */}
                    <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/70 p-3 text-xs dark:bg-slate-800/40">
                      <div>
                        <dt className="text-slate-400">Commitment Limit</dt>
                        <dd className="mt-0.5 font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                          {card.limit > 0 ? formatCurrency(card.limit, currency) : "Not set"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Paid This Month</dt>
                        <dd className="mt-0.5 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(card.spent, currency)}
                        </dd>
                      </div>
                      <div className="col-span-2 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
                        <dt className="text-slate-400">Remaining Due</dt>
                        <dd className="mt-0.5 font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(card.remaining, currency)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-2">
                    <Button
                      variant={card.isPaidInFull ? "secondary" : "primary"}
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => openPayModal(card)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{card.isPaidInFull ? "Add Extra Payment" : "Record Payment"}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment History Table / List */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Fixed Commitment Payment History
            </h2>
            <p className="text-xs text-slate-400">
              Transactions recorded for fixed commitments in {formatMonth(month)}
            </p>
          </div>
          <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {transactions.length} record{transactions.length === 1 ? "" : "s"}
          </span>
        </div>

        {transactions.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            No fixed commitment payments recorded for {formatMonth(month)} yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((tx) => {
              const Icon = getCommitmentIcon(tx.category_name);

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {tx.description || tx.category_name}
                        </p>
                        <span className="badge text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {tx.category_name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">
                      −{formatCurrency(tx.amount, currency)}
                    </p>
                    <button
                      onClick={() => handleDeleteTransaction(tx)}
                      title="Delete payment"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-100 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 active:scale-95 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        open={payModalOpen}
        title={`Record Payment — ${payTarget?.category?.name || ""}`}
        subtitle={`Log payment for this commitment in ${formatMonth(month)}`}
        onClose={() => setPayModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePayment} loading={paySaving}>
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
            placeholder="0.00"
          />
          <Input
            label="Payment Date"
            type="date"
            value={payForm.date}
            onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
          />
          <Input
            label="Description / Reference"
            placeholder="e.g. Paid via NetBanking / Cheque No."
            value={payForm.description}
            onChange={(e) => setPayForm({ ...payForm, description: e.target.value })}
          />
        </div>
      </Modal>

      {/* Edit Commitment Limit Modal */}
      <Modal
        open={limitModalOpen}
        title={`Set Commitment Budget — ${limitTarget?.category?.name || ""}`}
        subtitle="Set the required monthly amount for this commitment"
        onClose={() => setLimitModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLimitModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLimit} loading={limitSaving}>
              Save Commitment Limit
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {limitError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {limitError}
            </p>
          )}

          {limitTarget?.algoBenchmarkAmount && (
            <div className="flex items-center justify-between rounded-xl bg-brand-50/80 p-3 text-xs text-brand-800 dark:bg-brand-950/50 dark:text-brand-200">
              <div>
                <span className="font-bold">Algorithmic Guideline:</span>{" "}
                {limitTarget.algoInfo.label} = {formatCurrency(limitTarget.algoBenchmarkAmount, currency)}
              </div>
              <button
                type="button"
                onClick={() =>
                  setLimitForm({
                    ...limitForm,
                    monthly_limit: String(limitTarget.algoBenchmarkAmount),
                  })
                }
                className="font-bold text-brand-600 hover:underline dark:text-brand-400"
              >
                Apply
              </button>
            </div>
          )}

          <Input
            label="Monthly Commitment Amount"
            type="number"
            min="0"
            step="0.01"
            value={limitForm.monthly_limit}
            onChange={(e) => setLimitForm({ ...limitForm, monthly_limit: e.target.value })}
            placeholder="0.00"
          />
        </div>
      </Modal>

      {/* Create New Fixed Category Modal */}
      <Modal
        open={newCatModalOpen}
        title="Add Fixed Commitment"
        subtitle="Create a new recurring obligation (e.g. Car Loan, Maintenance, Gym Subscription)"
        onClose={() => setNewCatModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setNewCatModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCommitment} loading={newCatSaving}>
              Create Commitment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {newCatError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {newCatError}
            </p>
          )}
          <Input
            label="Commitment Name"
            placeholder="e.g. Car Loan, SIP, Gym"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
