import { createClient } from "@/lib/supabase/server";
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
      <h1 className="mb-1 text-xl font-semibold text-nexa-navy">Nuevo caso de prueba</h1>
      <p className="mb-6 text-sm text-slate-500">
        Documenta un caso que el equipo QA pueda ejecutar y repetir.
      </p>

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!projects?.length ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          Todavía no hay ninguna app registrada. Un admin debe crear una en Admin → Apps / Proyectos
          antes de poder registrar casos de prueba.
        </p>
      ) : (
        <form
          action={createTestCase}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">App</label>
            <select
              name="project_id"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
            <input
              name="title"
              required
              placeholder="Ej: Registrar una venta con QR Yape"
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
              placeholder="Ej: Usuario con sesión iniciada y al menos un producto en inventario"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Pasos</label>
            <textarea
              name="steps"
              required
              rows={4}
              placeholder={"1. ...\n2. ...\n3. ..."}
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
              placeholder="¿Qué debería pasar si todo funciona bien?"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-nexa-blue px-3 py-2 text-sm font-medium text-white shadow-sm shadow-nexa-blue/30 transition-colors hover:bg-nexa-navy"
          >
            Crear caso de prueba
          </button>
        </form>
      )}
    </div>
  );
}
