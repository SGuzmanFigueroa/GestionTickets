import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { TestCaseStatusBadge, ProjectBadge } from "@/components/Badge";
import SubmitButton from "@/components/SubmitButton";
import SuccessBanner from "@/components/SuccessBanner";
import { formatDateTime } from "@/lib/format";
import {
  TEST_CASE_STATUSES,
  TEST_CASE_STATUS_LABELS,
  type TestCaseWithRelations,
} from "@/lib/types";
import { recordTestCaseRun, updateTestCase } from "./actions";

export default async function TestCaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const { success, error: errorMessage } = await searchParams;
  await requireProfile();
  const supabase = await createClient();

  const { data: testCase } = await supabase
    .from("test_cases")
    .select(
      "*, project:projects(id, name, slug), last_run_by_profile:profiles!test_cases_last_run_by_fkey(id, full_name, email)",
    )
    .eq("id", id)
    .single();

  if (!testCase) notFound();

  const tc = testCase as TestCaseWithRelations;

  const { data: linkedTickets } = await supabase
    .from("tickets")
    .select("id, title, status")
    .eq("test_case_id", id)
    .order("created_at", { ascending: false });

  const newTicketParams = new URLSearchParams({
    test_case_id: tc.id,
    project_id: tc.project_id,
    title: `Falla en caso de prueba: ${tc.title}`,
  });

  return (
    <div className="max-w-3xl">
      <Link
        href="/test-cases"
        className="text-sm text-slate-500 hover:text-nexa-blue hover:underline dark:text-slate-400"
      >
        ← Volver a casos de prueba
      </Link>

      {success && (
        <div className="mt-3">
          <SuccessBanner message={success} />
        </div>
      )}
      {errorMessage && (
        <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{errorMessage}</p>
      )}

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="h-1.5 bg-gradient-to-r from-nexa-blue to-nexa-sky" />
        <div className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <TestCaseStatusBadge status={tc.status} label={TEST_CASE_STATUS_LABELS[tc.status]} />
            <ProjectBadge>{tc.project?.name}</ProjectBadge>
          </div>

          <h1 className="mb-1 text-xl font-semibold text-nexa-navy dark:text-white">{tc.title}</h1>
          <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
            {tc.last_run_at
              ? `Última ejecución: ${tc.last_run_by_profile?.full_name ?? tc.last_run_by_profile?.email ?? "usuario eliminado"} · ${formatDateTime(tc.last_run_at)}`
              : "Todavía no se ha ejecutado"}
          </p>

          {tc.last_run_notes && (
            <p className="mb-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-700/40 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">Notas de la última ejecución: </span>
              {tc.last_run_notes}
            </p>
          )}

          <div className="mb-6 rounded-md border border-slate-100 bg-nexa-light/20 p-4 dark:border-slate-700">
            <form action={recordTestCaseRun} className="space-y-2">
              <input type="hidden" name="id" value={tc.id} />
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                Registrar resultado de la ejecución
              </label>
              <div className="flex flex-wrap gap-2">
                <select
                  name="status"
                  defaultValue={tc.status === "not_run" ? "passed" : tc.status}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  {TEST_CASE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {TEST_CASE_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <input
                  name="notes"
                  placeholder="Notas (opcional)"
                  className="min-w-[180px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <SubmitButton variant="dark" pendingLabel="Guardando..." className="rounded-md px-3 py-1.5 text-sm">
                  Guardar resultado
                </SubmitButton>
              </div>
            </form>
          </div>

          {tc.status === "failed" && (
            <div className="mb-6 flex items-center justify-between rounded-md border border-red-100 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
              <p className="text-sm text-red-700 dark:text-red-300">Este caso falló. ¿Ya existe un ticket de bug?</p>
              <Link
                href={`/tickets/new?${newTicketParams.toString()}`}
                className="shrink-0 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Crear ticket de bug
              </Link>
            </div>
          )}

          {!!linkedTickets?.length && (
            <div className="mb-6">
              <h2 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Tickets originados aquí</h2>
              <ul className="space-y-1">
                {linkedTickets.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/tickets/${t.id}`}
                      className="text-sm text-nexa-blue hover:underline"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form action={updateTestCase} className="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-700">
            <input type="hidden" name="id" value={tc.id} />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Editar caso de prueba</h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Título</label>
              <input
                name="title"
                required
                defaultValue={tc.title}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Precondiciones
              </label>
              <textarea
                name="preconditions"
                rows={2}
                defaultValue={tc.preconditions ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Pasos</label>
              <textarea
                name="steps"
                required
                rows={4}
                defaultValue={tc.steps}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Resultado esperado
              </label>
              <textarea
                name="expected_result"
                required
                rows={3}
                defaultValue={tc.expected_result}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <SubmitButton variant="primary" pendingLabel="Guardando..." className="rounded-md px-3 py-1.5 text-sm font-medium">
              Guardar cambios
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
