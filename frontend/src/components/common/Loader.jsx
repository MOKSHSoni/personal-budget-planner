export default function Loader({ label = "Loading...", full = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${full ? "min-h-[55vh]" : "py-12"}`}
    >
      <div className="relative flex h-8 w-8 items-center justify-center">
        <div className="absolute h-8 w-8 animate-ping rounded-full bg-brand-400/20" />
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent dark:border-brand-400 dark:border-t-transparent" />
      </div>
      <p className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}

