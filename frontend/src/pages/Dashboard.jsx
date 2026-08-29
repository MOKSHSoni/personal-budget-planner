import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Target,
  AlertTriangle,
  Info,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Plus,
  Lock,
  Layers,
  Sparkles,
  Zap,
  Bell,
  Clock,
  ShieldCheck,
  Activity,
  Receipt,
  CreditCard,
  Lightbulb,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { reportService } from "../services/goalService";
import expenseService from "../services/expenseService";
import investmentService from "../services/investmentService";
import { getErrorMessage } from "../services/api";
import { currentMonth, formatCurrency, formatDate, formatMonth } from "../utils/formatCurrency";
import Button from "../components/common/Button";
import { HeroSkeleton, MetricSkeleton, ChartSkeleton } from "../components/common/Skeleton";
import HeroRemainingCard from "../components/cards/HeroRemainingCard";
import SummaryCard from "../components/cards/SummaryCard";
import IncomeExpenseChart from "../components/charts/IncomeExpenseChart";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import GoalProgressChart from "../components/charts/GoalProgressChart";

const NOTIF_ICONS = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const NOTIF_STYLES = {
  danger: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
  info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200",
};

export default function Dashboard() {
  const { currency } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentInvestments, setRecentInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarTab, setSidebarTab] = useState("all"); // 'all' | 'alerts' | 'activity'

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryData, trendData, expData, invData] = await Promise.all([
        reportService.summary(month),
        reportService.monthly(6),
        expenseService.list({ month }),
        investmentService.list({ month }),
      ]);
      setSummary(summaryData);
      setTrend(trendData.trend);
      setRecentExpenses(expData.expenses ? expData.expenses.slice(0, 5) : []);
      setRecentInvestments(invData.investments ? invData.investments.slice(0, 4) : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  // Merge recent activities
  const recentActivities = [
    ...recentExpenses.map((e) => ({
      id: `exp-${e.id}`,
      type: "expense",
      title: e.description || e.category_name,
      subtitle: e.category_name,
      amount: e.amount,
      date: e.date,
      categoryType: e.category_type,
    })),
    ...recentInvestments.map((inv) => ({
      id: `inv-${inv.id}`,
      type: "investment",
      title: inv.name,
      subtitle: inv.type,
      amount: inv.amount,
      date: inv.date,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const alerts = summary?.notifications || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Financial Command Center
            </h1>
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              Live Pulse
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Real-time cashflow intelligence and tracking for {formatMonth(month)}
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
            size="sm"
            onClick={load}
            disabled={loading}
            title="Refresh data"
            className="h-10 w-10 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-brand-600" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Quick Action Shortcuts Bar */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <Link
          to="/income"
          className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-subtle transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-card dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <ArrowDownLeft className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">+ Add Income</p>
            <p className="truncate text-[10px] text-slate-400">Salary, freelance</p>
          </div>
        </Link>

        <Link
          to="/expenses"
          className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-subtle transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50/50 hover:shadow-card dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-rose-800 dark:hover:bg-rose-950/20"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ArrowUpRight className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">+ Log Expense</p>
            <p className="truncate text-[10px] text-slate-400">Variable spending</p>
          </div>
        </Link>

        <Link
          to="/fixed-commitments"
          className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-subtle transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-card dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-700 dark:hover:bg-slate-800/40"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Lock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Pay Commitment</p>
            <p className="truncate text-[10px] text-slate-400">Rent, EMI, Insurance</p>
          </div>
        </Link>

        <Link
          to="/investments"
          className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-subtle transition hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-card dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-purple-800 dark:hover:bg-purple-950/20"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">+ Investment</p>
            <p className="truncate text-[10px] text-slate-400">SIP, stocks, gold</p>
          </div>
        </Link>

        <Link
          to="/goals"
          className="col-span-2 sm:col-span-1 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-subtle transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-card dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-brand-800 dark:hover:bg-brand-950/20"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
            <Target className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">+ Set Goal</p>
            <p className="truncate text-[10px] text-slate-400">Savings milestone</p>
          </div>
        </Link>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="danger" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {loading && !summary ? (
        <div className="space-y-6">
          <HeroSkeleton />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      ) : summary ? (
        /* Main 2-Column Dashboard Layout: Left 8 cols for charts/metrics, Right 4 cols for Updates Sidebar */
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Main Financial Area (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            {/* 1. Centerpiece Hero "Remaining" Card */}
            <div className="animate-fade-in-up">
              <HeroRemainingCard
                income={summary.totals.income}
                expenses={summary.totals.expenses}
                remaining={summary.totals.remaining}
                savings={summary.totals.savings}
                currency={currency}
              />
            </div>

            {/* 2. Supporting Key Metrics */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 animate-fade-in-up stagger-1">
              <SummaryCard
                title="Total Income"
                numericValue={summary.totals.income}
                currency={currency}
                isCurrency={true}
                subtitle="Received this month"
                icon={ArrowDownLeft}
                tone="brand"
              />
              <SummaryCard
                title="Total Expenses"
                numericValue={summary.totals.expenses}
                currency={currency}
                isCurrency={true}
                subtitle="Fixed + Variable spent"
                icon={ArrowUpRight}
                tone="negative"
              />
              <SummaryCard
                title="Investments"
                numericValue={summary.totals.investments || 0}
                currency={currency}
                isCurrency={true}
                subtitle="Wealth allocation"
                icon={Layers}
                tone="purple"
              />
              <SummaryCard
                title="Goal Progress"
                value={`${summary.goals.overall_progress_percent}%`}
                subtitle={`${formatCurrency(summary.goals.total_saved, currency)} of ${formatCurrency(summary.goals.total_target, currency)}`}
                icon={Target}
                tone="brand"
              />
            </div>

            {/* 3. Charts Grid */}
            <div className="grid gap-6 sm:grid-cols-2 animate-fade-in-up stagger-2">
              <IncomeExpenseChart
                data={trend}
                currency={currency}
                title="Cashflow Trajectory (6M)"
              />
              <CategoryPieChart
                data={summary.category_breakdown}
                currency={currency}
                title="Spending by Category"
              />
            </div>

            {/* 4. Goal Progress Breakdown */}
            <div className="animate-fade-in-up stagger-3">
              <GoalProgressChart goals={summary.goals.items} currency={currency} />
            </div>
          </div>

          {/* Dedicated Updates & Activity Sidebar (4 cols) */}
          <div className="space-y-4 lg:col-span-4 lg:sticky lg:top-20">
            <div className="card space-y-4">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Updates & Feed
                  </h2>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              {/* Sub-Tabs for Sidebar */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-semibold gap-3">
                <button
                  onClick={() => setSidebarTab("all")}
                  className={`pb-2 border-b-2 transition ${
                    sidebarTab === "all"
                      ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                      : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  All ({alerts.length + recentActivities.length})
                </button>
                <button
                  onClick={() => setSidebarTab("alerts")}
                  className={`pb-2 border-b-2 transition flex items-center gap-1 ${
                    sidebarTab === "alerts"
                      ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                      : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Alerts
                  {alerts.length > 0 && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {alerts.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setSidebarTab("activity")}
                  className={`pb-2 border-b-2 transition ${
                    sidebarTab === "activity"
                      ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                      : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Activity ({recentActivities.length})
                </button>
              </div>

              {/* Alerts Stream */}
              {(sidebarTab === "all" || sidebarTab === "alerts") && alerts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    System Alerts & Warnings
                  </p>
                  {alerts.map((n, i) => {
                    const Icon = NOTIF_ICONS[n.severity] || Info;
                    const style = NOTIF_STYLES[n.severity] || NOTIF_STYLES.info;
                    return (
                      <div
                        key={`side-alert-${i}`}
                        className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs font-medium ${style}`}
                      >
                        <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="leading-snug">{n.message}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Recent Activity Ledger */}
              {(sidebarTab === "all" || sidebarTab === "activity") && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Recent Activity Stream
                    </p>
                    <Link
                      to="/expenses"
                      className="text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      View all →
                    </Link>
                  </div>

                  {recentActivities.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">
                      No recent activity recorded for {formatMonth(month)}.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {recentActivities.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-center justify-between py-2.5 transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-1 rounded-lg"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ${
                                act.type === "investment"
                                  ? "bg-purple-600"
                                  : act.categoryType === "fixed"
                                  ? "bg-slate-700"
                                  : "bg-rose-500"
                              }`}
                            >
                              {act.type === "investment" ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                                {act.title}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {act.subtitle} · {formatDate(act.date)}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-xs font-bold tabular-nums shrink-0 pl-2 ${
                              act.type === "investment"
                                ? "text-purple-600 dark:text-purple-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {act.type === "investment" ? "" : "−"}
                            {formatCurrency(act.amount, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Smart Algorithmic Financial Health Pulse */}
              <div className="rounded-xl border border-brand-500/20 bg-brand-50/40 p-3.5 dark:bg-brand-950/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-800 dark:text-brand-300">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Algorithmic Health Pulse</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span><strong>20% EMI Ceiling:</strong> Safe debt limit configured</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    <span><strong>5% Insurance:</strong> Protection benchmark active</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <span><strong>Discretionary Pool:</strong> Proportional priority split</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
