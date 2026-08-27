import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { reportService } from "../services/goalService";
import { getErrorMessage } from "../services/api";
import { currentMonth, formatCurrency, formatMonth } from "../utils/formatCurrency";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryData, trendData] = await Promise.all([
        reportService.summary(month),
        reportService.monthly(6),
      ]);
      setSummary(summaryData);
      setTrend(trendData.trend);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Financial summary and insights for {formatMonth(month)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="field w-auto font-medium"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={load}
            disabled={loading}
            title="Refresh data"
            className="h-10 w-10 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Error Banner */}
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

      {/* Loading Skeleton State */}
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
        <>
          {/* Notifications Banner */}
          {summary.notifications.length > 0 && (
            <div className="space-y-2">
              {summary.notifications.map((n, i) => {
                const Icon = NOTIF_ICONS[n.severity] || Info;
                const style = NOTIF_STYLES[n.severity] || NOTIF_STYLES.info;
                return (
                  <div
                    key={`${n.type}-${i}`}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-xs font-medium ${style}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{n.message}</span>
                  </div>
                );
              })}
            </div>
          )}

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up stagger-1">
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
              title="Total Spent"
              numericValue={summary.totals.expenses}
              currency={currency}
              isCurrency={true}
              subtitle="Actual spending"
              icon={ArrowUpRight}
              tone="negative"
            />
            <SummaryCard
              title="Net Saved"
              numericValue={summary.totals.savings}
              currency={currency}
              isCurrency={true}
              subtitle="Total savings accumulated"
              icon={TrendingUp}
              tone={summary.totals.savings < 0 ? "negative" : "positive"}
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
          <div className="grid gap-6 lg:grid-cols-2 animate-fade-in-up stagger-2">
            <IncomeExpenseChart
              data={trend}
              currency={currency}
              title="Income vs Expenses (Last 6 Months)"
            />
            <CategoryPieChart
              data={summary.category_breakdown}
              currency={currency}
              title="Spending Breakdown by Category"
            />
          </div>

          {/* 4. Goal Progress Breakdown */}
          <div className="animate-fade-in-up stagger-3">
            <GoalProgressChart goals={summary.goals.items} currency={currency} />
          </div>
        </>
      ) : null}
    </div>
  );
}

