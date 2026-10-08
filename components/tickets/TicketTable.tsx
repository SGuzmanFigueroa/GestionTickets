"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { PriorityBadge, SeverityBadge, StatusBadge } from "@/components/Badge";
import { SearchIcon } from "@/components/ui/icons";
import {
  PRIORITY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketSeverity,
  type TicketStatus,
} from "@/lib/types";

export interface TicketRow {
  id: string;
  code: string;
  number: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  projectName: string;
  assigneeName: string | null;
  reporterName: string | null;
  updatedAt: string;
  updatedLabel: string;
  updatedTitle: string;
}

type SortKey = "code" | "title" | "status" | "priority" | "severity" | "project" | "assignee" | "reporter" | "updated";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const PAGE = 50;
const DEFAULT_SORT: Sort = { key: "updated", dir: "desc" };
const SORT_KEYS: SortKey[] = ["code", "title", "status", "priority", "severity", "project", "assignee", "reporter", "updated"];

function parseSort(value: string | undefined): Sort {
  const [key, dir] = (value ?? "").split(":");
  return SORT_KEYS.includes(key as SortKey) && (dir === "asc" || dir === "desc")
    ? { key: key as SortKey, dir }
    : DEFAULT_SORT;
}

// Orden "natural" de cada columna (ej. prioridad: urgente primero).
const rank = <T extends string>(list: readonly T[]) => (v: T) => list.indexOf(v);
const statusRank = rank(TICKET_STATUSES);
const priorityRank = rank(TICKET_PRIORITIES);
const severityRank = rank(TICKET_SEVERITIES);

function compare(a: TicketRow, b: TicketRow, key: SortKey): number {
  const text = (x: string | null, y: string | null) => (x ?? "￿").localeCompare(y ?? "￿", "es");
  switch (key) {
    case "code":
      return a.code.split("-")[0].localeCompare(b.code.split("-")[0]) || a.number - b.number;
    case "title":
      return text(a.title, b.title);
    case "status":
      return statusRank(a.status) - statusRank(b.status);
    case "priority":
      return priorityRank(a.priority) - priorityRank(b.priority);
    case "severity":
      return severityRank(a.severity) - severityRank(b.severity);
    case "project":
      return text(a.projectName, b.projectName);
    case "assignee":
      return text(a.assigneeName, b.assigneeName);
    case "reporter":
      return text(a.reporterName, b.reporterName);
    case "updated":
      return a.updatedAt.localeCompare(b.updatedAt);
  }
}

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function Person({ name }: { name: string | null }) {
  return name ? (
    <span className="flex min-w-0 items-center gap-1.5">
      <Avatar name={name} size="sm" />
      <span className="truncate">{name}</span>
    </span>
  ) : (
    <span className="text-slate-400 dark:text-slate-500">Sin asignar</span>
  );
}

function Th({
  k,
  sort,
  onSort,
  className,
  children,
}: {
  k: SortKey;
  sort: Sort;
  onSort: (k: SortKey) => void;
  className: string;
  children: string;
}) {
  const active = sort.key === k;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`whitespace-nowrap px-3 py-2 font-semibold ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 rounded uppercase outline-none hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:hover:text-white ${
          active ? "text-slate-800 dark:text-white" : ""
        }`}
      >
        {children}
        <span aria-hidden="true" className={active ? "opacity-100" : "opacity-0"}>
          {sort.dir === "asc" ? "↑" : "↓"}
        </span>
      </button>
    </th>
  );
}

