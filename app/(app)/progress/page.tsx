import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";

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
    <div>
      <PageHeader
        title="Progreso de proyectos"
        description="Qué tanto se ha cumplido de lo esperado en el MVP y en Figma de cada app."
      />

      {totalItems > 0 && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-nexa-navy dark:text-white">Avance general</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalDone} de {totalItems} puntos completados
            </p>
          </div>
          <ProgressBar done={totalDone} total={totalItems} />
        </div>
      )}

      {!projects?.length ? (
        <EmptyState title="No hay proyectos" description="Crea un proyecto en Admin → Proyectos para empezar a medir su avance." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const c = counts.get(p.id);
            return (
              <Link
                key={p.id}
                href={`/progress/${p.id}`}
                className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-nexa-blue hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-nexa-light text-xs font-semibold text-nexa-blue dark:bg-blue-950/40 dark:text-blue-300">
                    {p.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                      Líder: {(p.leader_id && leaderName.get(p.leader_id)) || "Sin asignar"}
                    </p>
                  </div>
                  {c && c.total > 0 && c.done === c.total && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Completo
                    </span>
                  )}
                </div>

                {c ? (
                  <>
                    <ProgressBar done={c.done} total={c.total} />
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">MVP</span> {c.mvp[0]}/{c.mvp[1]}
                      </span>
                      <span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">Figma</span> {c.figma[0]}/
                        {c.figma[1]}
                      </span>
                      <span>{c.total - c.done} pendientes</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Sin checklist todavía. Entra para agregar lo esperado del MVP y Figma.
                  </p>
                )}

                <p className="mt-auto pt-3 text-xs font-medium text-nexa-blue opacity-80 group-hover:opacity-100">
                  Ver checklist →
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
