import { AlertTriangle, CheckCircle, Edit2, TrendingUp } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";
import Button from "../common/Button";

export default function BudgetCard({ allocation, currency, onEdit }) {
  const utilisationPercent = Number(allocation.utilisation_percent) || 0;
  const percent = Math.min(100, utilisationPercent);
  const isExhausted = !allocation.exceeded && utilisationPercent >= 100;

  // Status & color scheme
  const statusConfig = allocation.exceeded
    ? {
        badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300",
        badgeText: "Overspent",
        barColor: "bg-rose-500",
        alertBox: "border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300",
      }
    : isExhausted
      ? {
          badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300",
          badgeText: "100% Used",
          barColor: "bg-rose-500",
          alertBox: "border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300",
        }
      : allocation.nearly_exhausted
        ? {
            badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300",
            badgeText: "Nearly Exhausted",
            barColor: "bg-amber-500",
            alertBox: "border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",
          }
        : {
            badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300",
            badgeText: "On Track",
            barColor: "bg-brand-600 dark:bg-brand-500",
            alertBox: null,
          };

  return (
    <div className="card-interactive flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {allocation.category_name}
              </h3>
              <span className={`badge text-[10px] uppercase ${statusConfig.badge}`}>
                {statusConfig.badgeText}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {allocation.type} · Priority {allocation.priority} (w{allocation.priority_weight})
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEdit(allocation)}
            className="shrink-0"
          >
            <Edit2 className="h-3 w-3" />
            <span>Edit</span>
          </Button>
        </div>

        {/* Capsule Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Spent vs Limit</span>
            <span className="tabular-nums text-slate-800 dark:text-slate-200">
              {utilisationPercent}%
            </span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${statusConfig.barColor}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/70 p-3 text-xs dark:bg-slate-800/40">
          <div>
            <dt className="text-slate-400">Monthly Limit</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-slate-800 dark:text-slate-200">
              {formatCurrency(allocation.monthly_limit, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Total Spent</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-slate-800 dark:text-slate-200">
              {formatCurrency(allocation.spent, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Remaining</dt>
            <dd
              className={`mt-0.5 font-bold tabular-nums ${
                allocation.remaining < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {formatCurrency(allocation.remaining, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Recommended</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-slate-600 dark:text-slate-300">
              {formatCurrency(allocation.recommended_limit, currency)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Alert Messages if applicable */}
      {statusConfig.alertBox && (
        <div className={`mt-3 flex items-start gap-2 rounded-xl border p-2.5 text-xs ${statusConfig.alertBox}`}>
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            {allocation.exceeded
              ? "Overspent — actual spending exceeds this category's limit."
              : isExhausted
                ? `Budget exhausted (${allocation.utilisation_percent}% used).`
                : `Budget nearly exhausted (${allocation.utilisation_percent}% used).`}
          </span>
        </div>
      )}
    </div>
  );
}

