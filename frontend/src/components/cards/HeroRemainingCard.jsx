import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
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
  const remainingPercent = income > 0 ? Math.max(0, 100 - spentPercent) : 0;

  // Status-based ambient styling
  const statusTheme = isNegative
    ? {
        border: "border-rose-200 dark:border-rose-900/60",
        bg: "bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 dark:from-rose-950/30 dark:via-slate-900 dark:to-rose-950/20",
        badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300",
        badgeText: "Budget Exceeded",
        accentText: "text-rose-600 dark:text-rose-400",
        ringTrack: "#fecdd3",
        ringFill: "#f43f5e",
      }
    : isTight
      ? {
          border: "border-amber-200 dark:border-amber-900/60",
          bg: "bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20",
          badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300",
          badgeText: "Budget Tight",
          accentText: "text-amber-600 dark:text-amber-400",
          ringTrack: "#fde68a",
          ringFill: "#f59e0b",
        }
      : {
          border: "border-emerald-200/80 dark:border-emerald-900/40",
          bg: "bg-gradient-to-br from-emerald-50/60 via-white to-brand-50/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-brand-950/20",
          badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300",
          badgeText: "Healthy Balance",
          accentText: "text-emerald-700 dark:text-emerald-400",
          ringTrack: "#ccfbf1",
          ringFill: "#0f766e",
        };

  // SVG Gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, spentPercent)) / 100) * circumference;

  return (
    <div
      className={`card-hero ${statusTheme.bg} ${statusTheme.border} shadow-card-hover relative overflow-hidden`}
    >
      <div className="grid gap-6 md:grid-cols-12 md:items-center">
        {/* Left / Center Info */}
        <div className="space-y-4 md:col-span-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-subtle dark:bg-slate-800">
              <Wallet className="h-4 w-4 text-brand-600 dark:text-brand-400" strokeWidth={2} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Remaining Budget
            </span>
            <span className={`badge text-[11px] ${statusTheme.badge}`}>
              {statusTheme.badgeText}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h2
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ${statusTheme.accentText}`}
              >
                <CountUp
                  value={remaining}
                  currency={currency}
                  isCurrency={true}
                  duration={750}
                />
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Income ({formatCurrency(income, currency)}) minus total expenses ({formatCurrency(expenses, currency)})
            </p>
          </div>

          {/* Quick Mini Metrics */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-3 py-1.5 shadow-subtle dark:bg-slate-800/80">
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
              <span className="text-slate-500">Income:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(income, currency)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-3 py-1.5 shadow-subtle dark:bg-slate-800/80">
              <ArrowUpRight className="h-3.5 w-3.5 text-rose-600" strokeWidth={2.5} />
              <span className="text-slate-500">Spent:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(expenses, currency)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/80 px-3 py-1.5 shadow-subtle dark:bg-slate-800/80">
              <TrendingUp className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" strokeWidth={2.5} />
              <span className="text-slate-500">Saved:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(savings, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Circular Gauge */}
        <div className="flex items-center justify-center md:col-span-4">
          <div className="relative flex items-center justify-center">
            <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-200/80 dark:text-slate-800"
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
              <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                {spentPercent}%
              </span>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Spent
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

