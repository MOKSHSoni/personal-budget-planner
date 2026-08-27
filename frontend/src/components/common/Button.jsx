const VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-subtle hover:bg-brand-700 hover:shadow active:scale-[0.98] focus:ring-brand-500/20 disabled:bg-brand-400 dark:bg-brand-600 dark:hover:bg-brand-500",
  secondary:
    "bg-white border border-slate-200 text-slate-700 shadow-subtle hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] focus:ring-slate-300 dark:bg-slate-800 dark:border-slate-700/80 dark:text-slate-200 dark:hover:bg-slate-700/80",
  danger:
    "bg-rose-600 text-white shadow-subtle hover:bg-rose-700 active:scale-[0.98] focus:ring-rose-300 dark:bg-rose-600 dark:hover:bg-rose-500",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
  outline:
    "bg-transparent border border-brand-600 text-brand-700 hover:bg-brand-50 active:scale-[0.98] dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-950/40",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs rounded-lg font-medium",
  md: "px-4 py-2 text-sm rounded-lg font-medium",
  lg: "px-5 py-2.5 text-base rounded-xl font-semibold",
};

export default function Button({
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

