import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getScope, inScope } from "@/lib/scope";
import { TestCaseStatusBadge } from "@/components/Badge";
import Avatar from "@/components/ui/Avatar";
import { FILTER_SELECT, SURFACE, TABLE_HEAD, TABLE_ROW, TABLE_TOOLBAR, TD, TH } from "@/components/ui/styles";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import FilterMemory from "@/components/FilterMemory";
import PageHeader from "@/components/ui/PageHeader";
import MetricCard from "@/components/ui/MetricCard";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import {
  TEST_CASE_STATUS_LABELS,
  TEST_CASE_STATUSES,
  type TestCaseWithRelations,
} from "@/lib/types";

export default async function TestCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; status?: string }>;
}) {
  const { project, status } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();
  const scope = await getScope(supabase, profile);

  // Selector de proyecto: solo los propios (admin: todos). La base ya filtra los casos.
  const { data: allProjects } = await supabase.from("projects").select("id, name, slug").order("name");
  const projects = (allProjects ?? []).filter((p) => inScope(scope.projectIds, p.id));

  let query = supabase
    .from("test_cases")
    .select(
      "*, project:projects(id, name, slug), last_run_by_profile:profiles!test_cases_last_run_by_fkey(id, full_name, email)",
    )
    .order("created_at", { ascending: false });

  if (project) query = query.eq("project_id", project);
  if (status) query = query.eq("status", status);

  const { data: cases, error } = await query;
  const hasFilters = Boolean(project || status);
  const rows = (cases as TestCaseWithRelations[] | null) ?? [];

  const stats = {
    total: rows.length,
    notRun: rows.filter((c) => c.status === "not_run").length,
    passed: rows.filter((c) => c.status === "passed").length,
    failed: rows.filter((c) => c.status === "failed").length,
  };

  const blocked = rows.filter((c) => c.status === "blocked").length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Casos de prueba"
        description="Gestiona, ejecuta y consulta los casos de prueba de tus proyectos."
        actions={
          <Button href="/test-cases/new" variant="primary">
            <PlusIcon /> Nuevo caso
          </Button>
        }
      />

      <FilterMemory storageKey="test-cases" />
      <AutoSubmitForm className="flex flex-wrap items-center gap-2 text-sm" action="/test-cases">
        <label className="sr-only" htmlFor="tc-project">Proyecto</label>
        <select id="tc-project" name="project" defaultValue={project ?? ""} className={FILTER_SELECT}>
          <option value="">Proyecto: todos</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="tc-status">Resultado</label>
        <select id="tc-status" name="status" defaultValue={status ?? ""} className={FILTER_SELECT}>
          <option value="">Resultado: todos</option>
          {TEST_CASE_STATUSES.map((s) => (
            <option key={s} value={s}>{TEST_CASE_STATUS_LABELS[s]}</option>
          ))}
        </select>
        {hasFilters && (
          <Link
            href="/test-cases?clear=1"
            className="inline-flex h-8 items-center rounded-md px-2.5 text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Limpiar filtros
          </Link>
        )}
      </AutoSubmitForm>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <MetricCard label="Total" value={stats.total} />
        <MetricCard label="Sin ejecutar" value={stats.notRun} />
        <MetricCard label="Aprobados" value={stats.passed} tone="primary" />
        <MetricCard label="Fallidos" value={stats.failed} tone={stats.failed ? "danger" : "default"} />
        <MetricCard label="Bloqueados" value={blocked} tone={blocked ? "warning" : "default"} />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Error cargando casos de prueba: {error.message}
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="No hay casos de prueba"
          description={
            hasFilters
              ? "No hay casos que coincidan con estos filtros."
              : "Todavía no se han registrado casos de prueba para este proyecto."
          }
          action={
            !hasFilters && (
              <Button href="/test-cases/new" variant="primary" size="sm">
                <PlusIcon /> Crear caso
              </Button>
            )
          }
        />
      ) : (
        <div className={SURFACE}>
          <div className={TABLE_TOOLBAR}>
            <SearchInput
              placeholder="Buscar por título o proyecto…"
              scopeSelector="#test-cases-results"
              noResultsSelector="#test-cases-no-local-matches"
              className="w-full sm:w-80"
            />
            <p className="ml-auto text-xs text-slate-500 dark:text-slate-400">{rows.length} casos</p>
          </div>

          <div id="test-cases-results">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className={TABLE_HEAD}>
                  <tr>
                    <th scope="col" className={TH}>Caso</th>
                    <th scope="col" className={`${TH} w-44`}>Proyecto</th>
                    <th scope="col" className={`${TH} w-32`}>Resultado</th>
                    <th scope="col" className={`${TH} w-64`}>Última ejecución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
                  {rows.map((c) => (
                    <tr key={c.id} data-search-row data-search-text={`${c.title} ${c.project?.name ?? ""}`} className={TABLE_ROW}>
                      <td className={`${TD} max-w-0`}>
                        <Link
                          href={`/test-cases/${c.id}`}
                          className="block truncate font-medium text-slate-800 hover:text-nexa-blue hover:underline dark:text-slate-100"
                          title={c.title}
                        >
                          {c.title}
                        </Link>
                      </td>
                      <td className={`${TD} truncate text-slate-600 dark:text-slate-300`}>{c.project?.name}</td>
                      <td className={TD}>
                        <TestCaseStatusBadge status={c.status} label={TEST_CASE_STATUS_LABELS[c.status]} />
                      </td>
                      <td className={`${TD} text-xs text-slate-500 dark:text-slate-400`}>
                        {c.last_run_at ? (
                          <span className="flex items-center gap-1.5">
                            <Avatar name={c.last_run_by_profile?.full_name ?? c.last_run_by_profile?.email ?? "?"} size="sm" />
                            <span className="truncate">
                              {c.last_run_by_profile?.full_name ?? c.last_run_by_profile?.email ?? "Usuario eliminado"} · {formatDate(c.last_run_at)}
                            </span>
                          </span>
                        ) : (
                          "Sin ejecutar"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden dark:divide-slate-700">
              {rows.map((c) => (
                <li key={c.id} data-search-row data-search-text={`${c.title} ${c.project?.name ?? ""}`}>
                  <Link href={`/test-cases/${c.id}`} className="block px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-slate-500 dark:text-slate-400">{c.project?.name}</span>
                      <TestCaseStatusBadge status={c.status} label={TEST_CASE_STATUS_LABELS[c.status]} />
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{c.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {c.last_run_at
                        ? `${c.last_run_by_profile?.full_name ?? c.last_run_by_profile?.email ?? "Usuario eliminado"} · ${formatDate(c.last_run_at)}`
                        : "Todavía no se ha ejecutado"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p id="test-cases-no-local-matches" className="hidden px-4 py-8 text-center text-sm text-slate-400">
            Ningún caso coincide con tu búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
