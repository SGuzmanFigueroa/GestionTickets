import { daysUntil, formatDueDate } from "@/lib/format";

/**
 * Fecha límite con aviso: rojo si ya venció, ámbar si vence hoy o en ≤2 días.
 * Si el trabajo ya terminó (`finished`), se muestra sin colores.
 */
export default function DueDate({
  value,
  finished = false,
  compact = false,
}: {
  value: string | null;
  finished?: boolean;
  compact?: boolean;
}) {
  if (!value) {
    return <span className="italic text-slate-400 dark:text-slate-500">{compact ? "—" : "Sin fecha"}</span>;
  }

  const days = daysUntil(value);
  const tone = finished
    ? "text-slate-700 dark:text-slate-200"
    : days < 0
      ? "font-medium text-red-600 dark:text-red-400"
      : days <= 2
        ? "font-medium text-amber-600 dark:text-amber-400"
        : "text-slate-700 dark:text-slate-200";
  const hint = finished
    ? null
    : days < 0
      ? `Vencido hace ${-days} d`
      : days === 0
        ? "Vence hoy"
        : days === 1
          ? "Vence mañana"
          : days <= 2
            ? `Vence en ${days} d`
            : null;

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${tone}`} title={hint ?? undefined}>
      <time dateTime={value}>{formatDueDate(value)}</time>
      {hint && !compact && <span className="truncate text-xs">· {hint}</span>}
    </span>
  );
}
