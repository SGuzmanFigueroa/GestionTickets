import Avatar from "./Avatar";

export interface LeaderboardEntry {
  name: string;
  count: number;
}

export default function Leaderboard({
  title,
  subtitle,
  entries,
  unit,
}: {
  title: string;
  subtitle: string;
  entries: LeaderboardEntry[];
  unit: string;
}) {
  const max = Math.max(1, ...entries.map((e) => e.count));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="text-sm font-semibold text-nexa-navy dark:text-white">{title}</p>
      <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
      {entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">Sin datos todavía.</p>
      ) : (
        <ol className="space-y-2.5">
          {entries.map((e, i) => (
            <li key={e.name} className="flex items-center gap-2.5">
              <span className="w-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                {i + 1}
              </span>
              <Avatar name={e.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm text-slate-700 dark:text-slate-200">{e.name}</span>
                  <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {e.count} {unit}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-nexa-sky to-nexa-blue"
                    style={{ width: `${(e.count / max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
