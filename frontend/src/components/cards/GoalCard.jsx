import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Trophy,
  Target,
  Calendar,
  PlusCircle,
  Edit2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatCurrency";
import Button from "../common/Button";

export default function GoalCard({ goal, currency, onEdit, onDelete, onContribute }) {
  const hasCelebratedRef = useRef(false);

  // Trigger celebration confetti once when goal is complete
  useEffect(() => {
    if (goal.is_complete && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#0f766e", "#14b8a6", "#10b981", "#f59e0b"],
        });
      } catch {
        // graceful fallback if canvas-confetti is not available
      }
    }
  }, [goal.is_complete]);

  const progressPercent = Math.min(100, Number(goal.progress_percent) || 0);

  const statusConfig = goal.is_complete
    ? {
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300",
        label: "Achieved",
        icon: Trophy,
        barColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
      }
    : goal.on_track
      ? {
          badge: "bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300",
          label: "On Track",
          icon: Target,
          barColor: "bg-brand-600 dark:bg-brand-500",
        }
      : {
          badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300",
          label: "Behind Schedule",
          icon: Target,
          barColor: "bg-amber-500",
        };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="card-interactive relative flex flex-col justify-between overflow-hidden">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <StatusIcon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {goal.goal_name}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Priority {goal.priority} · Deadline {goal.deadline ? formatDate(goal.deadline) : "None"}
              </p>
            </div>
          </div>
          <span className={`badge shrink-0 text-xs ${statusConfig.badge}`}>
            {goal.is_complete && <Sparkles className="h-3 w-3" />}
            <span>{statusConfig.label}</span>
          </span>
        </div>

        {/* Capsule Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500 dark:text-slate-400">
              {formatCurrency(goal.saved_amount, currency)} of {formatCurrency(goal.target_amount, currency)}
            </span>
            <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
              {goal.progress_percent}%
            </span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${statusConfig.barColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/70 p-3 text-xs dark:bg-slate-800/40">
          <div>
            <dt className="text-slate-400">Required / month</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-slate-800 dark:text-slate-200">
              {formatCurrency(goal.required_monthly_saving, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Suggested this month</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-slate-800 dark:text-slate-200">
              {formatCurrency(goal.suggested_contribution || 0, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Months left</dt>
            <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
              {goal.months_left ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Expected completion</dt>
            <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
              {goal.expected_completion_date ? formatDate(goal.expected_completion_date) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button size="sm" onClick={() => onContribute(goal)}>
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Add savings</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onEdit(goal)}>
          <Edit2 className="h-3 w-3" />
          <span>Edit</span>
        </Button>
        <Button size="sm" variant="danger" onClick={() => onDelete(goal)}>
          <Trash2 className="h-3 w-3" />
          <span>Delete</span>
        </Button>
      </div>
    </div>
  );
}

