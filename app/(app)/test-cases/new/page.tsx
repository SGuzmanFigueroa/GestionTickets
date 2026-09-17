import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/SubmitButton";
import EmptyState from "@/components/ui/EmptyState";
import { createTestCase } from "./actions";

export default async function NewTestCasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: projects } = await supabase.from("projects").select("id, name").order("name");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-nexa-navy dark:text-white">Nuevo caso de prueba</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Documenta un caso que el equipo QA pueda ejecutar y repetir.
      </p>

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {!projects?.length ? (
        <EmptyState
          title="Todavía no hay ninguna app registrada"
          description="Un admin debe crear una en Proyectos antes de poder registrar casos de prueba."
        />
      ) : (
        <form
          action={createTestCase}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">App</label>
            <select
              name="project_id"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Título</label>
            <input
              name="title"
              required
              placeholder="Ej: Registrar una venta con QR Yape"
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
              placeholder="Ej: Usuario con sesión iniciada y al menos un producto en inventario"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Pasos</label>
            <textarea
              name="steps"
              required
              rows={4}
              placeholder={"1. ...\n2. ...\n3. ..."}
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
              placeholder="¿Qué debería pasar si todo funciona bien?"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              href="/test-cases"
              className="rounded-md px-4 py-2 text-center text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </Link>
            <SubmitButton
              variant="primary"
              pendingLabel="Creando caso..."
              className="rounded-md px-4 py-2 text-sm font-medium"
            >
              Crear caso de prueba
            </SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
