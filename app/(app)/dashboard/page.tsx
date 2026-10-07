import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import MetricCard from "@/components/ui/MetricCard";
import Leaderboard, { type LeaderboardEntry } from "@/components/ui/Leaderboard";
import Avatar from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FILTER_SELECT } from "@/components/ui/styles";
import TicketTable, { type TicketRow } from "@/components/tickets/TicketTable";
import { daysSince, formatDateTime, timeAgo } from "@/lib/format";
import { ROLE_LABELS, type UserRole } from "@/lib/types";
import { PlusIcon } from "@/components/ui/icons";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketSeverity,
  type TicketStatus,
  type TicketWithRelations,
} from "@/lib/types";
import TeamMetrics, { type MetricPerson, type MetricTicket, type ResolutionStats } from "./TeamMetrics";

// Equipos por los que se puede filtrar el dashboard (todos los roles menos admin).
const TEAMS: UserRole[] = ["qa", "backend", "frontend", "developer", "marketing", "lider"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    project?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    mine?: string;
    team?: string;
    q?: string;
  }>;
}) {
  const { project, status, priority, assignee, mine, team: rawTeam, q } = await searchParams;
  const teamFilter = TEAMS.includes(rawTeam as UserRole) ? (rawTeam as UserRole) : null;
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: projects }, { data: allTickets }, { data: people }, { data: resolutions }, { data: inactiveIds }, { data: botLoad }] = await Promise.all([
    supabase.from("projects").select("id, name, slug").order("name"),
    supabase.from("tickets").select("id, title, ticket_number, status, severity, target_role, reporter_id, assignee_id, created_at, updated_at, project:projects(code)"),
    supabase.from("profiles").select("id, full_name, email, role, discord_id"),
    supabase
      .from("ticket_history")
      .select("ticket_id, actor_id, created_at")
      .eq("field", "status")
      .in("new_value", ["resolved", "closed"]),
    // Pausados/retirados en Equipo Nexa: no cuentan como disponibles.
    supabase.rpc("inactive_profile_ids"),
    // Tareas abiertas del bot de Discord sin ticket vinculado (las publica el bot cada 2 min).
    supabase.from("bot_task_load").select("discord_id, open_tasks"),
  ]);
  const inactive = new Set<string>((inactiveIds as string[] | null) ?? []);
  const profileByDiscord = new Map(
    (people ?? []).filter((p) => p.discord_id).map((p) => [String(p.discord_id), p.id]),
  );

  const nameOf = new Map((people ?? []).map((p) => [p.id, p.full_name ?? p.email]));
  const roleOf = new Map((people ?? []).map((p) => [p.id, p.role as UserRole]));

  // Filtro por equipo: una persona es del equipo por su rol; un ticket lo es si
  // va dirigido a ese rol o si su responsable es de ese rol.
  const personInTeam = (id: string | null) => !teamFilter || (id !== null && roleOf.get(id) === teamFilter);
  const ticketInTeam = (t: { target_role: string | null; assignee_id: string | null }) =>
    !teamFilter || t.target_role === teamFilter || (t.assignee_id !== null && roleOf.get(t.assignee_id) === teamFilter);
  const teamTickets = (allTickets ?? []).filter(ticketInTeam);

  const top = (counts: Map<string, number>): LeaderboardEntry[] =>
    [...counts.entries()]
      .filter(([id]) => nameOf.has(id) && personInTeam(id))
      .map(([id, count]) => ({ name: nameOf.get(id)!, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 5);

  const reported = new Map<string, number>();
  const pending = new Map<string, number>();
  for (const t of allTickets ?? []) {
    if (t.reporter_id) reported.set(t.reporter_id, (reported.get(t.reporter_id) ?? 0) + 1);
    if (t.assignee_id && t.status !== "resolved" && t.status !== "closed") {
      pending.set(t.assignee_id, (pending.get(t.assignee_id) ?? 0) + 1);
    }
  }
  // Las tareas del bot también son carga: quien tiene tareas abiertas no está "sin carga".
  for (const row of botLoad ?? []) {
    const profileId = profileByDiscord.get(row.discord_id);
    if (profileId && row.open_tasks > 0) pending.set(profileId, (pending.get(profileId) ?? 0) + row.open_tasks);
  }
  // Quien resuelve = quien cambió el estado a Resuelto/Cerrado (un ticket cuenta una vez por persona).
  const resolvedPairs = new Set((resolutions ?? []).map((r) => `${r.actor_id}|${r.ticket_id}`));
  const resolved = new Map<string, number>();
  for (const pair of resolvedPairs) {
    const actor = pair.split("|")[0];
    resolved.set(actor, (resolved.get(actor) ?? 0) + 1);
  }

  const stats = {
    total: teamTickets.length,
    open: teamTickets.filter((t) => t.status === "open" || t.status === "reopened").length,
    inProgress: teamTickets.filter((t) => t.status === "in_progress").length,
    critical: teamTickets.filter((t) => t.severity === "critical" && t.status !== "resolved" && t.status !== "closed").length,
  };

  // ---- Métricas de equipo ----
  const DAY = 24 * 60 * 60 * 1000;
  const isOpenStatus = (st: string) => st !== "resolved" && st !== "closed";
  const openTickets = teamTickets.filter((t) => isOpenStatus(t.status));

  const unassigned = openTickets
    .filter((t) => !t.assignee_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const stale = openTickets.filter((t) => daysSince(t.updated_at) >= 7);

  // Tiempo promedio de resolución: creación → primera vez que pasó a Resuelto/Cerrado.
  const ticketById = new Map((allTickets ?? []).map((t) => [t.id, t]));
  const codeOf = (t: { ticket_number: number; project: unknown }) =>
    `${(t.project as { code: string } | null)?.code}-${t.ticket_number}`;
  const firstResolved = new Map<string, { at: string; actor: string }>();
  for (const r of resolutions ?? []) {
    const prev = firstResolved.get(r.ticket_id);
    if (!prev || r.created_at < prev.at) firstResolved.set(r.ticket_id, { at: r.created_at, actor: r.actor_id });
  }
  const resolvedDurations = [...firstResolved.entries()]
    .filter(([id]) => ticketById.has(id) && ticketInTeam(ticketById.get(id)!))
    .map(([id, { at, actor }]) => {
      const t = ticketById.get(id)!;
      return { t, actor, days: (new Date(at).getTime() - new Date(t.created_at).getTime()) / DAY };
    });
  const avgResolution = resolvedDurations.length
    ? (resolvedDurations.reduce((a, d) => a + d.days, 0) / resolvedDurations.length).toFixed(1)
    : "—";

  const groupAvg = <K,>(items: typeof resolvedDurations, keyOf: (d: (typeof resolvedDurations)[number]) => K) => {
    const acc = new Map<K, { total: number; count: number }>();
    for (const d of items) {
      const k = keyOf(d);
      const cur = acc.get(k) ?? { total: 0, count: 0 };
      acc.set(k, { total: cur.total + d.days, count: cur.count + 1 });
    }
    return [...acc.entries()].map(([key, { total, count }]) => ({ key, count, avg: total / count }));
  };

  const resolution: ResolutionStats = {
    average: avgResolution,
    count: resolvedDurations.length,
    bySeverity: groupAvg(resolvedDurations, (d) => d.t.severity as TicketSeverity).map(({ key, count, avg }) => ({
      severity: key,
      count,
      avg,
    })),
    byPerson: groupAvg(
      resolvedDurations.filter((d) => nameOf.has(d.actor)),
      (d) => d.actor,
    )
      .map(({ key, count, avg }) => ({ name: nameOf.get(key)!, count, avg }))
      .sort((a, b) => a.avg - b.avg),
    slowest: [...resolvedDurations]
      .sort((a, b) => b.days - a.days)
      .slice(0, 5)
      .map((d) => ({ id: d.t.id, code: codeOf(d.t), title: d.t.title, days: d.days, resolver: nameOf.get(d.actor) ?? null })),
  };

  // Seguimiento de los estancados: último cambio de historial o comentario de cada uno.
  const staleIds = stale.map((t) => t.id);
  const [{ data: staleHistory }, { data: staleComments }] = staleIds.length
    ? await Promise.all([
        supabase
          .from("ticket_history")
          .select("ticket_id, actor_id, field, new_value, created_at")
          .in("ticket_id", staleIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("ticket_comments")
          .select("ticket_id, author_id, body, created_at")
          .in("ticket_id", staleIds)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const lastActivity = new Map<string, NonNullable<MetricTicket["lastActivity"]> & { at: string }>();
  const pushActivity = (ticketId: string, at: string, actorId: string, text: string) => {
    const prev = lastActivity.get(ticketId);
    if (prev && prev.at >= at) return;
    lastActivity.set(ticketId, { at, actor: nameOf.get(actorId) ?? "Alguien", text, days: daysSince(at) });
  };
  for (const h of staleHistory ?? []) {
    const text =
      h.field === "status"
        ? `cambió el estado a "${STATUS_LABELS[h.new_value as TicketStatus] ?? h.new_value}"`
        : h.field === "project"
          ? `movió el ticket a ${h.new_value ?? "otro proyecto"}`
          : h.new_value
          ? `asignó el ticket a ${nameOf.get(h.new_value) ?? "otra persona"}`
          : "quitó la persona asignada";
    pushActivity(h.ticket_id, h.created_at, h.actor_id, text);
  }
  for (const c of staleComments ?? []) {
    const body = c.body.length > 120 ? `${c.body.slice(0, 120)}…` : c.body;
    pushActivity(c.ticket_id, c.created_at, c.author_id, `comentó: “${body}”`);
  }

  const toMetricTicket = (t: NonNullable<typeof allTickets>[number]): MetricTicket => {
    const activity = lastActivity.get(t.id);
    return {
      id: t.id,
      code: codeOf(t),
      title: t.title,
      status: t.status as TicketStatus,
      severity: t.severity as TicketSeverity,
      targetRole: (t.target_role as UserRole | null) ?? null,
      assigneeName: t.assignee_id ? (nameOf.get(t.assignee_id) ?? null) : null,
      assigneeRole: t.assignee_id ? (roleOf.get(t.assignee_id) ?? null) : null,
      createdDays: daysSince(t.created_at),
      updatedDays: daysSince(t.updated_at),
      lastActivity: activity ? { actor: activity.actor, text: activity.text, days: activity.days } : null,
    };
  };

  // Personas activas del equipo (sin admin ni pausados/retirados) con su carga pendiente.
  const team: MetricPerson[] = (people ?? [])
    .filter((p) => p.role !== "admin" && !inactive.has(p.id) && personInTeam(p.id))
    .map((p) => ({
      id: p.id,
      name: p.full_name ?? p.email,
      role: p.role as UserRole,
      pending: pending.get(p.id) ?? 0,
      resolved: resolved.get(p.id) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const idle = team.filter((p) => p.pending === 0);
  const neverReported = (people ?? []).filter(
    (p) => p.role === "qa" && !reported.has(p.id) && !inactive.has(p.id) && personInTeam(p.id),
  );


  // ---- Lista de tickets (filtros del servidor; búsqueda y orden en el cliente) ----
  let query = supabase
    .from("tickets")
    .select(
      "*, project:projects(id, name, slug, code), reporter:profiles!tickets_reporter_id_fkey(id, full_name, email), assignee:profiles!tickets_assignee_id_fkey(id, full_name, email)",
    )
    .order("updated_at", { ascending: false });

  if (project) query = query.eq("project_id", project);
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (assignee === "none") query = query.is("assignee_id", null);
  else if (assignee) query = query.eq("assignee_id", assignee);
  if (mine === "1") query = query.eq("assignee_id", profile.id);

  const { data: tickets, error } = await query;
  const hasFilters = Boolean(project || status || priority || assignee || mine || teamFilter);
  const rows: TicketRow[] = ((tickets as TicketWithRelations[] | null) ?? []).filter(ticketInTeam).map((t) => ({
    id: t.id,
    code: `${t.project?.code}-${t.ticket_number}`,
    number: t.ticket_number,
    title: t.title,
    status: t.status,
    priority: t.priority,
    severity: t.severity,
    projectName: t.project?.name ?? "",
    assigneeName: t.assignee?.full_name ?? t.assignee?.email ?? null,
    reporterName: t.reporter?.full_name ?? t.reporter?.email ?? null,
    updatedAt: t.updated_at,
    updatedLabel: timeAgo(t.updated_at),
    updatedTitle: formatDateTime(t.updated_at),
  }));

  const assignablePeople = (people ?? [])
    .filter((p) => !inactive.has(p.id))
    .map((p) => ({ id: p.id, name: p.full_name ?? p.email }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-nexa-navy dark:text-white">Tickets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Encuentra, filtra y da seguimiento a los bugs de todas las apps.</p>
        </div>
        <Button href="/tickets/new" variant="primary">
          <PlusIcon /> Crear ticket
        </Button>
      </div>

      {/* Filtros (se aplican al instante) */}
      <AutoSubmitForm className="flex flex-wrap items-center gap-2 text-sm" action="/dashboard">
        <label className="sr-only" htmlFor="f-status">Estado</label>
        <select id="f-status" name="status" defaultValue={status ?? ""} className={FILTER_SELECT}>
          <option value="">Estado: todos</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-priority">Prioridad</label>
        <select id="f-priority" name="priority" defaultValue={priority ?? ""} className={FILTER_SELECT}>
          <option value="">Prioridad: todas</option>
          {TICKET_PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-project">Proyecto</label>
        <select id="f-project" name="project" defaultValue={project ?? ""} className={FILTER_SELECT}>
          <option value="">Proyecto: todos</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-assignee">Asignado a</label>
        <select id="f-assignee" name="assignee" defaultValue={assignee ?? ""} className={`${FILTER_SELECT} max-w-52`}>
          <option value="">Asignado: todos</option>
          <option value="none">Sin asignar</option>
          {assignablePeople.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-team">Equipo</label>
        <select id="f-team" name="team" defaultValue={teamFilter ?? ""} className={FILTER_SELECT}>
          <option value="">Equipo: todos</option>
          {TEAMS.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
          <input type="checkbox" name="mine" value="1" defaultChecked={mine === "1"} className="accent-nexa-blue" />
          Asignados a mí
        </label>
        {hasFilters && (
          <Link
            href="/dashboard"
            className="inline-flex h-8 items-center rounded-md px-2.5 text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Limpiar filtros
          </Link>
        )}
      </AutoSubmitForm>

      {/* Resumen compacto: no compite con la lista */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        <MetricCard label="Total" value={stats.total} />
        <MetricCard label="Por hacer" value={stats.open} tone="primary" />
        <MetricCard label="En progreso" value={stats.inProgress} tone="warning" />
        <MetricCard label="Críticos abiertos" value={stats.critical} tone={stats.critical ? "danger" : "default"} />
        <TeamMetrics
          unassigned={unassigned.map(toMetricTicket)}
          stale={stale.sort((a, b) => a.updated_at.localeCompare(b.updated_at)).map(toMetricTicket)}
          resolution={resolution}
          people={team}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Error cargando tickets: {error.message}
        </p>
      )}

      <TicketTable
        rows={rows}
        initialQuery={q ?? ""}
        filtered={hasFilters}
        emptyAction={
          <Button href="/tickets/new" variant="primary" size="sm">
            <PlusIcon /> Crear ticket
          </Button>
        }
      />

      {/* Resumen del equipo: secundario y colapsable */}
      <details className="group rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-nexa-navy outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:text-white [&::-webkit-details-marker]:hidden">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-90">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Resumen del equipo
          <span className="hidden font-normal text-slate-400 sm:inline">· rankings, sin asignar y personas disponibles</span>
        </summary>

        <div className="space-y-3 border-t border-slate-100 p-3 dark:border-slate-700">
          <div className="grid gap-3 md:grid-cols-3">
            <Leaderboard title="Quién reporta más" subtitle="Tickets creados" entries={top(reported)} unit="tickets" />
            <Leaderboard title="Quién resuelve más" subtitle="Tickets pasados a Certificado o Cerrado" entries={top(resolved)} unit="resueltos" />
            <Leaderboard title="Más carga pendiente" subtitle="Tickets sin certificar y tareas abiertas del bot" entries={top(pending)} unit="pendientes" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-sm font-semibold text-nexa-navy dark:text-white">Tickets sin asignar</p>
              <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">Los que llevan más días esperando, primero</p>
              {unassigned.length === 0 ? (
                <p className="py-3 text-center text-sm text-slate-400 dark:text-slate-500">Todo está asignado.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {unassigned.slice(0, 6).map((t) => {
                    const days = daysSince(t.created_at);
                    return (
                      <li key={t.id}>
                        <Link href={`/tickets/${t.id}`} className="flex items-center gap-2 py-1.5 text-sm hover:text-nexa-blue">
                          <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                            {(t.project as unknown as { code: string } | null)?.code}-{t.ticket_number}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{t.title}</span>
                          <span className={`shrink-0 text-xs font-medium ${days >= 7 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
                            {days === 0 ? "hoy" : `${days} d`}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-sm font-semibold text-nexa-navy dark:text-white">Personas sin tickets pendientes</p>
              <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">Disponibles para recibir trabajo (sin contar admins ni pausados)</p>
              {idle.length === 0 ? (
                <p className="py-3 text-center text-sm text-slate-400 dark:text-slate-500">Todos tienen trabajo asignado.</p>
              ) : (
                <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {idle.slice(0, 10).map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      <Avatar name={p.name} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{p.name}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{ROLE_LABELS[p.role]}</span>
                    </li>
                  ))}
                </ul>
              )}
              {neverReported.length > 0 && (
                <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  QA que aún no han reportado ningún ticket: {neverReported.map((p) => p.full_name ?? p.email).join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
