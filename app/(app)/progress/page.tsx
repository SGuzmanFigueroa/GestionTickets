import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import MetricCard from "@/components/ui/MetricCard";
import { SURFACE, TABLE_HEAD, TABLE_ROW, TD, TH } from "@/components/ui/styles";

type Counts = { total: number; done: number; mvp: [number, number]; figma: [number, number] };

export default async function ProgressPage() {
  await requireProfile();
  const supabase = await createClient();

  const [{ data: projects }, { data: requirements }, { data: leaders }] = await Promise.all([
    supabase.from("projects").select("id, name, code, description, leader_id, figma_url, mvp_url").order("name"),
    supabase.from("project_requirements").select("project_id, source, done"),
    supabase.from("profiles").select("id, full_name, email").eq("role", "lider"),
  ]);

  const leaderName = new Map((leaders ?? []).map((l) => [l.id, l.full_name ?? l.email]));
  const counts = new Map<string, Counts>();
  for (const r of requirements ?? []) {
    const c = counts.get(r.project_id) ?? { total: 0, done: 0, mvp: [0, 0], figma: [0, 0] };
    c.total += 1;
    if (r.done) c.done += 1;
    const bucket = r.source === "figma" ? c.figma : c.mvp;
    bucket[1] += 1;
    if (r.done) bucket[0] += 1;
    counts.set(r.project_id, c);
  }

  const all = [...counts.values()];
  const totalDone = all.reduce((a, c) => a + c.done, 0);
  const totalItems = all.reduce((a, c) => a + c.total, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Progreso de proyectos"
        description="Qué tanto se ha cumplido de lo esperado en el MVP y en Figma de cada app."
      />

      {!projects?.length ? (
        <EmptyState title="No hay proyectos" description="Crea un proyecto en Admin → Proyectos para empezar a medir su avance." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricCard label="Proyectos" value={projects.length} />
            <MetricCard label="Puntos totales" value={totalItems} />
            <MetricCard label="Completados" value={totalDone} tone="primary" />
            <MetricCard
              label="Avance general"
              value={totalItems ? `${Math.round((totalDone / totalItems) * 100)}%` : "—"}
              tone={totalItems && totalDone === totalItems ? "primary" : "default"}
            />
          </div>

          <div className={SURFACE}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th scope="col" className={TH}>Proyecto</th>
                    <th scope="col" className={`${TH} w-44`}>Líder</th>
                    <th scope="col" className={`${TH} w-64`}>Avance</th>
                    <th scope="col" className={`${TH} w-24`}>MVP</th>
                    <th scope="col" className={`${TH} w-24`}>Figma</th>
                    <th scope="col" className={`${TH} w-28`}>Pendientes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
                  {projects.map((p) => {
                    const c = counts.get(p.id);
                    return (
                      <tr key={p.id} className={TABLE_ROW}>
                        <td className={`${TD} max-w-0`}>
                          <Link href={`/progress/${p.id}`} className="flex min-w-0 items-center gap-2 font-medium text-slate-800 hover:text-nexa-blue hover:underline dark:text-slate-100">
                            <span className="shrink-0 rounded-[4px] bg-nexa-light px-1.5 py-0.5 font-mono text-[11px] font-semibold text-nexa-blue dark:bg-blue-950/40 dark:text-blue-300">
                              {p.code}
                            </span>
                            <span className="truncate">{p.name}</span>
                            {c && c.total > 0 && c.done === c.total && (
                              <span className="shrink-0 rounded-[4px] bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Completo
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className={`${TD} truncate text-slate-600 dark:text-slate-300`}>
                          {(p.leader_id && leaderName.get(p.leader_id)) || <span className="text-slate-400">Sin asignar</span>}
                        </td>
                        <td className={TD}>
                          {c ? (
                            <ProgressBar done={c.done} total={c.total} size="sm" />
                          ) : (
                            <Link href={`/progress/${p.id}`} className="text-xs text-nexa-blue hover:underline dark:text-blue-300">
                              Crear checklist
                            </Link>
                          )}
                        </td>
                        <td className={`${TD} tabular-nums text-slate-600 dark:text-slate-300`}>{c ? `${c.mvp[0]}/${c.mvp[1]}` : "—"}</td>
                        <td className={`${TD} tabular-nums text-slate-600 dark:text-slate-300`}>{c ? `${c.figma[0]}/${c.figma[1]}` : "—"}</td>
                        <td className={`${TD} tabular-nums text-slate-600 dark:text-slate-300`}>{c ? c.total - c.done : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
