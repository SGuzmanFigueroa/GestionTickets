// Estadística compacta. El tono solo pinta el número y un punto (no toda la
// tarjeta), para que una fila de métricas no compita con la lista principal.

const VALUE_TONE = {
  default: "text-nexa-navy dark:text-white",
  primary: "text-nexa-blue dark:text-blue-300",
  warning: "text-amber-700 dark:text-amber-400",
  danger: "text-red-700 dark:text-red-400",
} as const;

const DOT_TONE = {
  default: "bg-slate-300 dark:bg-slate-600",
  primary: "bg-nexa-blue",
  warning: "bg-amber-500",
  danger: "bg-red-500",
} as const;

export type MetricTone = keyof typeof VALUE_TONE;

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
      <span className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_TONE[tone]}`} aria-hidden="true" />
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        {icon && <span className="ml-auto text-slate-400" aria-hidden="true">{icon}</span>}
      </span>
      <span className={`mt-0.5 block text-xl font-semibold tabular-nums ${VALUE_TONE[tone]}`}>{value}</span>
    </>
  );

  const base = "block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-800";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label}: ${value}. Ver detalle`}
        className={`${base} group relative transition-colors hover:border-nexa-blue/60 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:hover:bg-slate-700/50`}
      >
        {content}
        <span className="absolute bottom-2 right-2.5 text-xs text-slate-300 transition-colors group-hover:text-nexa-blue dark:text-slate-600" aria-hidden="true">
          →
        </span>
      </button>
    );
  }

  return <div className={base}>{content}</div>;
}
