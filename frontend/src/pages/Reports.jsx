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
  Cell,
  Pie,
  PieChart,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  PiggyBank,
  CircleDollarSign,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { reportService } from "../services/goalService";
import { getErrorMessage } from "../services/api";
import { currentMonth, formatCurrency, formatMonth } from "../utils/formatCurrency";
import SummaryCard from "../components/cards/SummaryCard";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import IncomeExpenseChart from "../components/charts/IncomeExpenseChart";
import { MetricSkeleton, ChartSkeleton } from "../components/common/Skeleton";

const ASSET_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#eab308",
  "#64748b",
];

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

  const investmentDistribution = (summary?.investments?.distribution || []).map((d, i) => ({
    name: d.type,
    value: d.total_invested,
    color: ASSET_COLORS[i % ASSET_COLORS.length],
  }));

  const cumulativeSavings = summary?.wallet?.cumulative_savings || summary?.totals?.cumulative_savings || 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Comprehensive financial breakdown including spending, investments & savings for {formatMonth(month)}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricSkeleton />
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

          {/* 4 Key Financial Summary Cards */}
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
              title="Investments"
              numericValue={summary.totals.investments || 0}
              currency={currency}
              isCurrency={true}
              icon={Layers}
              tone="brand"
            />
            <SummaryCard
              title="Monthly Savings"
              numericValue={summary.totals.savings}
              currency={currency}
              isCurrency={true}
              icon={TrendingUp}
              tone={summary.totals.savings < 0 ? "negative" : "positive"}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Category Expenses Breakdown */}
            <CategoryPieChart
              data={summary.category_breakdown}
              currency={currency}
              title="Category Spending Distribution"
            />

            {/* Investments Asset Allocation Pie Chart */}
            <div className="card flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Investments Asset Allocation
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Portfolio distribution across asset types
                </p>
              </div>

              {investmentDistribution.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No investments recorded for {formatMonth(month)}.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 items-center gap-4 pt-4">
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={investmentDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {investmentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val) => formatCurrency(val, currency)}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #cbd5e1",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {investmentDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-bold tabular-nums text-slate-900 dark:text-white shrink-0 pl-2">
                          {formatCurrency(item.value, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Multi-Month Cashflow Trajectory Chart */}
          <div className="card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Multi-Month Financial Trajectory (Income, Expenses, Investments & Savings)
                </h3>
                <p className="text-xs text-slate-400">
                  Cashflow progression over the last {range} months
                </p>
              </div>
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
                      dataKey="investments"
                      name="Investments"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#8b5cf6" }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      name="Monthly Savings"
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

          {/* Comprehensive Monthly Financial Statement Table */}
          <div className="card overflow-x-auto p-0 shadow-card">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Financial Statement Table
              </h3>
              <p className="text-xs text-slate-400">
                Detailed monthly performance tracking income, spending, investments, and savings
              </p>
            </div>
            <table className="w-full text-left">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
                <tr>
                  <th className="table-cell">Month</th>
                  <th className="table-cell text-right">Income</th>
                  <th className="table-cell text-right">Expenses</th>
                  <th className="table-cell text-right">Investments</th>
                  <th className="table-cell text-right">Saved This Month</th>
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
                    <td className="table-cell text-right tabular-nums font-semibold text-purple-600 dark:text-purple-400">
                      {formatCurrency(row.investments || 0, currency)}
                    </td>
                    <td className="table-cell text-right tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(row.savings, currency)}
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
