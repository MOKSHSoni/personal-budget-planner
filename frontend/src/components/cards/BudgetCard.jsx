import { AlertTriangle, CheckCircle, Edit2, TrendingUp, Sparkles } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";
import Button from "../common/Button";

export default function BudgetCard({ allocation, currency, onEdit }) {
  const utilisationPercent = Number(allocation.utilisation_percent) || 0;
  const percent = Math.min(100, utilisationPercent);
  const isExhausted = !allocation.exceeded && utilisationPercent >= 100;

  // Status & color scheme
  const statusConfig = allocation.exceeded
    ? {
        badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-800",
        badgeText: "Overspent",
        barColor: "bg-rose-500",
        alertBox: "border-rose-200/80 bg-rose-50/70 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300",
      }
    : isExhausted
      ? {
          badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-800",
          badgeText: "100% Used",
          barColor: "bg-rose-500",
          alertBox: "border-rose-200/80 bg-rose-50/70 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300",
        }
      : allocation.nearly_exhausted
        ? {
            badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-800",
            badgeText: "Nearly Full",
            barColor: "bg-amber-500",
            alertBox: "border-amber-200/80 bg-amber-50/70 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",
          }
        : {
            badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-800",
            badgeText: "On Track",
            barColor: "bg-gradient-to-r from-teal-500 to-emerald-500",
            alertBox: null,
          };

  return (
    <div className="card-interactive flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {allocation.category_name}
              </h3>
              <span className={`badge text-[10px] uppercase shadow-subtle ${statusConfig.badge}`}>
                {statusConfig.badgeText}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <span className="capitalize">{allocation.type}</span>
              <span>•</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Priority: {allocation.priority}
              </span>
            </div>
          </div>
          <button
            onClick={() => onEdit(allocation)}
            title="Edit limit & priority"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Capsule Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Spend Progress</span>
            <span className="tabular-nums font-bold text-slate-800 dark:text-slate-200">
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
        <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-3 text-xs dark:bg-slate-800/40">
          <div>
            <dt className="text-slate-400">Monthly Limit</dt>
            <dd className="mt-0.5 font-bold tabular-nums text-slate-800 dark:text-slate-200">
              {formatCurrency(allocation.monthly_limit, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Total Spent</dt>
            <dd className="mt-0.5 font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {formatCurrency(allocation.spent, currency)}
            </dd>
          </div>
          <div className="col-span-2 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
            <dt className="text-slate-400">Remaining Cushion</dt>
            <dd
              className={`mt-0.5 font-black tabular-nums ${
                allocation.remaining_limit < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {formatCurrency(allocation.remaining_limit, currency)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Footer / Algorithmic Recommended Limit */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
        <span className="flex items-center gap-1 font-medium">
          <Sparkles className="h-3 w-3 text-brand-600 dark:text-brand-400" />
          Recommended:
        </span>
        <span className="font-bold tabular-nums text-brand-600 dark:text-brand-400">
          {formatCurrency(allocation.recommended_limit, currency)}
        </span>
      </div>
    </div>
  );
}
