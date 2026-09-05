import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createProject, deleteProject } from "./actions";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug, description, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-nexa-navy">Apps / Proyectos</h1>
      <p className="mb-6 text-sm text-slate-500">
        Cada app que el equipo QA prueba (Inventra, y las que vengan después) vive aquí como un
        proyecto separado.
      </p>

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form
        action={createProject}
        className="mb-6 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="min-w-[160px] flex-1 basis-full sm:basis-auto">
          <label className="mb-1 block text-xs font-medium text-slate-600">Nombre de la app</label>
          <input
            name="name"
            required
            placeholder="Ej: Inventra"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
          />
        </div>
        <div className="min-w-[160px] flex-1 basis-full sm:basis-auto">
          <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
          <input
            name="description"
            placeholder="Opcional"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-nexa-blue px-3 py-2 text-sm font-medium text-white shadow-sm shadow-nexa-blue/30 transition-colors hover:bg-nexa-navy"
        >
          Agregar app
        </button>
      </form>

      <div className="space-y-2">
        {projects?.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-nexa-light text-sm font-semibold text-nexa-blue">
                {p.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">{p.name}</p>
                {p.description && <p className="text-xs text-slate-500">{p.description}</p>}
              </div>
            </div>
            <form action={deleteProject}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className="text-xs text-red-500 hover:underline">
                Eliminar
              </button>
            </form>
          </div>
        ))}
        {projects?.length === 0 && (
          <p className="text-sm text-slate-400">Todavía no has agregado ninguna app.</p>
        )}
      </div>
    </div>
  );
}
