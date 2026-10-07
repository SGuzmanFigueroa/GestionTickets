"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import SubmitButton from "@/components/SubmitButton";
import { StatusBadge } from "@/components/Badge";
import { addComment } from "@/app/(app)/tickets/[id]/actions";
import { STATUS_LABELS, type TicketStatus } from "@/lib/types";

export type ActivityItem =
  | { kind: "comment"; id: string; author: string; at: string; atLabel: string; body: string }
  | {
      kind: "history";
      id: string;
      author: string;
      at: string;
      atLabel: string;
      field: "status" | "assignee" | "project" | string;
      from: string | null;
      to: string | null;
    };

type Tab = "all" | "comments" | "history";

function Change({ item }: { item: Extract<ActivityItem, { kind: "history" }> }) {
  const arrow = <span className="text-slate-400" aria-label="a">→</span>;
  if (item.field === "status") {
    const badge = (s: string | null) =>
      s && s in STATUS_LABELS ? <StatusBadge status={s as TicketStatus} label={STATUS_LABELS[s as TicketStatus]} /> : <span>—</span>;
    return (
      <>
        <span className="text-slate-500 dark:text-slate-400">cambió el estado</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          {badge(item.from)} {arrow} {badge(item.to)}
        </span>
      </>
    );
  }
  const verb = item.field === "project" ? "movió el ticket" : "cambió el asignado";
  return (
    <>
      <span className="text-slate-500 dark:text-slate-400">{verb}</span>
      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-slate-700 dark:text-slate-200">
        <span className={item.from ? "" : "italic text-slate-400"}>{item.from ?? "Sin asignar"}</span> {arrow}{" "}
        <span className={`font-medium ${item.to ? "" : "italic text-slate-400"}`}>{item.to ?? "Sin asignar"}</span>
      </span>
    </>
  );
}

function CommentComposer({ ticketId, me }: { ticketId: string; me: string }) {
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex gap-3">
      <Avatar name={me} />
      <form ref={formRef} action={addComment} className="min-w-0 flex-1">
        <input type="hidden" name="ticket_id" value={ticketId} />
        {expanded ? (
          <div className="rounded-md border border-nexa-blue ring-2 ring-nexa-blue/15">
            <textarea
              name="body"
              required
              autoFocus
              rows={4}
              placeholder="Escribe un comentario…"
              aria-label="Comentario"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) formRef.current?.requestSubmit();
                if (e.key === "Escape") setExpanded(false);
              }}
              className="block w-full resize-y rounded-t-md bg-white px-3 py-2 text-sm text-slate-800 outline-none dark:bg-slate-900 dark:text-slate-100"
            />
            <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800">
              <SubmitButton variant="primary" pendingLabel="Enviando…" className="h-7 rounded-md px-3 text-xs font-semibold">
                Comentar
              </SubmitButton>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="h-7 rounded-md px-3 text-xs font-medium text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <span className="ml-auto hidden text-[11px] text-slate-400 sm:inline">Ctrl + Enter para enviar</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex h-9 w-full items-center rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-400 transition-colors hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:border-slate-600 dark:bg-slate-800"
          >
            Agregar comentario…
          </button>
        )}
      </form>
    </div>
  );
}

/** Comentarios e historial en una sola línea de tiempo (lo más reciente arriba). */
export default function ActivityFeed({ ticketId, me, items }: { ticketId: string; me: string; items: ActivityItem[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const comments = items.filter((i) => i.kind === "comment").length;
  const visible = items.filter((i) => tab === "all" || (tab === "comments" ? i.kind === "comment" : i.kind === "history"));

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: items.length },
    { id: "comments", label: "Comentarios", count: comments },
    { id: "history", label: "Historial", count: items.length - comments },
  ];

  return (
    <section aria-labelledby="activity-title">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 id="activity-title" className="text-sm font-semibold text-nexa-navy dark:text-white">
          Actividad
        </h2>
        <div role="tablist" aria-label="Filtrar actividad" className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 ${
                tab === t.id
                  ? "bg-nexa-light text-nexa-blue dark:bg-blue-950/50 dark:text-blue-300"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {t.label} <span className="tabular-nums opacity-70">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <CommentComposer ticketId={ticketId} me={me} />

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          {tab === "comments" ? "Todavía no hay comentarios." : "Sin actividad todavía."}
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {visible.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="flex gap-3">
              <Avatar name={item.author} size={item.kind === "comment" ? "md" : "sm"} className={item.kind === "history" ? "ml-1 mt-0.5" : ""} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{item.author}</span>
                  <time dateTime={item.at} className="text-xs text-slate-400">
                    {item.atLabel}
                  </time>
                </p>
                {item.kind === "comment" ? (
                  <p className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-slate-700 dark:text-slate-200">{item.body}</p>
                ) : (
                  <div className="flex flex-col text-sm">
                    <Change item={item} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
