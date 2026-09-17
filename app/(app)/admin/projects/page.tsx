import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import SuccessBanner from "@/components/SuccessBanner";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import NewProjectModal from "./NewProjectModal";
import { deleteProject } from "./actions";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: projects }, { data: leaders }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, slug, code, description, created_at, leader_id")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email").eq("role", "lider").order("full_name"),
  ]);

  const leadersById = new Map((leaders ?? []).map((l) => [l.id, l]));

  return (
    <div>
      <PageHeader
        title="Proyectos"
        description="Administra las aplicaciones y productos que prueba el equipo QA."
        actions={<NewProjectModal leaders={leaders ?? []} />}
      />

      {success && <SuccessBanner message={success} />}
      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>
      )}

      {projects?.length === 0 ? (
        <EmptyState
          title="Todavía no has agregado ninguna app"
          description="Crea la primera para que el equipo QA pueda empezar a reportar tickets y casos de prueba."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p) => {
            const leader = p.leader_id ? leadersById.get(p.leader_id) : null;
            return (
              <div
                key={p.id}
                className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-nexa-light text-xs font-semibold text-nexa-blue dark:bg-blue-950/40 dark:text-blue-300">
                    {p.code}
                  </span>
                  <DropdownMenu label={`Más acciones para ${p.name}`}>
                    <form action={deleteProject}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmSubmitButton
                        title="¿Eliminar proyecto?"
                        confirmMessage={`Esta acción puede afectar registros asociados a "${p.name}" y no se puede deshacer.`}
                        confirmLabel="Eliminar proyecto"
                        className="block w-full px-3 py-1.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        Eliminar
                      </ConfirmSubmitButton>
                    </form>
                  </DropdownMenu>
                </div>

                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{p.description}</p>
                )}

                <p className="mt-auto pt-3 text-xs text-slate-400 dark:text-slate-500">
                  Líder: {leader?.full_name ?? leader?.email ?? "Sin asignar"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
