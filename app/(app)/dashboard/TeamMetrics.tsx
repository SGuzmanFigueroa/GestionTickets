"use client";

import { useState } from "react";
import Link from "next/link";
import MetricCard from "@/components/ui/MetricCard";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import { StatusBadge, SeverityBadge } from "@/components/Badge";
import {
  ROLE_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  TICKET_SEVERITIES,
  USER_ROLES,
  type TicketSeverity,
  type TicketStatus,
  type UserRole,
} from "@/lib/types";

export interface MetricTicket {
  id: string;
  code: string;
  title: string;
  status: TicketStatus;
  severity: TicketSeverity;
  targetRole: UserRole | null;
  assigneeName: string | null;
  assigneeRole: UserRole | null;
  createdDays: number;
  updatedDays: number;
  /** Último movimiento registrado (cambio de estado/asignado o comentario). */
  lastActivity: { actor: string; text: string; days: number } | null;
}

export interface MetricPerson {
  id: string;
  name: string;
  role: UserRole;
  pending: number;
  resolved: number;
}

export interface ResolutionStats {
  average: string;
  count: number;
  byPerson: { name: string; count: number; avg: number }[];
  bySeverity: { severity: TicketSeverity; count: number; avg: number }[];
  slowest: { id: string; code: string; title: string; days: number; resolver: string | null }[];
}

type Panel = "unassigned" | "stale" | "resolution" | "idle" | null;

const days = (n: number) => (n === 0 ? "hoy" : n === 1 ? "1 día" : `${n} días`);
const avgDays = (n: number) => `${n.toFixed(1)} días`;

