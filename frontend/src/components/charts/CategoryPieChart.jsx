import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "../../utils/formatCurrency";

const COLORS = [
  "#0f766e", // Deep Teal
  "#14b8a6", // Light Teal
  "#0284c7", // Sky
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#64748b", // Slate
];

function CustomTooltip({ active, payload, currency, total }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: data.payload.fill || data.color }}
          />
          <p className="text-xs font-bold text-slate-800 dark:text-white">{data.name}</p>
        </div>
        <p className="mt-1 text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
          {formatCurrency(data.value, currency)}
          <span className="ml-1.5 text-xs font-normal text-slate-400">({percent}%)</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function CategoryPieChart({
  data = [],
  currency = "INR",
  title = "Spending by category",
}) {
  const chartData = data.map((d) => ({ name: d.category_name, value: Number(d.total) || 0 }));
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="card flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
        {total > 0 && (
          <span className="text-xs font-semibold tabular-nums text-slate-400">
            Total: {formatCurrency(total, currency)}
          </span>
        )}
      </div>

      <div className="mt-4">
        {chartData.length === 0 || total === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            No expenses recorded for this period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                label={false}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={COLORS[index % COLORS.length]}
                    className="transition-transform duration-200 hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currency={currency} total={total} />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

