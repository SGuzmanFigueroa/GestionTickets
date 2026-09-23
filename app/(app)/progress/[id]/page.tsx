import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { canManageProjectWith } from "@/lib/project-permissions";
import { formatDate } from "@/lib/format";
import SuccessBanner from "@/components/SuccessBanner";
import SubmitButton from "@/components/SubmitButton";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import RequirementCheckbox from "@/components/RequirementCheckbox";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import { REQUIREMENT_SOURCE_LABELS, type ProjectRequirement, type RequirementSource } from "@/lib/types";
import { addRequirements, deleteRequirement, toggleRequirement, updateProjectLinks } from "../actions";

const SOURCE_BADGE: Record<RequirementSource, string> = {
  mvp: "bg-nexa-light text-nexa-blue dark:bg-blue-950/40 dark:text-blue-300",
  figma: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
};

const INPUT =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

type View = "all" | "pending" | "done";

export default async function ProjectProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string; view?: string; source?: string }>;
}) {
  const { id } = await params;
  const { success, error, view: rawView, source: rawSource } = await searchParams;
  const view: View = rawView === "pending" || rawView === "done" ? rawView : "all";
  const source = rawSource === "mvp" || rawSource === "figma" ? rawSource : null;

  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: project }, { data: reqs }, { data: people }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, code, description, leader_id, figma_url, mvp_url")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("project_requirements")
      .select("*")
      .eq("project_id", id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  if (!project) notFound();

  const canManage = canManageProjectWith(profile, project.leader_id);
  const isAdmin = profile.role === "admin";
  const nameOf = new Map((people ?? []).map((p) => [p.id, p.full_name ?? p.email]));
  const all = (reqs as ProjectRequirement[] | null) ?? [];

  const count = (items: ProjectRequirement[]) => ({ done: items.filter((r) => r.done).length, total: items.length });
  const overall = count(all);
  const mvp = count(all.filter((r) => r.source === "mvp"));
  const figma = count(all.filter((r) => r.source === "figma"));

  const visible = all.filter(
    (r) =>
      (view === "all" || (view === "done" ? r.done : !r.done)) && (!source || r.source === source),
  );

  // Agrupar por sección, respetando el orden en que aparecen.
  const sections = new Map<string, ProjectRequirement[]>();
  for (const r of visible) {
    const key = r.section ?? "General";
    sections.set(key, [...(sections.get(key) ?? []), r]);
  }
  const existingSections = [...new Set(all.map((r) => r.section).filter((s): s is string => Boolean(s)))];

  const filterParams = new URLSearchParams();
  if (view !== "all") filterParams.set("view", view);
  if (source) filterParams.set("source", source);
  const returnQuery = filterParams.toString();
  const hrefWith = (next: { view?: View; source?: RequirementSource | null }) => {
    const p = new URLSearchParams();
    const v = next.view ?? view;
    const s = next.source === undefined ? source : next.source;
    if (v !== "all") p.set("view", v);
    if (s) p.set("source", s);
    const q = p.toString();
    return `/progress/${id}${q ? `?${q}` : ""}`;
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? "border-nexa-blue bg-nexa-blue text-white"
        : "border-slate-200 bg-white text-slate-600 hover:border-nexa-blue hover:text-nexa-blue dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
    }`;

  return (
    <div className="max-w-4xl">
      <Link href="/progress" className="text-sm text-slate-500 hover:text-nexa-blue hover:underline dark:text-slate-400">
        ← Progreso de proyectos
      </Link>

      <div className="mt-3 mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-nexa-light text-sm font-semibold text-nexa-blue dark:bg-blue-950/40 dark:text-blue-300">
              {project.code}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-nexa-navy dark:text-white">{project.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Líder: {(project.leader_id && nameOf.get(project.leader_id)) || "Sin asignar"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {project.figma_url && (
              <a
                href={project.figma_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-300"
              >
                Abrir Figma ↗
              </a>
            )}
            {project.mvp_url && (
              <a
                href={project.mvp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-blue-200 bg-nexa-light px-3 py-1.5 text-xs font-medium text-nexa-blue hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
              >
                Ver documento MVP ↗
              </a>
            )}
          </div>
        </div>

        {project.description && (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{project.description}</p>
        )}

        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-200">Avance total</span>
            <span>
              {overall.done} de {overall.total} puntos
            </span>
          </div>
          <ProgressBar done={overall.done} total={overall.total} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Según el MVP", ...mvp },
            { label: "Según Figma", ...figma },
          ].map((s) => (
            <div key={s.label} className="rounded-md bg-slate-50 p-3 dark:bg-slate-700/40">
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">{s.label}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {s.done}/{s.total}
                </span>
              </div>
              <ProgressBar done={s.done} total={s.total} size="sm" />
            </div>
          ))}
        </div>

        {isAdmin && (
          <details className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
            <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-nexa-blue dark:text-slate-400">
              Editar links de Figma y MVP
            </summary>
            <form action={updateProjectLinks} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input type="hidden" name="project_id" value={project.id} />
              <input type="hidden" name="return_query" value={returnQuery} />
              <input
                name="figma_url"
                defaultValue={project.figma_url ?? ""}
                placeholder="Link de Figma"
                aria-label="Link de Figma"
                className={INPUT}
              />
              <input
                name="mvp_url"
                defaultValue={project.mvp_url ?? ""}
                placeholder="Link del documento MVP"
                aria-label="Link del documento MVP"
                className={INPUT}
              />
              <SubmitButton variant="dark" className="rounded-md px-3 py-2 text-sm">
                Guardar
              </SubmitButton>
            </form>
          </details>
        )}
      </div>

      {success && <SuccessBanner message={success} />}
      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={hrefWith({ view: "all" })} className={chip(view === "all")}>
          Todos ({overall.total})
        </Link>
        <Link href={hrefWith({ view: "pending" })} className={chip(view === "pending")}>
          Pendientes ({overall.total - overall.done})
        </Link>
        <Link href={hrefWith({ view: "done" })} className={chip(view === "done")}>
          Hechos ({overall.done})
        </Link>
        <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
        <Link href={hrefWith({ source: null })} className={chip(!source)}>
          MVP y Figma
        </Link>
        <Link href={hrefWith({ source: "mvp" })} className={chip(source === "mvp")}>
          Solo MVP
        </Link>
        <Link href={hrefWith({ source: "figma" })} className={chip(source === "figma")}>
          Solo Figma
        </Link>
      </div>

      {all.length === 0 ? (
        <EmptyState
          title="Este proyecto aún no tiene checklist"
          description={
            canManage
              ? "Agrega abajo lo que se espera según el MVP y las pantallas de Figma. Puedes pegar la lista completa, un punto por línea."
              : "Un admin o el líder del proyecto debe cargar lo esperado según el MVP y Figma."
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState title="Nada con estos filtros" description="Prueba con otra combinación de filtros." />
      ) : (
        <div className="space-y-4">
          {[...sections.entries()].map(([section, items]) => {
            const c = count(items);
            return (
              <section
                key={section}
                className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 dark:border-slate-700">
                  <h2 className="text-sm font-semibold text-nexa-navy dark:text-white">{section}</h2>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {c.done}/{c.total}
                  </span>
                  <div className="ml-auto w-28">
                    <ProgressBar done={c.done} total={c.total} size="sm" showLabel={false} />
                  </div>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {items.map((r) => (
                    <li key={r.id} className="group flex items-start gap-3 px-4 py-2.5">
                      <div className="pt-0.5">
                        <RequirementCheckbox
                          action={toggleRequirement}
                          id={r.id}
                          projectId={project.id}
                          done={r.done}
                          disabled={!canManage}
                          returnQuery={returnQuery}
                          title={r.title}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm ${
                            r.done
                              ? "text-slate-400 line-through dark:text-slate-500"
                              : "text-slate-800 dark:text-slate-100"
                          }`}
                        >
                          {r.title}
                        </p>
                        {r.done && r.done_at && (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Hecho{r.done_by && nameOf.get(r.done_by) ? ` por ${nameOf.get(r.done_by)}` : ""} ·{" "}
                            {formatDate(r.done_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {r.figma_url && (
                          <a
                            href={r.figma_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-600 hover:underline dark:text-purple-300"
                          >
                            Ver en Figma ↗
                          </a>
                        )}
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${SOURCE_BADGE[r.source]}`}>
                          {REQUIREMENT_SOURCE_LABELS[r.source]}
                        </span>
                        {canManage && (
                          <form action={deleteRequirement}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="project_id" value={project.id} />
                            <input type="hidden" name="return_query" value={returnQuery} />
                            <ConfirmSubmitButton
                              title="¿Quitar este punto?"
                              confirmMessage={`Se quitará "${r.title}" del checklist.`}
                              confirmLabel="Quitar"
                              className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-red-950/30"
                            >
                              <span aria-label="Quitar punto">✕</span>
                            </ConfirmSubmitButton>
                          </form>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {canManage ? (
        <form
          action={addRequirements}
          className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <input type="hidden" name="project_id" value={project.id} />
          <input type="hidden" name="return_query" value={returnQuery} />
          <p className="text-sm font-semibold text-nexa-navy dark:text-white">Agregar puntos esperados</p>
          <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
            Uno por línea. Puedes pegar la lista del MVP tal cual (se quitan viñetas y números).
          </p>
          <textarea
            name="titles"
            required
            rows={4}
            placeholder={"Login con correo y contraseña\nDashboard con métricas\nPantalla de perfil según Figma"}
            className={INPUT}
          />
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_140px_1fr_auto]">
            <input
              name="section"
              list="requirement-sections"
              placeholder="Sección (ej. Login, Dashboard)"
              aria-label="Sección"
              className={INPUT}
            />
            <datalist id="requirement-sections">
              {existingSections.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <select name="source" defaultValue={source ?? "mvp"} aria-label="Según" className={INPUT}>
              <option value="mvp">Según MVP</option>
              <option value="figma">Según Figma</option>
            </select>
            <input name="figma_url" placeholder="Link al frame de Figma (opcional)" aria-label="Link de Figma" className={INPUT} />
            <SubmitButton className="rounded-md px-4 py-2 text-sm font-medium" pendingLabel="Agregando...">
              Agregar
            </SubmitButton>
          </div>
        </form>
      ) : (
        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
          Solo un admin o el líder del proyecto puede marcar avances o editar este checklist.
        </p>
      )}
    </div>
  );
}