export default function TeamMetrics({
  unassigned,
  stale,
  resolution,
  people,
}: {
  unassigned: MetricTicket[];
  stale: MetricTicket[];
  resolution: ResolutionStats;
  people: MetricPerson[];
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const close = () => setPanel(null);
  const idleCount = people.filter((p) => p.pending === 0).length;

  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Sin asignar"
          value={unassigned.length}
          tone={unassigned.length ? "warning" : "default"}
          onClick={() => setPanel("unassigned")}
        />
        <MetricCard
          label="Estancados (+7 días)"
          value={stale.length}
          tone={stale.length ? "danger" : "default"}
          onClick={() => setPanel("stale")}
        />
        <MetricCard
          label="Resolución promedio"
          value={resolution.average === "—" ? "—" : `${resolution.average} días`}
          onClick={() => setPanel("resolution")}
        />
        <MetricCard label="Personas sin carga" value={idleCount} tone="primary" onClick={() => setPanel("idle")} />
      </div>

      <Modal
        open={panel === "unassigned"}
        onClose={close}
        size="lg"
        title={`Tickets sin asignar (${unassigned.length})`}
        description="Tickets abiertos que nadie ha tomado, del que más espera al más reciente."
      >
        <UnassignedPanel tickets={unassigned} />
      </Modal>

      <Modal
        open={panel === "stale"}
        onClose={close}
        size="lg"
        title={`Tickets estancados (${stale.length})`}
        description="Tickets abiertos sin movimiento hace 7 días o más, con su último seguimiento."
      >
        <StalePanel tickets={stale} />
      </Modal>

      <Modal
        open={panel === "resolution"}
        onClose={close}
        size="lg"
        title="Tiempo de resolución"
        description="Desde que se crea el ticket hasta que pasa por primera vez a Resuelto o Cerrado."
      >
        <ResolutionPanel stats={resolution} />
      </Modal>

      <Modal
        open={panel === "idle"}
        onClose={close}
        size="lg"
        title="Carga del equipo por área"
        description="Tickets pendientes por persona, agrupados por rol (sin contar admins)."
      >
        <PeoplePanel people={people} />
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">{children}</p>;
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-nexa-blue bg-nexa-blue text-white"
          : "border-slate-200 text-slate-600 hover:border-nexa-blue hover:text-nexa-blue dark:border-slate-600 dark:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

/** Filtro por área (rol destino del ticket o rol del asignado). */
function useAreaFilter<T>(items: T[], areaOf: (item: T) => UserRole | null) {
  const [area, setArea] = useState<UserRole | "none" | "all">("all");
  const counts = new Map<UserRole | "none", number>();
  for (const it of items) {
    const key = areaOf(it) ?? "none";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const filtered = area === "all" ? items : items.filter((it) => (areaOf(it) ?? "none") === area);

  const chips = counts.size > 1 && (
    <div className="mb-4 flex flex-wrap gap-1.5">
      <Chip active={area === "all"} onClick={() => setArea("all")}>
        Todas ({items.length})
      </Chip>
      {[...USER_ROLES, "none" as const]
        .filter((r) => counts.has(r))
        .map((r) => (
          <Chip key={r} active={area === r} onClick={() => setArea(r)}>
            {r === "none" ? "Sin área" : ROLE_LABELS[r]} ({counts.get(r)})
          </Chip>
        ))}
    </div>
  );

  return { filtered, chips };
}

function TicketHeader({ t }: { t: MetricTicket }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{t.code}</span>
      <Link
        href={`/tickets/${t.id}`}
        className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 hover:text-nexa-blue hover:underline dark:text-slate-100"
      >
        {t.title}
      </Link>
      <StatusBadge status={t.status} label={STATUS_LABELS[t.status]} />
      <SeverityBadge severity={t.severity} label={SEVERITY_LABELS[t.severity]} />
    </div>
  );
}

function UnassignedPanel({ tickets }: { tickets: MetricTicket[] }) {
  const { filtered, chips } = useAreaFilter(tickets, (t) => t.targetRole);
  if (tickets.length === 0) return <Empty>Todo está asignado. 🎉</Empty>;

  return (
    <>
      {chips}
      <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700">
        {filtered.map((t) => (
          <li key={t.id} className="py-3">
            <TicketHeader t={t} />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Esperando hace{" "}
              <span className={t.createdDays >= 7 ? "font-semibold text-red-600 dark:text-red-400" : "font-medium"}>
                {days(t.createdDays)}
              </span>
              {t.targetRole && <> · Para {ROLE_LABELS[t.targetRole]}</>}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

function StalePanel({ tickets }: { tickets: MetricTicket[] }) {
  const { filtered, chips } = useAreaFilter(tickets, (t) => t.assigneeRole ?? t.targetRole);
  if (tickets.length === 0) return <Empty>No hay tickets estancados. Todo se está moviendo.</Empty>;

  // Resumen: cuántos estancados tiene cada responsable.
  const byOwner = new Map<string, number>();
  for (const t of tickets) {
    const owner = t.assigneeName ?? "Sin asignar";
    byOwner.set(owner, (byOwner.get(owner) ?? 0) + 1);
  }
  const owners = [...byOwner.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950/30 dark:text-red-300">
        <span className="font-semibold">Por responsable:</span>{" "}
        {owners.map(([name, n]) => `${name} (${n})`).join(" · ")}
      </div>
      {chips}
      <ul className="max-h-[60vh] space-y-3 overflow-y-auto">
        {filtered.map((t) => (
          <li
            key={t.id}
            className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <TicketHeader t={t} />

            <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
              <div className="flex items-center gap-2">
                {t.assigneeName ? (
                  <>
                    <Avatar name={t.assigneeName} size="sm" />
                    <span className="truncate text-slate-700 dark:text-slate-200">
                      {t.assigneeName}
                      {t.assigneeRole && (
                        <span className="text-slate-400 dark:text-slate-500"> · {ROLE_LABELS[t.assigneeRole]}</span>
                      )}
                    </span>
                  </>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">Sin asignar</span>
                )}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                Sin movimiento: <span className="font-semibold text-red-600 dark:text-red-400">{days(t.updatedDays)}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400">Abierto hace {days(t.createdDays)}</div>
            </div>

            <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <span className="font-medium text-slate-600 dark:text-slate-300">Último seguimiento: </span>
              {t.lastActivity ? (
                <>
                  {t.lastActivity.actor} {t.lastActivity.text}{" "}
                  <span className="text-slate-400 dark:text-slate-500">
                    ({t.lastActivity.days === 0 ? "hoy" : `hace ${days(t.lastActivity.days)}`})
                  </span>
                </>
              ) : (
                <span className="italic">sin cambios ni comentarios desde que se creó.</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Bar({ value, max, tone = "blue" }: { value: number; max: number; tone?: "blue" | "red" }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
      <div
        className={`h-full rounded-full ${tone === "red" ? "bg-red-500" : "bg-gradient-to-r from-nexa-sky to-nexa-blue"}`}
        style={{ width: `${max ? Math.max(4, (value / max) * 100) : 0}%` }}
      />
    </div>
  );
}

function ResolutionPanel({ stats }: { stats: ResolutionStats }) {
  if (stats.count === 0) return <Empty>Todavía no hay tickets resueltos para calcular el promedio.</Empty>;

  const maxSev = Math.max(...stats.bySeverity.map((s) => s.avg), 0);
  const maxPerson = Math.max(...stats.byPerson.map((p) => p.avg), 0);
  const severities = TICKET_SEVERITIES.map((sev) => stats.bySeverity.find((s) => s.severity === sev)).filter(
    (s): s is ResolutionStats["bySeverity"][number] => Boolean(s),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-nexa-light p-3 dark:bg-blue-950/30">
          <p className="text-xs uppercase tracking-wide text-nexa-blue/70">Promedio general</p>
          <p className="text-xl font-semibold text-nexa-blue">{stats.average} días</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/40">
          <p className="text-xs uppercase tracking-wide text-slate-400">Tickets resueltos</p>
          <p className="text-xl font-semibold text-nexa-navy dark:text-white">{stats.count}</p>
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-nexa-navy dark:text-white">Por severidad</h3>
        <ul className="space-y-2">
          {severities.map((s) => (
            <li key={s.severity} className="grid grid-cols-[90px_1fr_110px] items-center gap-3 text-sm">
              <SeverityBadge severity={s.severity} label={SEVERITY_LABELS[s.severity]} />
              <Bar value={s.avg} max={maxSev} tone={s.severity === "critical" ? "red" : "blue"} />
              <span className="text-right text-xs text-slate-500 dark:text-slate-400">
                {avgDays(s.avg)} · {s.count}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-nexa-navy dark:text-white">Por persona que resuelve</h3>
        <ul className="space-y-2">
          {stats.byPerson.map((p) => (
            <li key={p.name} className="flex items-center gap-2.5">
              <Avatar name={p.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-slate-700 dark:text-slate-200">{p.name}</span>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {avgDays(p.avg)} · {p.count} {p.count === 1 ? "ticket" : "tickets"}
                  </span>
                </div>
                <div className="mt-1">
                  <Bar value={p.avg} max={maxPerson} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-nexa-navy dark:text-white">Los que más tardaron</h3>
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {stats.slowest.map((t) => (
            <li key={t.id}>
              <Link href={`/tickets/${t.id}`} className="flex items-center gap-2 py-2 text-sm hover:text-nexa-blue">
                <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{t.code}</span>
                <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{t.title}</span>
                {t.resolver && (
                  <span className="hidden shrink-0 text-xs text-slate-400 sm:inline dark:text-slate-500">{t.resolver}</span>
                )}
                <span className="shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300">{avgDays(t.days)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PeoplePanel({ people }: { people: MetricPerson[] }) {
  const [onlyIdle, setOnlyIdle] = useState(true);
  if (people.length === 0) return <Empty>No hay personas en el equipo todavía.</Empty>;

  const visible = onlyIdle ? people.filter((p) => p.pending === 0) : people;
  const maxPending = Math.max(1, ...people.map((p) => p.pending));
  const roles = USER_ROLES.filter((r) => r !== "admin" && people.some((p) => p.role === r));

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Chip active={onlyIdle} onClick={() => setOnlyIdle(true)}>
          Solo sin carga ({people.filter((p) => p.pending === 0).length})
        </Chip>
        <Chip active={!onlyIdle} onClick={() => setOnlyIdle(false)}>
          Todo el equipo ({people.length})
        </Chip>
      </div>

      <div className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2">
        {roles.map((role) => {
          const members = people.filter((p) => p.role === role);
          const free = members.filter((p) => p.pending === 0).length;
          const shown = visible
            .filter((p) => p.role === role)
            .sort((a, b) => a.pending - b.pending || a.name.localeCompare(b.name));
          const totalPending = members.reduce((acc, p) => acc + p.pending, 0);

          return (
            <section key={role} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-nexa-navy dark:text-white">{ROLE_LABELS[role]}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {free}/{members.length} libres · {totalPending} pendientes
                </span>
              </div>
              {shown.length === 0 ? (
                <p className="py-2 text-xs text-slate-400 dark:text-slate-500">Todos tienen trabajo asignado.</p>
              ) : (
                <ul className="space-y-2">
                  {shown.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      <Avatar name={p.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-slate-700 dark:text-slate-200">{p.name}</span>
                          {p.pending === 0 ? (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Disponible
                            </span>
                          ) : (
                            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                              {p.pending} pendiente{p.pending === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                        {p.pending > 0 && (
                          <div className="mt-1">
                            <Bar value={p.pending} max={maxPending} />
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {p.resolved} resuelto{p.resolved === 1 ? "" : "s"} en total
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
