import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import SuccessBanner from "@/components/SuccessBanner";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import ProgressBar from "@/components/ui/ProgressBar";
import Link from "next/link";
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
  const [{ data: projects }, { data: leaders }, { data: requirements }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, slug, code, description, created_at, leader_id")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email").eq("role", "lider").order("full_name"),
    supabase.from("project_requirements").select("project_id, done"),
  ]);

  const leadersById = new Map((leaders ?? []).map((l) => [l.id, l]));
  const progress = new Map<string, { done: number; total: number }>();
  for (const r of requirements ?? []) {
    const c = progress.get(r.project_id) ?? { done: 0, total: 0 };
    c.total += 1;
    if (r.done) c.done += 1;
    progress.set(r.project_id, c);
  }

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

                <div className="mt-auto pt-3">
                  {progress.get(p.id) && (
                    <div className="mb-2">
                      <ProgressBar done={progress.get(p.id)!.done} total={progress.get(p.id)!.total} size="sm" />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                      Líder: {leader?.full_name ?? leader?.email ?? "Sin asignar"}
                    </p>
                    <Link
                      href={`/progress/${p.id}`}
                      className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-nexa-blue transition-colors hover:border-nexa-blue hover:bg-nexa-light dark:border-slate-600 dark:hover:bg-blue-950/30"
                    >
                      Ver progreso
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
