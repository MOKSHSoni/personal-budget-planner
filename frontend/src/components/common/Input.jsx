export default function Input({
  label,
  error,
  id,
  className = "",
  as = "input",
  icon: Icon,
  children,
  ...props
}) {
  const inputId = id || props.name;
  const Tag = as;
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <Tag
          id={inputId}
          className={`field ${Icon ? "pl-10" : ""} ${error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-800" : ""}`}
          {...props}
        >
          {children}
        </Tag>
      </div>
      {error && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  );
}

