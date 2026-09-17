import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TestCaseStatusBadge, ProjectBadge } from "@/components/Badge";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import PageHeader from "@/components/ui/PageHeader";
import MetricCard from "@/components/ui/MetricCard";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { PlusIcon, ClipboardCheckIcon } from "@/components/ui/icons";
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
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug")
    .order("name");

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

  return (
    <div>
      <PageHeader
        title="Casos de prueba"
        description="Gestiona, ejecuta y consulta los casos de prueba de tus proyectos."
        actions={
          <Button href="/test-cases/new" variant="primary">
            <PlusIcon /> Nuevo caso
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Total" value={stats.total} icon={<ClipboardCheckIcon />} />
        <MetricCard label="Sin ejecutar" value={stats.notRun} />
        <MetricCard label="Aprobados" value={stats.passed} tone="primary" />
        <MetricCard label="Fallidos" value={stats.failed} tone="danger" />
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <AutoSubmitForm className="flex flex-wrap gap-2 text-sm" action="/test-cases">
          <select
            name="project"
            defaultValue={project ?? ""}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 outline-none focus:border-nexa-blue dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Todas las apps</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 outline-none focus:border-nexa-blue dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Todos los resultados</option>
            {TEST_CASE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TEST_CASE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          {hasFilters && (
            <Link
              href="/test-cases"
              className="rounded-md px-3 py-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Limpiar filtros
            </Link>
          )}
        </AutoSubmitForm>

        <SearchInput
          placeholder="Buscar por título..."
          scopeSelector="#test-cases-results"
          noResultsSelector="#test-cases-no-local-matches"
          className="sm:w-64"
        />
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
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
        <div id="test-cases-results">
          <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-nexa-light/50 text-xs uppercase tracking-wide text-nexa-navy/70 dark:border-slate-700 dark:bg-slate-700/40 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Caso</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Proyecto</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Resultado</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Última ejecución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {rows.map((c) => (
                    <tr
                      key={c.id}
                      data-search-row
                      data-search-text={c.title}
                      className="h-14 transition-colors hover:bg-nexa-light/30 dark:hover:bg-slate-700/40"
                    >
                      <td className="max-w-[320px] px-4 py-2.5">
                        <Link
                          href={`/test-cases/${c.id}`}
                          className="block truncate font-medium text-slate-800 hover:text-nexa-blue hover:underline dark:text-slate-100"
                        >
                          {c.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <ProjectBadge>{c.project?.name}</ProjectBadge>
                      </td>
                      <td className="px-4 py-2.5">
                        <TestCaseStatusBadge status={c.status} label={TEST_CASE_STATUS_LABELS[c.status]} />
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                        {c.last_run_at
                          ? `${c.last_run_by_profile?.full_name ?? c.last_run_by_profile?.email ?? "usuario eliminado"} · ${formatDate(c.last_run_at)}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p id="test-cases-no-local-matches" className="hidden px-4 py-8 text-center text-sm text-slate-400">
              Ningún caso visible coincide con tu búsqueda.
            </p>
          </div>

          <div className="space-y-3 sm:hidden">
            {rows.map((c) => (
              <Link
                key={c.id}
                href={`/test-cases/${c.id}`}
                data-search-row
                data-search-text={c.title}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <ProjectBadge>{c.project?.name}</ProjectBadge>
                  <TestCaseStatusBadge status={c.status} label={TEST_CASE_STATUS_LABELS[c.status]} />
                </div>
                <p className="mb-1 text-sm font-medium text-slate-800 dark:text-slate-100">{c.title}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {c.last_run_at
                    ? `${c.last_run_by_profile?.full_name ?? c.last_run_by_profile?.email ?? "usuario eliminado"} · ${formatDate(c.last_run_at)}`
                    : "Todavía no se ha ejecutado"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