/** Lista de tickets tipo issue tracker: búsqueda, orden por columna y carga incremental. */
export default function TicketTable({
  rows,
  initialQuery = "",
  initialSort,
  emptyAction,
  filtered,
}: {
  rows: TicketRow[];
  initialQuery?: string;
  /** "clave:asc" | "clave:desc" (viene de ?sort=). */
  initialSort?: string;
  emptyAction?: React.ReactNode;
  /** Hay filtros activos (para el mensaje de vacío). */
  filtered: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<Sort>(() => parseSort(initialSort));
  const [limit, setLimit] = useState(PAGE);

  // Búsqueda y orden viven en la URL (?q=, ?sort=) sin recargar la página, para
  // que FilterMemory los recuerde al volver a la lista.
  function syncUrl(next: { q?: string; sort?: Sort }) {
    const params = new URLSearchParams(window.location.search);
    const q = next.q ?? query;
    const s = next.sort ?? sort;
    if (q.trim()) params.set("q", q);
    else params.delete("q");
    if (s.key !== DEFAULT_SORT.key || s.dir !== DEFAULT_SORT.dir) params.set("sort", `${s.key}:${s.dir}`);
    else params.delete("sort");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }

  const result = useMemo(() => {
    const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
    const matches = words.length
      ? rows.filter((r) => {
          const hay = normalize(`${r.code} ${r.title} ${r.assigneeName ?? ""} ${r.reporterName ?? ""} ${r.projectName}`);
          return words.every((w) => hay.includes(w));
        })
      : rows;
    const sorted = [...matches].sort((a, b) => compare(a, b, sort.key) * (sort.dir === "asc" ? 1 : -1));
    return sorted;
  }, [rows, query, sort]);

  const visible = result.slice(0, limit);

  function toggleSort(key: SortKey) {
    const next: Sort =
      sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "updated" ? "desc" : "asc" };
    setSort(next);
    syncUrl({ sort: next });
  }

  const th = (k: SortKey, label: string, className = "") => (
    <Th k={k} sort={sort} onSort={toggleSort} className={className}>
      {label}
    </Th>
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
              syncUrl({ q: e.target.value });
            }}
            placeholder="Buscar en esta lista…"
            aria-label="Buscar tickets en la lista"
            className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <p className="ml-auto text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          {result.length === rows.length ? `${rows.length} tickets` : `${result.length} de ${rows.length} tickets`}
        </p>
      </div>

      {result.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title={query ? "Ningún ticket coincide con tu búsqueda" : "No hay tickets"}
            description={
              query
                ? "Prueba con otro código, título o nombre."
                : filtered
                  ? "No hay tickets que coincidan con estos filtros."
                  : "Todavía no se han reportado tickets."
            }
            action={!query && !filtered ? emptyAction : undefined}
          />
        </div>
      ) : (
        <>
          {/* Tabla — tablet / escritorio */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] table-fixed text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                <tr>
                  {th("code", "Clave", "w-[88px]")}
                  {th("title", "Título")}
                  {th("status", "Estado", "w-32")}
                  {th("priority", "Prioridad", "w-24")}
                  {th("severity", "Severidad", "w-24")}
                  {th("project", "Proyecto", "w-32")}
                  {th("assignee", "Asignado a", "w-44")}
                  {th("reporter", "Reportado por", "hidden w-40 2xl:table-cell")}
                  {th("updated", "Actualizado", "w-[120px]")}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
                {visible.map((t) => (
                  <tr
                    key={t.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a")) return;
                      router.push(`/tickets/${t.id}`);
                    }}
                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  >
                    <td className="px-3 py-2">
                      <Link href={`/tickets/${t.id}`} className="font-mono text-xs font-medium text-slate-500 hover:text-nexa-blue hover:underline dark:text-slate-400">
                        {t.code}
                      </Link>
                    </td>
                    <td className="max-w-0 px-3 py-2">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="block truncate font-medium text-slate-800 hover:text-nexa-blue hover:underline dark:text-slate-100"
                        title={t.title}
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={t.status} label={STATUS_LABELS[t.status]} />
                    </td>
                    <td className="px-3 py-2">
                      <PriorityBadge priority={t.priority} label={PRIORITY_LABELS[t.priority]} />
                    </td>
                    <td className="px-3 py-2">
                      <SeverityBadge severity={t.severity} label={SEVERITY_LABELS[t.severity]} />
                    </td>
                    <td className="max-w-0 truncate px-3 py-2 text-slate-600 dark:text-slate-300" title={t.projectName}>
                      {t.projectName}
                    </td>
                    <td className="max-w-0 px-3 py-2 text-slate-700 dark:text-slate-200">
                      <Person name={t.assigneeName} />
                    </td>
                    <td className="hidden max-w-0 px-3 py-2 text-slate-600 2xl:table-cell dark:text-slate-300">
                      {t.reporterName ? <Person name={t.reporterName} /> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                      <time dateTime={t.updatedAt} title={t.updatedTitle}>
                        {t.updatedLabel}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lista — móvil */}
          <ul className="divide-y divide-slate-100 md:hidden dark:divide-slate-700">
            {visible.map((t) => (
              <li key={t.id}>
                <Link href={`/tickets/${t.id}`} className="block px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">{t.code}</span>
                    <StatusBadge status={t.status} label={STATUS_LABELS[t.status]} />
                  </div>
                  <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">{t.title}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <PriorityBadge priority={t.priority} label={PRIORITY_LABELS[t.priority]} />
                    <SeverityBadge severity={t.severity} label={SEVERITY_LABELS[t.severity]} />
                    <span className="truncate">{t.projectName}</span>
                    <span className="ml-auto">
                      <Person name={t.assigneeName} />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {result.length > visible.length && (
            <div className="border-t border-slate-200 p-2 text-center dark:border-slate-700">
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="h-8 rounded-md px-3 text-sm font-medium text-nexa-blue hover:bg-nexa-light/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:text-blue-300 dark:hover:bg-blue-950/40"
              >
                Mostrar {Math.min(PAGE, result.length - visible.length)} más · {visible.length} de {result.length}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
