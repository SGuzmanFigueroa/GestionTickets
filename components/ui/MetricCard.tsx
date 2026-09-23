const TONE_STYLES = {
  default: "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800",
  primary: "border-blue-100 bg-nexa-light dark:border-blue-900/40 dark:bg-blue-950/30",
  warning: "border-amber-100 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30",
  danger: "border-red-100 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30",
} as const;

const VALUE_TONE = {
  default: "text-nexa-navy dark:text-white",
  primary: "text-nexa-blue",
  warning: "text-amber-700 dark:text-amber-400",
  danger: "text-red-700 dark:text-red-400",
} as const;

const LABEL_TONE = {
  default: "text-slate-400",
  primary: "text-nexa-blue/70",
  warning: "text-amber-600/80",
  danger: "text-red-600/80",
} as const;

export type MetricTone = keyof typeof TONE_STYLES;

export default function MetricCard({
  label,
  value,
  icon,
  tone = "default",
  onClick,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  tone?: MetricTone;
  /** Si se pasa, la tarjeta se vuelve un botón que abre el detalle. */
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium uppercase tracking-wide ${LABEL_TONE[tone]}`}>{label}</p>
        {icon && <span className={VALUE_TONE[tone]}>{icon}</span>}
      </div>
      <p className={`mt-1 text-2xl font-semibold ${VALUE_TONE[tone]}`}>{value}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue ${TONE_STYLES[tone]}`}
      >
        {content}
        <p className="mt-1 text-xs text-slate-400 transition-colors group-hover:text-nexa-blue dark:text-slate-500">
          Ver detalle →
        </p>
      </button>
    );
  }

  return <div className={`rounded-lg border p-4 ${TONE_STYLES[tone]}`}>{content}</div>;
}
