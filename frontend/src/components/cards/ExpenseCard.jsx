import {
  Tag,
  Home,
  Utensils,
  ShoppingBag,
  Zap,
  Wifi,
  Fuel,
  Shield,
  Film,
  Plane,
  Edit2,
  Trash2,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatCurrency";

function getCategoryIcon(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("rent") || lower.includes("house") || lower.includes("home")) return Home;
  if (lower.includes("food") || lower.includes("grocer") || lower.includes("dining")) return Utensils;
  if (lower.includes("shop") || lower.includes("cloth")) return ShoppingBag;
  if (lower.includes("electric") || lower.includes("power") || lower.includes("utility")) return Zap;
  if (lower.includes("internet") || lower.includes("wifi") || lower.includes("phone")) return Wifi;
  if (lower.includes("fuel") || lower.includes("gas") || lower.includes("car")) return Fuel;
  if (lower.includes("insurance") || lower.includes("emi") || lower.includes("loan")) return Shield;
  if (lower.includes("entertainment") || lower.includes("movie")) return Film;
  if (lower.includes("travel") || lower.includes("flight")) return Plane;
  return Tag;
}

export default function ExpenseCard({ expense, currency, onEdit, onDelete }) {
  const Icon = getCategoryIcon(expense.category_name);
  const isFixed = expense.category_type === "fixed";

  return (
    <div className="group relative flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 transition-all duration-150 hover:border-slate-200 hover:bg-slate-50/70 hover:shadow-subtle dark:border-slate-800/60 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-800/40">
      {/* Left: Category Icon + Details */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform duration-200 group-hover:scale-105 dark:bg-rose-950/50 dark:text-rose-400">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {expense.description || expense.category_name || "Uncategorised Expense"}
            </span>
            <span
              className={`badge text-[10px] uppercase ${
                isFixed
                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  : "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
              }`}
            >
              {expense.category_name || expense.category_type || "Expense"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{formatDate(expense.date)}</span>
          </div>
        </div>
      </div>

      {/* Right: Amount + Hover Actions */}
      <div className="flex items-center gap-4 text-right">
        <div>
          <p className="text-base font-bold tabular-nums text-rose-600 dark:text-rose-400">
            −{formatCurrency(expense.amount, currency)}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(expense)}
            title="Edit expense"
            aria-label="Edit expense"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Edit2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            onClick={() => onDelete(expense)}
            title="Delete expense"
            aria-label="Delete expense"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 active:scale-95 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/50"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

