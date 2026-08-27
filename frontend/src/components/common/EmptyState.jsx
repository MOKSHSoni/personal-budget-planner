import Button from "./Button";
import { FolderOpen } from "lucide-react";

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = "No data found",
  description = "Get started by creating your first entry.",
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`card flex flex-col items-center justify-center py-12 text-center ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-8 ring-brand-50/50 dark:bg-brand-950/60 dark:text-brand-400 dark:ring-brand-950/30">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

