import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, Sparkles, Layers } from "lucide-react";
import CountUp from "../common/CountUp";
import { formatCurrency } from "../../utils/formatCurrency";

export default function HeroRemainingCard({
  income = 0,
  expenses = 0,
  remaining = 0,
  savings = 0,
  currency = "INR",
}) {
  const isNegative = remaining < 0;
  const isTight = !isNegative && income > 0 && remaining < income * 0.15;
  const spentPercent = income > 0 ? Math.min(100, Math.round((expenses / income) * 100)) : 0;
  const savingsPercent = income > 0 ? Math.max(0, Math.round((savings / income) * 100)) : 0;

  // Status-based theme styling
  const statusTheme = isNegative
    ? {
        border: "border-rose-200/80 dark:border-rose-900/60",
        bg: "bg-gradient-to-br from-rose-50/80 via-white to-rose-50/40 dark:from-rose-950/40 dark:via-slate-900 dark:to-rose-950/20",
        badge: "bg-rose-100/90 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-800",
        badgeText: "Budget Exceeded",
        accentText: "text-rose-600 dark:text-rose-400",
        ringTrack: "#fecdd3",
        ringFill: "#f43f5e",
      }
    : isTight
      ? {
          border: "border-amber-200/80 dark:border-amber-900/60",
          bg: "bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20",
          badge: "bg-amber-100/90 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-800",
          badgeText: "Budget Tight (<15% left)",
          accentText: "text-amber-600 dark:text-amber-400",
          ringTrack: "#fde68a",
          ringFill: "#f59e0b",
        }
      : {
          border: "border-emerald-200/90 dark:border-emerald-900/50",
          bg: "bg-gradient-to-br from-emerald-50/80 via-white to-brand-50/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-brand-950/30",
          badge: "bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-800",
          badgeText: "Healthy Financial Surplus",
          accentText: "text-emerald-700 dark:text-emerald-400",
          ringTrack: "#ccfbf1",
          ringFill: "#0f766e",
        };

  // SVG Gauge calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, spentPercent)) / 100) * circumference;

  return (
    <div
      className={`card-hero ${statusTheme.bg} ${statusTheme.border} shadow-card-hover relative overflow-hidden backdrop-blur-sm`}
    >
      <div className="grid gap-6 md:grid-cols-12 md:items-center">
        {/* Left / Center Info */}
        <div className="space-y-4 md:col-span-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-subtle dark:bg-slate-800">
              <Wallet className="h-4 w-4 text-brand-600 dark:text-brand-400" strokeWidth={2.2} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Remaining Cashflow
            </span>
            <span className={`badge text-[11px] shadow-subtle ${statusTheme.badge}`}>
              <Sparkles className="h-3 w-3" />
              {statusTheme.badgeText}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h2
                className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight tabular-nums ${statusTheme.accentText}`}
              >
                <CountUp
                  value={remaining}
                  currency={currency}
                  isCurrency={true}
                  duration={750}
                />
              </h2>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Net surplus after all monthly obligations ({formatCurrency(income, currency)} earned − {formatCurrency(expenses, currency)} spent)
            </p>
          </div>

          {/* Quick Mini Metrics */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-white/90 px-3 py-1.5 shadow-subtle dark:border-slate-800 dark:bg-slate-800/90">
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
              <span className="text-slate-400">Income:</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {formatCurrency(income, currency)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-white/90 px-3 py-1.5 shadow-subtle dark:border-slate-800 dark:bg-slate-800/90">
              <ArrowUpRight className="h-3.5 w-3.5 text-rose-600" strokeWidth={2.5} />
              <span className="text-slate-400">Expenses:</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {formatCurrency(expenses, currency)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-white/90 px-3 py-1.5 shadow-subtle dark:border-slate-800 dark:bg-slate-800/90">
              <TrendingUp className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" strokeWidth={2.5} />
              <span className="text-slate-400">Savings Rate:</span>
              <span className="font-bold tabular-nums text-brand-600 dark:text-brand-400">
                {savingsPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Circular Gauge */}
        <div className="flex items-center justify-center md:col-span-4">
          <div className="relative flex items-center justify-center">
            <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-200/70 dark:text-slate-800"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke={statusTheme.ringFill}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                {spentPercent}%
              </span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Spent
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
