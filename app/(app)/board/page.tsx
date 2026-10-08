import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { allowedStatuses } from "@/lib/ticket-permissions";
import PageHeader from "@/components/ui/PageHeader";
import FilterMemory from "@/components/FilterMemory";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import type { TicketPriority, TicketSeverity, TicketStatus } from "@/lib/types";
import KanbanBoard, { type BoardCard } from "./KanbanBoard";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();
  const isAdmin = profile.role === "admin";

  // Proyectos que se pueden elegir: todos para el admin; los propios para el resto.
  const { data: myProjectIds } = isAdmin ? { data: null } : await supabase.rpc("my_project_ids");
  let projectsQuery = supabase.from("projects").select("id, name, code").order("name");
  if (!isAdmin) projectsQuery = projectsQuery.in("id", (myProjectIds as string[] | null) ?? []);
  const { data: projects } = await projectsQuery;
  const selected = projects?.find((p) => p.id === project) ? project! : null;

  // La base solo devuelve lo que cada uno puede ver (admin: todo; líder: sus
  // proyectos; resto: lo que reportó o tiene asignado).
  let query = supabase
    .from("tickets")
    .select(
      "id, title, ticket_number, status, severity, priority, assignee_id, reporter_id, updated_at, project:projects(code, name), assignee:profiles!tickets_assignee_id_fkey(full_name, email)",
    )
    .neq("status", "closed")
    .order("updated_at", { ascending: false });
  if (selected) query = query.eq("project_id", selected);
  const { data: tickets, error } = await query;

  const cards: BoardCard[] = (tickets ?? []).map((t) => {
    const p = t.project as unknown as { code: string; name: string } | null;
    const a = t.assignee as unknown as { full_name: string | null; email: string } | null;
    return {
      id: t.id,
      code: `${p?.code ?? "?"}-${t.ticket_number}`,
      title: t.title,
      status: t.status as TicketStatus,
      severity: t.severity as TicketSeverity,
      priority: t.priority as TicketPriority,
      projectName: p?.name ?? "",
      assigneeName: a ? (a.full_name ?? a.email) : null,
      mine: t.assignee_id === profile.id,
      moves: allowedStatuses(profile, t),
    };
  });

  const scopeText = isAdmin
    ? "Ves todos los tickets."
    : profile.role === "lider"
      ? "Ves los tickets de tus proyectos y los tuyos."
      : "Ves los tickets que te asignaron o que reportaste.";

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? "border-nexa-blue bg-nexa-blue text-white"
        : "border-slate-200 bg-white text-slate-600 hover:border-nexa-blue hover:text-nexa-blue dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
    }`;

  return (
    <div>
      <FilterMemory storageKey="board" />
      <PageHeader
        title="Tablero"
        description={`Arrastra cada ticket por su etapa: Por hacer → En progreso → Hecho → En revisión → Certificado. ${scopeText}`}
        actions={
          <Button href="/tickets/new" variant="primary">
            <PlusIcon /> Nuevo ticket
          </Button>
        }
      />

      {(projects?.length ?? 0) > 1 && (
        <nav aria-label="Filtrar por proyecto" className="mb-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Proyecto
          </span>
          <Link href="/board?clear=1" className={chip(!selected)} aria-current={!selected ? "page" : undefined}>
            Todos
          </Link>
          {projects!.map((p) => (
            <Link
              key={p.id}
              href={`/board?project=${p.id}`}
              className={chip(selected === p.id)}
              aria-current={selected === p.id ? "page" : undefined}
            >
              {p.code} · {p.name}
            </Link>
          ))}
        </nav>
      )}

      {error ? (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Error cargando el tablero: {error.message}
        </p>
      ) : (
        // key: al cambiar de proyecto se reinicia el estado local del tablero.
        <KanbanBoard key={selected ?? "all"} initialCards={cards} />
      )}
    </div>
  );
}
