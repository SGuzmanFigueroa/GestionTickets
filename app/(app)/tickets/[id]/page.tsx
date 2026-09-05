import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { StatusBadge, SeverityBadge, PriorityBadge } from "@/components/Badge";
import {
  ROLE_LABELS,
  STATUS_LABELS,
  TICKET_STATUSES,
  type Profile,
  type TicketComment,
  type TicketWithRelations,
} from "@/lib/types";
import { addComment, updateTicketAssignee, updateTicketStatus } from "./actions";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "*, project:projects(id, name, slug), reporter:profiles!tickets_reporter_id_fkey(id, full_name, email), assignee:profiles!tickets_assignee_id_fkey(id, full_name, email), test_case:test_cases(id, title)",
    )
    .eq("id", id)
    .single();

  if (!ticket) notFound();

  const t = ticket as TicketWithRelations;

  const [{ data: comments }, { data: people }] = await Promise.all([
    supabase
      .from("ticket_comments")
      .select("*, author:profiles(id, full_name, email)")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, full_name, email, role").order("full_name"),
  ]);

  const canManage = profile.role === "admin" || t.reporter_id === profile.id || t.assignee_id === profile.id;

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-nexa-blue hover:underline">
        ← Volver a tickets
      </Link>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-nexa-blue to-nexa-sky" />
        <div className="p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={t.status} label={STATUS_LABELS[t.status]} />
          <SeverityBadge severity={t.severity} label={t.severity} />
          <PriorityBadge priority={t.priority} label={t.priority} />
          <span className="rounded-full bg-nexa-light px-2.5 py-0.5 text-xs font-medium text-nexa-blue">
            {t.project?.name}
          </span>
          {t.target_role && (
            <span className="text-xs text-slate-400">→ {ROLE_LABELS[t.target_role]}</span>
          )}
        </div>

        <h1 className="mb-1 text-xl font-semibold text-nexa-navy">{t.title}</h1>
        <div className="mb-4">
          <p className="text-xs text-slate-400">
            Reportado por {t.reporter?.full_name ?? t.reporter?.email} ·{" "}
            {new Date(t.created_at).toLocaleString("es-PE")}
          </p>
          {t.test_case && (
            <p className="text-xs text-slate-400">
              Originado del caso de prueba:{" "}
              <Link
                href={`/test-cases/${t.test_case.id}`}
                className="text-nexa-blue hover:underline"
              >
                {t.test_case.title}
              </Link>
            </p>
          )}
        </div>

        <div className="space-y-4 text-sm text-slate-700">
          <div>
            <h2 className="mb-1 font-medium text-slate-800">Descripción</h2>
            <p className="whitespace-pre-wrap">{t.description}</p>
          </div>

          {t.steps_to_reproduce && (
            <div>
              <h2 className="mb-1 font-medium text-slate-800">Pasos para reproducir</h2>
              <p className="whitespace-pre-wrap">{t.steps_to_reproduce}</p>
            </div>
          )}

          {t.environment && (
            <div>
              <h2 className="mb-1 font-medium text-slate-800">Entorno</h2>
              <p>{t.environment}</p>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <form action={updateTicketStatus} className="space-y-1">
            <input type="hidden" name="ticket_id" value={t.id} />
            <label className="block text-xs font-medium text-slate-500">Estado</label>
            <div className="flex gap-2">
              <select
                name="status"
                defaultValue={t.status}
                disabled={!canManage}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 disabled:bg-slate-50"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              {canManage && (
                <button
                  type="submit"
                  className="rounded-md bg-nexa-navy px-3 py-1.5 text-sm text-white hover:bg-slate-900"
                >
                  Guardar
                </button>
              )}
            </div>
          </form>

          <form action={updateTicketAssignee} className="space-y-1">
            <input type="hidden" name="ticket_id" value={t.id} />
            <label className="block text-xs font-medium text-slate-500">Asignado a</label>
            <div className="flex gap-2">
              <select
                name="assignee_id"
                defaultValue={t.assignee_id ?? ""}
                disabled={!canManage}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 disabled:bg-slate-50"
              >
                <option value="">Sin asignar</option>
                {(people as Pick<Profile, "id" | "full_name" | "email" | "role">[] | null)?.map(
                  (p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name ?? p.email} ({ROLE_LABELS[p.role]})
                    </option>
                  ),
                )}
              </select>
              {canManage && (
                <button
                  type="submit"
                  className="rounded-md bg-nexa-navy px-3 py-1.5 text-sm text-white hover:bg-slate-900"
                >
                  Guardar
                </button>
              )}
            </div>
          </form>
        </div>
        {!canManage && (
          <p className="mt-2 text-xs text-slate-400">
            Solo quien reportó, la persona asignada o un admin pueden cambiar estado/asignación.
          </p>
        )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-nexa-navy">
          Comentarios ({comments?.length ?? 0})
        </h2>

        <div className="mb-4 space-y-3">
          {(comments as TicketComment[] | null)?.map((c) => (
            <div key={c.id} className="rounded-md border-l-2 border-nexa-sky bg-nexa-light/40 p-3 text-sm">
              <p className="mb-1 text-xs font-medium text-nexa-blue/80">
                {c.author?.full_name ?? c.author?.email} ·{" "}
                {new Date(c.created_at).toLocaleString("es-PE")}
              </p>
              <p className="whitespace-pre-wrap text-slate-700">{c.body}</p>
            </div>
          ))}
          {comments?.length === 0 && (
            <p className="text-sm text-slate-400">Todavía no hay comentarios.</p>
          )}
        </div>

        <form action={addComment} className="space-y-2">
          <input type="hidden" name="ticket_id" value={t.id} />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Escribe un comentario..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
          />
          <button
            type="submit"
            className="rounded-md bg-nexa-blue px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-nexa-navy"
          >
            Comentar
          </button>
        </form>
      </div>
    </div>
  );
}
