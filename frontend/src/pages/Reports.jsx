import { useCallback, useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  AlertTriangle,
  FileText,
  Calendar,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { reportService } from "../services/goalService";
import { getErrorMessage } from "../services/api";
import { currentMonth, formatCurrency, formatMonth } from "../utils/formatCurrency";
import SummaryCard from "../components/cards/SummaryCard";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import IncomeExpenseChart from "../components/charts/IncomeExpenseChart";
import { MetricSkeleton, ChartSkeleton } from "../components/common/Skeleton";

function CustomTrendTooltip({ active, payload, label, currency }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <p className="mb-2 text-xs font-bold text-slate-800 dark:text-white">{label}</p>
        <div className="space-y-1.5 text-xs">
          {payload.map((entry, index) => (
            <div key={`trend-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.stroke || entry.color }}
                />
                <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
              </div>
              <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
                {formatCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function Reports() {
  const { currency } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [range, setRange] = useState(6);
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
        reportService.monthly(range),
      ]);
      setSummary(summaryData);
      setTrend(trendData.trend);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month, range]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Comprehensive financial breakdown for {formatMonth(month)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="field w-auto font-medium"
          />
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="field w-auto font-medium"
          >
            {[3, 6, 12].map((r) => (
              <option key={r} value={r}>
                Last {r} months
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && !summary ? (
        <div className="space-y-6">
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
          {/* Notifications Alert Box */}
          {summary.notifications.length > 0 && (
            <div className="card border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <span>Monthly Alerts & Warnings</span>
              </div>
              <div className="mt-2 space-y-1">
                {summary.notifications.map((n, i) => (
                  <p key={`${n.type}-${i}`} className="text-xs text-amber-900 dark:text-amber-200">
                    • {n.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 4 Summary Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Income"
              numericValue={summary.totals.income}
              currency={currency}
              isCurrency={true}
              icon={ArrowDownLeft}
              tone="brand"
            />
            <SummaryCard
              title="Expenses"
              numericValue={summary.totals.expenses}
              currency={currency}
              isCurrency={true}
              icon={ArrowUpRight}
              tone="negative"
            />
            <SummaryCard
              title="Savings"
              numericValue={summary.totals.savings}
              currency={currency}
              isCurrency={true}
              icon={TrendingUp}
              tone={summary.totals.savings < 0 ? "negative" : "positive"}
            />
            <SummaryCard
              title="Remaining"
              numericValue={summary.totals.remaining}
              currency={currency}
              isCurrency={true}
              icon={Wallet}
              subtitle="Net monthly surplus"
              tone={summary.totals.remaining < 0 ? "negative" : "positive"}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryPieChart
              data={summary.category_breakdown}
              currency={currency}
              title="Category Spending Distribution"
            />
            <IncomeExpenseChart
              data={trend}
              currency={currency}
              title={`Income vs Expenses (Last ${range} Months)`}
            />
          </div>

          {/* Monthly Trend Multi-Line Chart */}
          <div className="card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Multi-Month Cashflow Trajectory
              </h3>
            </div>

            <div className="mt-4">
              {trend.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-400">
                  Not enough historical data available yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={trend.map((t) => ({ ...t, label: formatMonth(t.month) }))}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="label"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#94a3b8", strokeOpacity: 0.2 }}
                      tick={{ fill: "#64748b" }}
                    />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748b" }}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                    />
                    <Tooltip content={<CustomTrendTooltip currency={currency} />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#0f766e"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#0f766e" }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#f43f5e" }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      name="Savings"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#6366f1" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Historical Breakdown Table */}
          <div className="card overflow-x-auto p-0 shadow-card">
            <table className="w-full text-left">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                <tr>
                  <th className="table-cell">Month</th>
                  <th className="table-cell text-right">Income</th>
                  <th className="table-cell text-right">Expenses</th>
                  <th className="table-cell text-right">Savings</th>
                  <th className="table-cell text-right">Net Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {trend.map((row) => (
                  <tr
                    key={row.month}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="table-cell font-semibold text-slate-800 dark:text-slate-200">
                      {formatMonth(row.month)}
                    </td>
                    <td className="table-cell text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.income, currency)}
                    </td>
                    <td className="table-cell text-right tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(row.expenses, currency)}
                    </td>
                    <td className="table-cell text-right tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(row.savings, currency)}
                    </td>
                    <td
                      className={`table-cell text-right tabular-nums font-bold ${
                        row.remaining < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {formatCurrency(row.remaining, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

