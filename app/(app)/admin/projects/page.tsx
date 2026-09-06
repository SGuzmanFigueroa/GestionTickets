import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import SubmitButton from "@/components/SubmitButton";
import SuccessBanner from "@/components/SuccessBanner";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { createProject, deleteProject } from "./actions";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug, code, description, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-nexa-navy dark:text-white">Apps / Proyectos</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Cada app que el equipo QA prueba (Inventra, y las que vengan después) vive aquí como un
        proyecto separado.
      </p>

      {success && <SuccessBanner message={success} />}
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <form
        action={createProject}
        className="mb-6 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="min-w-[160px] flex-1 basis-full sm:basis-auto">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Nombre de la app</label>
          <input
            name="name"
            required
            placeholder="Ej: Inventra"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="w-28 basis-full sm:basis-auto">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Código</label>
          <input
            name="code"
            required
            maxLength={5}
            placeholder="Ej: INV"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="min-w-[160px] flex-1 basis-full sm:basis-auto">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Descripción</label>
          <input
            name="description"
            placeholder="Opcional"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <SubmitButton variant="primary" pendingLabel="Agregando..." className="rounded-md px-3 py-2 text-sm font-medium">
          Agregar app
        </SubmitButton>
      </form>

      <div className="space-y-2">
        {projects?.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-nexa-light text-xs font-semibold text-nexa-blue">
                {p.code}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{p.name}</p>
                {p.description && <p className="text-xs text-slate-500 dark:text-slate-400">{p.description}</p>}
              </div>
            </div>
            <form action={deleteProject}>
              <input type="hidden" name="id" value={p.id} />
              <ConfirmSubmitButton
                confirmMessage={`¿Eliminar la app "${p.name}"? Esto no se puede deshacer.`}
                className="text-xs text-red-500 hover:underline"
              >
                Eliminar
              </ConfirmSubmitButton>
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
