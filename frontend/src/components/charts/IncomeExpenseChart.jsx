import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatMonth } from "../../utils/formatCurrency";

function CustomTooltip({ active, payload, label, currency }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">{label}</p>
        <div className="space-y-1.5 text-xs">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
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

export default function IncomeExpenseChart({
  data = [],
  currency = "INR",
  title = "Income vs Expenses",
}) {
  return (
    <div className="card flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>

      <div className="mt-4">
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            No transaction trend data available yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={290}>
            <BarChart
              data={data.map((d) => ({ ...d, label: formatMonth(d.month) }))}
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
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="#0f766e"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

