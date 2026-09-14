import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { StatusBadge, SeverityBadge, PriorityBadge } from "@/components/Badge";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import {
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

  const [{ data: projects }, { data: allTickets }] = await Promise.all([
    supabase.from("projects").select("id, name, slug").order("name"),
    supabase.from("tickets").select("status, severity"),
  ]);

  const stats = {
    total: allTickets?.length ?? 0,
    open: allTickets?.filter((t) => t.status === "open").length ?? 0,
    inProgress: allTickets?.filter((t) => t.status === "in_progress").length ?? 0,
    critical: allTickets?.filter((t) => t.severity === "critical").length ?? 0,
  };

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

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-nexa-navy dark:text-white">Tickets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Bugs reportados en todas las apps</p>
        </div>
        <Link
          href="/tickets/new"
          className="self-start rounded-md bg-nexa-blue px-3 py-2 text-sm font-medium text-white shadow-sm shadow-nexa-blue/30 transition-colors hover:bg-nexa-navy sm:self-auto"
        >
          + Nuevo ticket
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-semibold text-nexa-navy dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-nexa-light p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-nexa-blue/70">Abiertos</p>
          <p className="mt-1 text-2xl font-semibold text-nexa-blue">{stats.open}</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600/80">
            En progreso
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{stats.inProgress}</p>
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-red-600/80">Críticos</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{stats.critical}</p>
        </div>
      </div>

      <AutoSubmitForm className="mb-5 flex flex-wrap gap-2 text-sm" action="/dashboard">
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

        <button
          type="submit"
          className="rounded-md bg-nexa-navy px-3 py-1.5 font-medium text-white hover:bg-slate-900"
        >
          Filtrar
        </button>
        {(project || status || mine) && (
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Limpiar
          </Link>
        )}
      </AutoSubmitForm>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          Error cargando tickets: {error.message}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-nexa-light/50 text-xs uppercase tracking-wide text-nexa-navy/70 dark:border-slate-700 dark:bg-slate-700/40 dark:text-slate-300">
            <tr>
              <th className="px-4 py-2 font-medium">Código</th>
              <th className="px-4 py-2 font-medium">Título</th>
              <th className="px-4 py-2 font-medium">App</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Severidad</th>
              <th className="px-4 py-2 font-medium">Prioridad</th>
              <th className="px-4 py-2 font-medium">Asignado a</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {(tickets as TicketWithRelations[] | null)?.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-nexa-light/30 dark:hover:bg-slate-700/40">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/tickets/${t.id}`}
                    className="font-mono text-xs text-slate-400 hover:text-nexa-blue hover:underline dark:text-slate-500"
                  >
                    {t.project?.code}-{t.ticket_number}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/tickets/${t.id}`}
                    className="font-medium text-slate-800 hover:text-nexa-blue hover:underline dark:text-slate-100"
                  >
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{t.project?.name}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={t.status} label={STATUS_LABELS[t.status]} />
                </td>
                <td className="px-4 py-2.5">
                  <SeverityBadge severity={t.severity} label={t.severity} />
                </td>
                <td className="px-4 py-2.5">
                  <PriorityBadge priority={t.priority} label={t.priority} />
                </td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                  {t.assignee?.full_name ?? t.assignee?.email ?? "Sin asignar"}
                </td>
              </tr>
            ))}
            {tickets?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  No hay tickets con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
