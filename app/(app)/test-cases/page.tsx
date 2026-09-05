import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TestCaseStatusBadge } from "@/components/Badge";
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

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-nexa-navy">Casos de prueba</h1>
          <p className="text-sm text-slate-500">Casos de QA por app, con su último resultado</p>
        </div>
        <Link
          href="/test-cases/new"
          className="self-start rounded-md bg-nexa-blue px-3 py-2 text-sm font-medium text-white shadow-sm shadow-nexa-blue/30 transition-colors hover:bg-nexa-navy sm:self-auto"
        >
          + Nuevo caso
        </Link>
      </div>

      <form className="mb-5 flex flex-wrap gap-2 text-sm" action="/test-cases">
        <select
          name="project"
          defaultValue={project ?? ""}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 outline-none focus:border-nexa-blue"
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
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 outline-none focus:border-nexa-blue"
        >
          <option value="">Todos los resultados</option>
          {TEST_CASE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TEST_CASE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-md bg-nexa-navy px-3 py-1.5 font-medium text-white hover:bg-slate-900"
        >
          Filtrar
        </button>
        {(project || status) && (
          <Link
            href="/test-cases"
            className="rounded-md px-3 py-1.5 text-slate-500 hover:bg-slate-100"
          >
            Limpiar
          </Link>
        )}
      </form>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Error cargando casos de prueba: {error.message}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-nexa-light/50 text-xs uppercase tracking-wide text-nexa-navy/70">
            <tr>
              <th className="px-4 py-2 font-medium">Título</th>
              <th className="px-4 py-2 font-medium">App</th>
              <th className="px-4 py-2 font-medium">Resultado</th>
              <th className="px-4 py-2 font-medium">Última ejecución</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(cases as TestCaseWithRelations[] | null)?.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-nexa-light/30">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/test-cases/${c.id}`}
                    className="font-medium text-slate-800 hover:text-nexa-blue hover:underline"
                  >
                    {c.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-500">{c.project?.name}</td>
                <td className="px-4 py-2.5">
                  <TestCaseStatusBadge status={c.status} label={TEST_CASE_STATUS_LABELS[c.status]} />
                </td>
                <td className="px-4 py-2.5 text-slate-500">
                  {c.last_run_at
                    ? `${c.last_run_by_profile?.full_name ?? c.last_run_by_profile?.email} · ${new Date(c.last_run_at).toLocaleDateString("es-PE")}`
                    : "—"}
                </td>
              </tr>
            ))}
            {cases?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  No hay casos de prueba con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
