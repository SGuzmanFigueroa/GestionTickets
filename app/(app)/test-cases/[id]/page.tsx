import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { TestCaseStatusBadge } from "@/components/Badge";
import {
  TEST_CASE_STATUSES,
  TEST_CASE_STATUS_LABELS,
  type TestCaseWithRelations,
} from "@/lib/types";
import { recordTestCaseRun, updateTestCase } from "./actions";

export default async function TestCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        className="text-sm text-slate-500 hover:text-nexa-blue hover:underline"
      >
        ← Volver a casos de prueba
      </Link>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-nexa-blue to-nexa-sky" />
        <div className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <TestCaseStatusBadge status={tc.status} label={TEST_CASE_STATUS_LABELS[tc.status]} />
            <span className="rounded-full bg-nexa-light px-2.5 py-0.5 text-xs font-medium text-nexa-blue">
              {tc.project?.name}
            </span>
          </div>

          <h1 className="mb-1 text-xl font-semibold text-nexa-navy">{tc.title}</h1>
          <p className="mb-4 text-xs text-slate-400">
            {tc.last_run_at
              ? `Última ejecución: ${tc.last_run_by_profile?.full_name ?? tc.last_run_by_profile?.email} · ${new Date(tc.last_run_at).toLocaleString("es-PE")}`
              : "Todavía no se ha ejecutado"}
          </p>

          {tc.last_run_notes && (
            <p className="mb-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Notas de la última ejecución: </span>
              {tc.last_run_notes}
            </p>
          )}

          <div className="mb-6 rounded-md border border-slate-100 bg-nexa-light/20 p-4">
            <form action={recordTestCaseRun} className="space-y-2">
              <input type="hidden" name="id" value={tc.id} />
              <label className="block text-xs font-medium text-slate-500">
                Registrar resultado de la ejecución
              </label>
              <div className="flex flex-wrap gap-2">
                <select
                  name="status"
                  defaultValue={tc.status === "not_run" ? "passed" : tc.status}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
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
                  className="min-w-[180px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
                />
                <button
                  type="submit"
                  className="rounded-md bg-nexa-navy px-3 py-1.5 text-sm text-white hover:bg-slate-900"
                >
                  Guardar resultado
                </button>
              </div>
            </form>
          </div>

          {tc.status === "failed" && (
            <div className="mb-6 flex items-center justify-between rounded-md border border-red-100 bg-red-50 p-4">
              <p className="text-sm text-red-700">Este caso falló. ¿Ya existe un ticket de bug?</p>
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
              <h2 className="mb-2 text-sm font-medium text-slate-700">Tickets originados aquí</h2>
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

          <form action={updateTestCase} className="space-y-4 border-t border-slate-100 pt-5">
            <input type="hidden" name="id" value={tc.id} />
            <h2 className="text-sm font-semibold text-slate-700">Editar caso de prueba</h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
              <input
                name="title"
                required
                defaultValue={tc.title}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Precondiciones
              </label>
              <textarea
                name="preconditions"
                rows={2}
                defaultValue={tc.preconditions ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Pasos</label>
              <textarea
                name="steps"
                required
                rows={4}
                defaultValue={tc.steps}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Resultado esperado
              </label>
              <textarea
                name="expected_result"
                required
                rows={3}
                defaultValue={tc.expected_result}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-nexa-blue px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-nexa-navy"
            >
              Guardar cambios
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
