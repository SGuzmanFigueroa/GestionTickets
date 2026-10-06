"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { PriorityBadge, SeverityBadge } from "@/components/Badge";
import {
  BOARD_COLUMNS,
  PRIORITY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  type TicketPriority,
  type TicketSeverity,
  type TicketStatus,
} from "@/lib/types";
import { moveTicket } from "./actions";

export interface BoardCard {
  id: string;
  code: string;
  title: string;
  status: TicketStatus;
  severity: TicketSeverity;
  priority: TicketPriority;
  projectName: string;
  assigneeName: string | null;
  mine: boolean;
  /** Estados a los que esta persona puede mover el ticket. */
  moves: TicketStatus[];
}

type Column = (typeof BOARD_COLUMNS)[number];

// Certificado crece sin parar: mostramos solo lo más reciente.
const CERTIFIED_LIMIT = 20;

const COLUMN_DOT: Record<string, string> = {
  open: "bg-slate-400",
  in_progress: "bg-amber-500",
  done: "bg-cyan-500",
  in_review: "bg-purple-500",
  resolved: "bg-emerald-500",
};

/** Estado al que va un ticket si se suelta en esta columna (o null si no puede). */
function targetFor(card: BoardCard, column: Column): TicketStatus | null {
  if (column.statuses.includes(card.status)) return null;
  return column.statuses.find((s) => card.moves.includes(s)) ?? null;
}

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export default function KanbanBoard({ initialCards }: { initialCards: BoardCard[] }) {
  // Optimista: la tarjeta se mueve al instante; al terminar, manda lo que diga
  // el servidor (si rechazó el cambio, vuelve sola a su columna).
  const [cards, applyMove] = useOptimistic(
    initialCards,
    (state, move: { id: string; status: TicketStatus }) =>
      state.map((c) => (c.id === move.id ? { ...c, status: move.status, moves: [] } : c)),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<BoardCard | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  function move(card: BoardCard, status: TicketStatus) {
    setError(null);
    startTransition(async () => {
      applyMove({ id: card.id, status });
      const err = await moveTicket(card.id, status);
      if (err) setError(`${card.code}: ${err}`);
    });
  }

  const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const visible = words.length
    ? cards.filter((c) => {
        const hay = normalize(`${c.code} ${c.title} ${c.assigneeName ?? ""} ${c.projectName}`);
        return words.every((w) => hay.includes(w));
      })
    : cards;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por código, título o persona..."
          aria-label="Buscar en el tablero"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:w-72"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Arrastra una tarjeta o usa “Mover a…”. Solo se resaltan las columnas a las que puedes moverla.
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {BOARD_COLUMNS.map((column) => {
          const all = visible.filter((c) => column.statuses.includes(c.status));
          const shown = column.id === "resolved" ? all.slice(0, CERTIFIED_LIMIT) : all;
          const canDrop = dragging ? targetFor(dragging, column) !== null : false;
          const isOver = overColumn === column.id && canDrop;

          return (
            <section
              key={column.id}
              aria-label={`${column.label} (${all.length})`}
              onDragOver={(e) => {
                if (!canDrop) return;
                e.preventDefault();
                setOverColumn(column.id);
              }}
              onDragLeave={() => setOverColumn((c) => (c === column.id ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setOverColumn(null);
                const target = dragging ? targetFor(dragging, column) : null;
                if (dragging && target) move(dragging, target);
                setDragging(null);
              }}
              className={`flex w-[280px] shrink-0 snap-start flex-col rounded-xl border p-2 transition-colors ${
                isOver
                  ? "border-nexa-blue bg-nexa-light/70 dark:bg-blue-950/40"
                  : canDrop
                    ? "border-dashed border-nexa-blue/50 bg-slate-100/70 dark:bg-slate-800/60"
                    : "border-transparent bg-slate-100/70 dark:bg-slate-800/40"
              } ${dragging && !canDrop && !column.statuses.includes(dragging.status) ? "opacity-50" : ""}`}
            >
              <header className="flex items-center gap-2 px-1.5 pb-2 pt-1">
                <span className={`h-2 w-2 rounded-full ${COLUMN_DOT[column.id]}`} aria-hidden="true" />
                <h2 className="text-sm font-semibold text-nexa-navy dark:text-white">{column.label}</h2>
                <span className="ml-auto rounded-full bg-white px-2 text-xs font-medium tabular-nums text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                  {all.length}
                </span>
              </header>

              <ul className="flex min-h-24 flex-col gap-2">
                {shown.map((card) => (
                  <BoardCardItem
                    key={card.id}
                    card={card}
                    onMove={move}
                    onDragStart={() => setDragging(card)}
                    onDragEnd={() => {
                      setDragging(null);
                      setOverColumn(null);
                    }}
                    isDragging={dragging?.id === card.id}
                  />
                ))}
                {all.length === 0 && (
                  <li className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    Sin tickets
                  </li>
                )}
              </ul>

              {all.length > shown.length && (
                <Link
                  href="/dashboard?status=resolved"
                  className="mt-2 px-1.5 text-xs font-medium text-nexa-blue hover:underline dark:text-blue-300"
                >
                  Ver los {all.length - shown.length} certificados más antiguos →
                </Link>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BoardCardItem({
  card,
  onMove,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  card: BoardCard;
  onMove: (card: BoardCard, status: TicketStatus) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const targets = BOARD_COLUMNS.map((col) => ({ col, status: targetFor(card, col) })).filter(
    (t): t is { col: Column; status: TicketStatus } => t.status !== null,
  );
  const draggable = targets.length > 0;

  return (
    <li
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`group rounded-lg border bg-white p-3 shadow-sm transition dark:bg-slate-800 ${
        card.mine ? "border-nexa-blue/40 dark:border-blue-700/60" : "border-slate-200 dark:border-slate-700"
      } ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${isDragging ? "opacity-40" : "hover:shadow-md"}`}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{card.code}</span>
        {card.status === "reopened" && (
          <span className="rounded bg-red-50 px-1.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {STATUS_LABELS.reopened}
          </span>
        )}
        {card.mine && (
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-nexa-blue dark:text-blue-300">
            Tuyo
          </span>
        )}
      </div>

      <Link
        href={`/tickets/${card.id}`}
        draggable={false}
        className="line-clamp-3 text-sm font-medium text-slate-800 hover:text-nexa-blue hover:underline dark:text-slate-100"
      >
        {card.title}
      </Link>

      <div className="mt-2 flex flex-wrap gap-1">
        <PriorityBadge priority={card.priority} label={PRIORITY_LABELS[card.priority]} />
        {card.severity === "critical" && <SeverityBadge severity={card.severity} label={SEVERITY_LABELS[card.severity]} />}
      </div>

      <div className="mt-2.5 flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-700">
        {card.assigneeName ? (
          <>
            <Avatar name={card.assigneeName} size="sm" />
            <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">{card.assigneeName}</span>
          </>
        ) : (
          <span className="flex-1 text-xs text-amber-600 dark:text-amber-400">Sin responsable</span>
        )}

        {draggable && (
          <select
            value=""
            onChange={(e) => {
              const status = e.target.value as TicketStatus;
              if (status) onMove(card, status);
            }}
            aria-label={`Mover ${card.code} a otra columna`}
            className="max-w-[7.5rem] rounded border border-slate-200 bg-white py-0.5 pl-1 pr-5 text-[11px] text-slate-600 outline-none focus:border-nexa-blue dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">Mover a…</option>
            {targets.map(({ col, status }) => (
              <option key={col.id} value={status}>
                {status === "reopened" ? "Devolver (Reabierto)" : col.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </li>
  );
}
