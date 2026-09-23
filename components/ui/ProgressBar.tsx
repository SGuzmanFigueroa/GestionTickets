/** Barra de avance con porcentaje. `done` de `total` puntos completados. */
export default function ProgressBar({
  done,
  total,
  size = "md",
  showLabel = true,
}: {
  done: number;
  total: number;
  size?: "sm" | "md";
  showLabel?: boolean;
}) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const color =
    total === 0
      ? "bg-slate-300 dark:bg-slate-600"
      : pct === 100
        ? "bg-emerald-500"
        : "bg-gradient-to-r from-nexa-sky to-nexa-blue";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 ${size === "sm" ? "h-1.5" : "h-2.5"}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full transition-[width] ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
          {pct}%
        </span>
      )}
    </div>
  );
}
