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
import { formatCurrency } from "../../utils/formatCurrency";

function CustomTooltip({ active, payload, label, currency }) {
  if (active && payload && payload.length) {
    const saved = payload.find((p) => p.dataKey === "saved")?.value || 0;
    const remaining = payload.find((p) => p.dataKey === "remaining")?.value || 0;
    const target = saved + remaining;
    const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

    return (
      <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <p className="text-xs font-bold text-slate-800 dark:text-white">{label}</p>
        <div className="mt-2 space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Saved:</span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(saved, currency)} ({percent}%)
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Remaining:</span>
            <span className="font-semibold tabular-nums text-slate-600 dark:text-slate-300">
              {formatCurrency(remaining, currency)}
            </span>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-100 pt-1 dark:border-slate-800">
            <span className="text-slate-400">Target:</span>
            <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
              {formatCurrency(target, currency)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function GoalProgressChart({ goals = [], currency = "INR" }) {
  const data = goals.map((g) => ({
    name: g.goal_name,
    saved: Number(g.saved_amount) || 0,
    remaining: Math.max(0, Number(g.remaining_amount ?? g.target_amount - g.saved_amount) || 0),
  }));

  return (
    <div className="card flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          Savings Goals Progress
        </h3>
      </div>

      <div className="mt-4">
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No goals created yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(220, data.length * 52)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 10, right: 20, top: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} horizontal={false} />
              <XAxis
                type="number"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#94a3b8", strokeOpacity: 0.2 }}
                tick={{ fill: "#64748b" }}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b" }}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />
              <Bar dataKey="saved" name="Saved" stackId="g" fill="#0f766e" radius={[4, 0, 0, 4]} />
              <Bar dataKey="remaining" name="Remaining" stackId="g" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

