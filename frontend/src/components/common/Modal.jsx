import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "max-w-lg",
}) {
  useEffect(() => {
    if (!open) return () => {};
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full ${width} animate-scale-in rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 rounded-b-2xl dark:border-slate-800 dark:bg-slate-900/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

