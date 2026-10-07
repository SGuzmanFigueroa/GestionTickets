import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";
import Avatar from "@/components/ui/Avatar";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import ProgressBar from "@/components/ui/ProgressBar";
import { SURFACE, TABLE_HEAD, TABLE_ROW, TABLE_TOOLBAR, TD, TH } from "@/components/ui/styles";
import NewProjectModal from "./NewProjectModal";
import { deleteProject } from "./actions";

const MENU_ITEM =
  "block w-full px-3 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60";

export default async function AdminProjectsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: projects }, { data: leaders }, { data: requirements }, { data: tickets }, { data: memberships }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, slug, code, description, created_at, leader_id")
        .order("name"),
      supabase.from("profiles").select("id, full_name, email").eq("role", "lider").order("full_name"),
      supabase.from("project_requirements").select("project_id, done"),
      supabase.from("tickets").select("project_id, status"),
      supabase.from("team_member_projects").select("project_id, member_id"),
    ]);

  const leadersById = new Map((leaders ?? []).map((l) => [l.id, l]));
  const progress = new Map<string, { done: number; total: number }>();
  for (const r of requirements ?? []) {
    const c = progress.get(r.project_id) ?? { done: 0, total: 0 };
    c.total += 1;
    if (r.done) c.done += 1;
    progress.set(r.project_id, c);
  }
  const ticketCounts = new Map<string, { total: number; open: number }>();
  for (const t of tickets ?? []) {
    const c = ticketCounts.get(t.project_id) ?? { total: 0, open: 0 };
    c.total += 1;
    if (t.status !== "resolved" && t.status !== "closed") c.open += 1;
    ticketCounts.set(t.project_id, c);
  }
  const memberCounts = new Map<string, number>();
  for (const m of memberships ?? []) memberCounts.set(m.project_id, (memberCounts.get(m.project_id) ?? 0) + 1);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Proyectos"
        description="Las aplicaciones y productos que prueba el equipo."
        actions={<NewProjectModal leaders={leaders ?? []} />}
      />

      {!projects?.length ? (
        <EmptyState
          title="Todavía no has agregado ninguna app"
          description="Crea la primera para que el equipo QA pueda empezar a reportar tickets y casos de prueba."
        />
      ) : (
        <div className={SURFACE}>
          <div className={TABLE_TOOLBAR}>
            <SearchInput
              placeholder="Buscar proyectos…"
              scopeSelector="#projects-table"
              noResultsSelector="#projects-no-matches"
              className="w-full sm:w-72"
            />
            <p className="ml-auto text-xs text-slate-500 dark:text-slate-400">{projects.length} proyectos</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className={TABLE_HEAD}>
                <tr>
                  <th scope="col" className={TH}>Proyecto</th>
                  <th scope="col" className={`${TH} w-20`}>Clave</th>
                  <th scope="col" className={`${TH} w-32`}>Tickets</th>
                  <th scope="col" className={`${TH} w-24`}>Miembros</th>
                  <th scope="col" className={`${TH} w-48`}>Líder</th>
                  <th scope="col" className={`${TH} w-48`}>Avance (checklist)</th>
                  <th scope="col" className={`${TH} w-12`}><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody id="projects-table" className="divide-y divide-slate-100 dark:divide-slate-700/70">
                {projects.map((p) => {
                  const leader = p.leader_id ? leadersById.get(p.leader_id) : null;
                  const leaderName = leader ? (leader.full_name ?? leader.email) : null;
                  const tc = ticketCounts.get(p.id) ?? { total: 0, open: 0 };
                  const pr = progress.get(p.id);
                  return (
                    <tr key={p.id} data-search-row data-search-text={`${p.name} ${p.code} ${leaderName ?? ""}`} className={TABLE_ROW}>
                      <td className={`${TD} max-w-0`}>
                        <Link href={`/dashboard?project=${p.id}`} className="block truncate font-medium text-slate-800 hover:text-nexa-blue hover:underline dark:text-slate-100">
                          {p.name}
                        </Link>
                        {p.description && <p className="truncate text-xs text-slate-400 dark:text-slate-500">{p.description}</p>}
                      </td>
                      <td className={TD}>
                        <span className="rounded-[4px] bg-nexa-light px-1.5 py-0.5 font-mono text-xs font-semibold text-nexa-blue dark:bg-blue-950/40 dark:text-blue-300">
                          {p.code}
                        </span>
                      </td>
                      <td className={`${TD} tabular-nums text-slate-700 dark:text-slate-200`}>
                        {tc.total} <span className="text-xs text-slate-400">· {tc.open} abiertos</span>
                      </td>
                      <td className={`${TD} tabular-nums text-slate-700 dark:text-slate-200`}>{memberCounts.get(p.id) ?? 0}</td>
                      <td className={`${TD} max-w-0`}>
                        {leaderName ? (
                          <span className="flex items-center gap-1.5">
                            <Avatar name={leaderName} size="sm" />
                            <span className="truncate text-slate-700 dark:text-slate-200">{leaderName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Sin asignar</span>
                        )}
                      </td>
                      <td className={TD}>
                        {pr ? (
                          <Link href={`/progress/${p.id}`} className="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40" aria-label={`Ver progreso de ${p.name}`}>
                            <ProgressBar done={pr.done} total={pr.total} size="sm" />
                          </Link>
                        ) : (
                          <Link href={`/progress/${p.id}`} className="text-xs text-nexa-blue hover:underline dark:text-blue-300">
                            Crear checklist
                          </Link>
                        )}
                      </td>
                      <td className={`${TD} text-right`}>
                        <DropdownMenu label={`Más acciones para ${p.name}`}>
                          <Link href={`/dashboard?project=${p.id}`} role="menuitem" className={MENU_ITEM}>
                            Ver tickets
                          </Link>
                          <Link href={`/progress/${p.id}`} role="menuitem" className={MENU_ITEM}>
                            Ver progreso
                          </Link>
                          <div className="my-1 border-t border-slate-100 dark:border-slate-700" role="separator" />
                          <form action={deleteProject}>
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmSubmitButton
                              title="¿Eliminar proyecto?"
                              confirmMessage={`Esta acción puede afectar registros asociados a "${p.name}" y no se puede deshacer.`}
                              confirmLabel="Eliminar proyecto"
                              className={`${MENU_ITEM} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30`}
                            >
                              Eliminar
                            </ConfirmSubmitButton>
                          </form>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p id="projects-no-matches" className="hidden px-4 py-8 text-center text-sm text-slate-400">
            Ningún proyecto coincide con tu búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
