import CountUp from "../common/CountUp";

const TONES = {
  default: {
    text: "text-slate-900 dark:text-white",
    iconBg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  positive: {
    text: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-500/20",
  },
  negative: {
    text: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 ring-1 ring-rose-500/20",
  },
  brand: {
    text: "text-brand-600 dark:text-brand-400",
    iconBg: "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 ring-1 ring-brand-500/20",
  },
  warning: {
    text: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-500/20",
  },
  purple: {
    text: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 ring-1 ring-purple-500/20",
  },
};

export default function SummaryCard({
  title,
  value,
  numericValue,
  currency,
  isCurrency = false,
  subtitle,
  icon: Icon,
  tone = "default",
}) {
  const toneStyle = TONES[tone] || TONES.default;

  return (
    <div className="card-interactive flex flex-col justify-between p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
          {title}
        </p>
        {Icon && (
          <div className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl transition-transform hover:scale-105 ${toneStyle.iconBg}`}>
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.2} />
          </div>
        )}
      </div>

      <div className="mt-2.5 min-w-0">
        <p className={`text-base sm:text-lg lg:text-xl font-bold tracking-tight tabular-nums truncate ${toneStyle.text}`}>
          {numericValue !== undefined ? (
            <CountUp
              value={numericValue}
              currency={currency}
              isCurrency={isCurrency}
            />
          ) : (
            value
          )}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
