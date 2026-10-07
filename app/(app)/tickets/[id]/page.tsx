import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { ticketPermissions } from "@/lib/ticket-permissions";
import { formatDateTime, timeAgo } from "@/lib/format";
import Avatar from "@/components/ui/Avatar";
import TicketView from "@/components/ticket/TicketView";
import type { ActivityItem } from "@/components/ticket/ActivityFeed";
import type { Profile, TicketComment, TicketWithRelations, UserRole } from "@/lib/types";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "*, project:projects(id, name, slug, code), reporter:profiles!tickets_reporter_id_fkey(id, full_name, email), assignee:profiles!tickets_assignee_id_fkey(id, full_name, email), test_case:test_cases(id, title)",
    )
    .eq("id", id)
    .single();

  if (!ticket) notFound();
  const t = ticket as TicketWithRelations;

  // Proyectos a los que se puede mover el ticket: todos para el admin; los propios para un líder.
  const { data: myProjectIds } = profile.role === "admin" ? { data: null } : await supabase.rpc("my_project_ids");
  let projectsQuery = supabase.from("projects").select("id, name, code").order("name");
  if (profile.role !== "admin") {
    projectsQuery = projectsQuery.in("id", [...((myProjectIds as string[] | null) ?? []), t.project_id]);
  }

  const [{ data: movableProjects }, { data: comments }, { data: people }, { data: attachments }, { data: history }] =
    await Promise.all([
      projectsQuery,
      supabase
        .from("ticket_comments")
        .select("*, author:profiles(id, full_name, email)")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true }),
      supabase.from("profiles").select("id, full_name, email, role").order("full_name"),
      supabase
        .from("ticket_attachments")
        .select("id, url, uploaded_by, created_at")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("ticket_history")
        .select("id, field, old_value, new_value, created_at, actor:profiles(full_name, email)")
        .eq("ticket_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const peopleList = (people as Pick<Profile, "id" | "full_name" | "email" | "role">[] | null) ?? [];
  const nameOf = new Map(peopleList.map((p) => [p.id, p.full_name ?? p.email]));
  const personName = (userId: string | null) => (userId ? (nameOf.get(userId) ?? "Usuario eliminado") : null);

  const activity: ActivityItem[] = [
    ...((comments as TicketComment[] | null) ?? []).map((c) => ({
      kind: "comment" as const,
      id: c.id,
      author: c.author?.full_name ?? c.author?.email ?? "Usuario eliminado",
      at: c.created_at,
      atLabel: formatDateTime(c.created_at),
      body: c.body,
    })),
    ...(history ?? []).map((h) => {
      const actor = (Array.isArray(h.actor) ? h.actor[0] : h.actor) as { full_name: string | null; email: string } | null;
      const isAssignee = h.field !== "status" && h.field !== "project";
      return {
        kind: "history" as const,
        id: h.id,
        author: actor?.full_name ?? actor?.email ?? "Usuario eliminado",
        at: h.created_at,
        atLabel: formatDateTime(h.created_at),
        field: h.field,
        from: isAssignee ? personName(h.old_value) : h.old_value,
        to: isAssignee ? personName(h.new_value) : h.new_value,
      };
    }),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const perms = ticketPermissions(profile, t);
  const reporterName = t.reporter?.full_name ?? t.reporter?.email ?? null;
  const code = `${t.project?.code}-${t.ticket_number}`;

  return (
    <TicketView
      ticket={{
        id: t.id,
        code,
        title: t.title,
        description: t.description,
        stepsToReproduce: t.steps_to_reproduce ?? "",
        environment: t.environment ?? "",
        status: t.status,
        priority: t.priority,
        severity: t.severity,
        targetRole: t.target_role,
        assigneeId: t.assignee_id,
        project: { id: t.project.id, code: t.project.code, name: t.project.name },
        testCase: t.test_case ? { id: t.test_case.id, title: t.test_case.title } : null,
      }}
      meta={[
        {
          label: "Reportado por",
          value: reporterName ? (
            <span className="flex items-center gap-1.5">
              <Avatar name={reporterName} size="sm" />
              <span className="truncate">{reporterName}</span>
            </span>
          ) : (
            <span className="italic text-slate-400">Bot / sin registro</span>
          ),
        },
        { label: "Creado", value: <time dateTime={t.created_at} title={formatDateTime(t.created_at)}>{formatDateTime(t.created_at)}</time> },
        { label: "Actualizado", value: <time dateTime={t.updated_at} title={formatDateTime(t.updated_at)}>{timeAgo(t.updated_at)}</time> },
      ]}
      permissions={{
        nextStatuses: perms.nextStatuses,
        canChangeAssignee: perms.canChangeAssignee,
        canEditDetails: perms.canEditDetails,
        canDelete: profile.role === "admin",
        lockReason: perms.lockReason,
      }}
      people={peopleList.map((p) => ({ id: p.id, name: p.full_name ?? p.email, role: p.role as UserRole }))}
      projects={movableProjects ?? []}
      attachments={(attachments ?? []).map((a) => ({
        id: a.id,
        url: a.url,
        uploadedBy: personName(a.uploaded_by),
        createdAt: formatDateTime(a.created_at),
      }))}
      activity={activity}
      me={profile.full_name ?? profile.email}
    />
  );
}
