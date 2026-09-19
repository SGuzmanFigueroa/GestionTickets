import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { StatusBadge, SeverityBadge, PriorityBadge, ProjectBadge } from "@/components/Badge";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import PageHeader from "@/components/ui/PageHeader";
import MetricCard from "@/components/ui/MetricCard";
import Leaderboard, { type LeaderboardEntry } from "@/components/ui/Leaderboard";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";
import Avatar from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { daysSince } from "@/lib/format";
import { ROLE_LABELS, type UserRole } from "@/lib/types";
import { PlusIcon, TicketIcon } from "@/components/ui/icons";
import {
  PRIORITY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  TICKET_STATUSES,
  type TicketWithRelations,
} from "@/lib/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; status?: string; mine?: string }>;
}) {
  const { project, status, mine } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: projects }, { data: allTickets }, { data: people }, { data: resolutions }] = await Promise.all([
    supabase.from("projects").select("id, name, slug").order("name"),
    supabase.from("tickets").select("id, title, ticket_number, status, severity, reporter_id, assignee_id, created_at, updated_at, project:projects(code)"),
    supabase.from("profiles").select("id, full_name, email, role"),
    supabase
      .from("ticket_history")
      .select("ticket_id, actor_id, created_at")
      .eq("field", "status")
      .in("new_value", ["resolved", "closed"]),
  ]);

  const nameOf = new Map((people ?? []).map((p) => [p.id, p.full_name ?? p.email]));
  const top = (counts: Map<string, number>): LeaderboardEntry[] =>
    [...counts.entries()]
      .filter(([id]) => nameOf.has(id))
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
  // Quien resuelve = quien cambió el estado a Resuelto/Cerrado (un ticket cuenta una vez por persona).
  const resolvedPairs = new Set((resolutions ?? []).map((r) => `${r.actor_id}|${r.ticket_id}`));
  const resolved = new Map<string, number>();
  for (const pair of resolvedPairs) {
    const actor = pair.split("|")[0];
    resolved.set(actor, (resolved.get(actor) ?? 0) + 1);
  }

  const stats = {
    total: allTickets?.length ?? 0,
    open: allTickets?.filter((t) => t.status === "open").length ?? 0,
    inProgress: allTickets?.filter((t) => t.status === "in_progress").length ?? 0,
    critical: allTickets?.filter((t) => t.severity === "critical").length ?? 0,
  };

  // ---- Métricas de equipo ----
  const DAY = 24 * 60 * 60 * 1000;
  const isOpenStatus = (st: string) => st !== "resolved" && st !== "closed";
  const openTickets = (allTickets ?? []).filter((t) => isOpenStatus(t.status));

  const unassigned = openTickets
    .filter((t) => !t.assignee_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const stale = openTickets.filter((t) => daysSince(t.updated_at) >= 7);

  // Tiempo promedio de resolución: creación → primera vez que pasó a Resuelto/Cerrado.
  const createdAt = new Map((allTickets ?? []).map((t) => [t.id, t.created_at]));
  const firstResolved = new Map<string, string>();
  for (const r of resolutions ?? []) {
    const prev = firstResolved.get(r.ticket_id);
    if (!prev || r.created_at < prev) firstResolved.set(r.ticket_id, r.created_at);
  }
  const durations = [...firstResolved.entries()]
    .filter(([id]) => createdAt.has(id))
    .map(([id, at]) => (new Date(at).getTime() - new Date(createdAt.get(id)!).getTime()) / DAY);
  const avgResolution = durations.length
    ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)
    : "—";

  // Personas del equipo (sin admin) sin tickets pendientes asignados.
  const idle = (people ?? [])
    .filter((p) => p.role !== "admin" && !pending.has(p.id))
    .sort((a, b) => (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email));
  const neverReported = (people ?? []).filter((p) => p.role === "qa" && !reported.has(p.id));

  let query = supabase
    .from("tickets")
    .select(
      "*, project:projects(id, name, slug, code), reporter:profiles!tickets_reporter_id_fkey(id, full_name, email), assignee:profiles!tickets_assignee_id_fkey(id, full_name, email)",
    )
    .order("created_at", { ascending: false });

  if (project) query = query.eq("project_id", project);
  if (status) query = query.eq("status", status);
  if (mine === "1") query = query.eq("assignee_id", profile.id);

  const { data: tickets, error } = await query;
  const hasFilters = Boolean(project || status || mine);
  const rows = (tickets as TicketWithRelations[] | null) ?? [];

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Gestiona y da seguimiento a los bugs reportados en todas las apps."
        actions={
          <Button href="/tickets/new" variant="primary">
            <PlusIcon /> Nuevo ticket
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Total" value={stats.total} icon={<TicketIcon />} />
        <MetricCard label="Abiertos" value={stats.open} tone="primary" />
        <MetricCard label="En progreso" value={stats.inProgress} tone="warning" />
        <MetricCard label="Críticos" value={stats.critical} tone="danger" />
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <Leaderboard
          title="Quién reporta más"
          subtitle="Tickets creados"
          entries={top(reported)}
          unit="tickets"
        />
        <Leaderboard
          title="Quién resuelve más"
          subtitle="Tickets pasados a Resuelto o Cerrado"
          entries={top(resolved)}
          unit="resueltos"
        />
        <Leaderboard
          title="Más carga pendiente"
          subtitle="Tickets asignados aún sin resolver"
          entries={top(pending)}
          unit="pendientes"
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Sin asignar" value={unassigned.length} tone={unassigned.length ? "warning" : "default"} />
        <MetricCard label="Estancados (+7 días)" value={stale.length} tone={stale.length ? "danger" : "default"} />
        <MetricCard label="Resolución promedio" value={avgResolution === "—" ? "—" : `${avgResolution} días`} />
        <MetricCard label="Personas sin carga" value={idle.length} tone="primary" />
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold text-nexa-navy dark:text-white">Tickets sin asignar</p>
          <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">Los que llevan más días esperando, primero</p>
          {unassigned.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">Todo está asignado.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {unassigned.slice(0, 6).map((t) => {
                const days = daysSince(t.created_at);
                return (
                  <li key={t.id}>
                    <Link
                      href={`/tickets/${t.id}`}
                      className="flex items-center gap-2 py-2 text-sm hover:text-nexa-blue"
                    >
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                        {(t.project as unknown as { code: string } | null)?.code}-{t.ticket_number}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{t.title}</span>
                      <span
                        className={`shrink-0 text-xs font-medium ${days >= 7 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
                      >
                        {days === 0 ? "hoy" : `${days} d`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold text-nexa-navy dark:text-white">Personas sin tickets pendientes</p>
          <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">Disponibles para recibir trabajo (sin contar admins)</p>
          {idle.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">Todos tienen trabajo asignado.</p>
          ) : (
            <ul className="space-y-2">
              {idle.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <Avatar name={p.full_name ?? p.email} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{p.full_name ?? p.email}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{ROLE_LABELS[p.role as UserRole]}</span>
                </li>
              ))}
            </ul>
          )}
          {neverReported.length > 0 && (
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              QA que aún no han reportado ningún ticket:{" "}
              {neverReported.map((p) => p.full_name ?? p.email).join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <AutoSubmitForm className="flex flex-wrap gap-2 text-sm" action="/dashboard">
          <select
            name="project"
            defaultValue={project ?? ""}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 outline-none focus:border-nexa-blue dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Todas las apps</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 outline-none focus:border-nexa-blue dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Todos los estados</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            <input type="checkbox" name="mine" value="1" defaultChecked={mine === "1"} />
            Asignados a mí
          </label>

          {hasFilters && (
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Limpiar filtros
            </Link>
          )}
        </AutoSubmitForm>

        <SearchInput
          placeholder="Buscar por código o título..."
          scopeSelector="#tickets-results"
          noResultsSelector="#tickets-no-local-matches"
          className="sm:w-64"
        />
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Error cargando tickets: {error.message}
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="No hay tickets"
          description={
            hasFilters
              ? "No hay tickets que coincidan con estos filtros."
              : "Todavía no se han reportado tickets para este proyecto."
          }
          action={
            !hasFilters && (
              <Button href="/tickets/new" variant="primary" size="sm">
                <PlusIcon /> Crear ticket
              </Button>
            )
          }
        />
      ) : (
        <div id="tickets-results">
          {/* Tabla — desktop / tablet */}
          <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-nexa-light/50 text-xs uppercase tracking-wide text-nexa-navy/70 dark:border-slate-700 dark:bg-slate-700/40 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Código</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Ticket</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Proyecto</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Estado</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Severidad</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Prioridad</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Asignado</th>
                  </tr>
                </thead>
                <tbody id="tickets-table-body" className="divide-y divide-slate-100 dark:divide-slate-700">
                  {rows.map((t) => {
                    const code = `${t.project?.code}-${t.ticket_number}`;
                    const assigneeName = t.assignee?.full_name ?? t.assignee?.email ?? null;
                    return (
                      <tr
                        key={t.id}
                        data-search-row
                        data-search-text={`${code} ${t.title}`}
                        className="h-14 transition-colors hover:bg-nexa-light/30 dark:hover:bg-slate-700/40"
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/tickets/${t.id}`}
                            className="font-mono text-xs text-slate-400 hover:text-nexa-blue hover:underline dark:text-slate-500"
                          >
                            {code}
                          </Link>
                        </td>
                        <td className="max-w-[280px] px-4 py-2.5">
                          <Link
                            href={`/tickets/${t.id}`}
                            className="block truncate font-medium text-slate-800 hover:text-nexa-blue hover:underline dark:text-slate-100"
                          >
                            {t.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <ProjectBadge>{t.project?.name}</ProjectBadge>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={t.status} label={STATUS_LABELS[t.status]} />
                        </td>
                        <td className="px-4 py-2.5">
                          <SeverityBadge severity={t.severity} label={SEVERITY_LABELS[t.severity]} />
                        </td>
                        <td className="px-4 py-2.5">
                          <PriorityBadge priority={t.priority} label={PRIORITY_LABELS[t.priority]} />
                        </td>
                        <td className="px-4 py-2.5">
                          {assigneeName ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={assigneeName} size="sm" />
                              <span className="truncate text-slate-600 dark:text-slate-300">{assigneeName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">Sin asignar</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p id="tickets-no-local-matches" className="hidden px-4 py-8 text-center text-sm text-slate-400">
              Ningún ticket visible coincide con tu búsqueda.
            </p>
          </div>

          {/* Cards — mobile */}
          <div className="space-y-3 sm:hidden">
            {rows.map((t) => {
              const code = `${t.project?.code}-${t.ticket_number}`;
              const assigneeName = t.assignee?.full_name ?? t.assignee?.email ?? null;
              return (
                <Link
                  key={t.id}
                  href={`/tickets/${t.id}`}
                  data-search-row
                  data-search-text={`${code} ${t.title}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{code}</span>
                    <StatusBadge status={t.status} label={STATUS_LABELS[t.status]} />
                  </div>
                  <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">{t.title}</p>
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <ProjectBadge>{t.project?.name}</ProjectBadge>
                    <SeverityBadge severity={t.severity} label={SEVERITY_LABELS[t.severity]} />
                    <PriorityBadge priority={t.priority} label={PRIORITY_LABELS[t.priority]} />
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {assigneeName ? (
                      <>
                        <Avatar name={assigneeName} size="sm" />
                        {assigneeName}
                      </>
                    ) : (
                      "Sin asignar"
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
