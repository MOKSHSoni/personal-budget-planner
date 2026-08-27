import CountUp from "../common/CountUp";

const TONES = {
  default: {
    text: "text-slate-900 dark:text-white",
    iconBg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  positive: {
    text: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  negative: {
    text: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300",
  },
  brand: {
    text: "text-brand-700 dark:text-brand-300",
    iconBg: "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300",
  },
  warning: {
    text: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
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
    <div className="card-interactive flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneStyle.iconBg}`}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className={`text-2xl font-bold tracking-tight tabular-nums ${toneStyle.text}`}>
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
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

