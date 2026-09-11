import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { StatusBadge, SeverityBadge, PriorityBadge } from "@/components/Badge";
import SubmitButton from "@/components/SubmitButton";
import SuccessBanner from "@/components/SuccessBanner";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import ImagePasteUpload from "@/components/ImagePasteUpload";
import { formatDateTime } from "@/lib/format";
import {
  ROLE_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_STATUSES,
  USER_ROLES,
  type Profile,
  type TicketComment,
  type TicketWithRelations,
} from "@/lib/types";
import {
  addComment,
  addTicketAttachments,
  deleteTicket,
  updateTicketAssignee,
  updateTicketDetails,
  updateTicketStatus,
} from "./actions";

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const { success, error: errorMessage } = await searchParams;
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

  const [{ data: comments }, { data: people }, { data: attachments }, { data: history }] =
    await Promise.all([
      supabase
        .from("ticket_comments")
        .select("*, author:profiles(id, full_name, email)")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true }),
      supabase.from("profiles").select("id, full_name, email, role").order("full_name"),
      supabase
        .from("ticket_attachments")
        .select("id, url")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("ticket_history")
        .select("id, field, old_value, new_value, created_at, actor:profiles(full_name, email)")
        .eq("ticket_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const peopleById = new Map(
    (people as Pick<Profile, "id" | "full_name" | "email">[] | null)?.map((p) => [p.id, p]) ?? [],
  );

  function describeHistoryEntry(h: {
    field: string;
    old_value: string | null;
    new_value: string | null;
  }) {
    if (h.field === "status") {
      const from = h.old_value ? STATUS_LABELS[h.old_value as keyof typeof STATUS_LABELS] : "—";
      const to = h.new_value ? STATUS_LABELS[h.new_value as keyof typeof STATUS_LABELS] : "—";
      return `cambió el estado de "${from}" a "${to}"`;
    }
    const nameOf = (userId: string | null) =>
      userId ? peopleById.get(userId)?.full_name ?? peopleById.get(userId)?.email ?? "usuario eliminado" : "Sin asignar";
    return `cambió el asignado de "${nameOf(h.old_value)}" a "${nameOf(h.new_value)}"`;
  }

  const canManage =
    profile.role === "admin" ||
    profile.role === "lider" ||
    t.reporter_id === profile.id ||
    t.assignee_id === profile.id;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-nexa-blue hover:underline dark:text-slate-400">
          ← Volver a tickets
        </Link>
        {profile.role === "admin" && (
          <form action={deleteTicket}>
            <input type="hidden" name="ticket_id" value={t.id} />
            <ConfirmSubmitButton
              confirmMessage={`¿Eliminar el ticket "${t.title}"? Esto no se puede deshacer.`}
              className="text-xs text-red-500 hover:underline"
            >
              Eliminar ticket
            </ConfirmSubmitButton>
          </form>
        )}
      </div>

      {success && (
        <div className="mt-3">
          <SuccessBanner message={success} />
        </div>
      )}
      {errorMessage && (
        <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{errorMessage}</p>
      )}

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
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

        <h1 className="mb-1 text-xl font-semibold text-nexa-navy dark:text-white">
          <span className="text-slate-400 dark:text-slate-500">
            {t.project?.code}-{t.ticket_number}
          </span>{" "}
          {t.title}
        </h1>
        <div className="mb-4">
          <p className="text-xs text-slate-400">
            Reportado por {t.reporter?.full_name ?? t.reporter?.email ?? "usuario eliminado"} ·{" "}
            {formatDateTime(t.created_at)}
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

        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <div>
            <h2 className="mb-1 font-medium text-slate-800 dark:text-slate-200">Descripción</h2>
            <p className="whitespace-pre-wrap">{t.description}</p>
          </div>

          {t.steps_to_reproduce && (
            <div>
              <h2 className="mb-1 font-medium text-slate-800 dark:text-slate-200">Pasos para reproducir</h2>
              <p className="whitespace-pre-wrap">{t.steps_to_reproduce}</p>
            </div>
          )}

          {t.environment && (
            <div>
              <h2 className="mb-1 font-medium text-slate-800 dark:text-slate-200">Entorno</h2>
              <p>{t.environment}</p>
            </div>
          )}

          <div>
            <h2 className="mb-1 font-medium text-slate-800 dark:text-slate-200">Capturas de pantalla</h2>
            {!!attachments?.length && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt="Captura adjunta"
                      className="h-24 w-24 rounded-md border border-slate-200 object-cover transition-opacity hover:opacity-80 dark:border-slate-700"
                    />
                  </a>
                ))}
              </div>
            )}
            <form action={addTicketAttachments} className="max-w-sm space-y-2">
              <input type="hidden" name="ticket_id" value={t.id} />
              <ImagePasteUpload name="attachments" />
              <SubmitButton
                variant="dark"
                pendingLabel="Subiendo..."
                className="rounded-md px-3 py-1.5 text-xs"
              >
                Adjuntar
              </SubmitButton>
            </form>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-700">
          <form action={updateTicketStatus} className="space-y-1">
            <input type="hidden" name="ticket_id" value={t.id} />
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Estado</label>
            <div className="flex gap-2">
              <select
                name="status"
                defaultValue={t.status}
                disabled={!canManage}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 disabled:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/60"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              {canManage && (
                <SubmitButton variant="dark" className="rounded-md px-3 py-1.5 text-sm">
                  Guardar
                </SubmitButton>
              )}
            </div>
          </form>

          <form action={updateTicketAssignee} className="space-y-1">
            <input type="hidden" name="ticket_id" value={t.id} />
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Asignado a</label>
            <div className="flex gap-2">
              <select
                name="assignee_id"
                defaultValue={t.assignee_id ?? ""}
                disabled={!canManage}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 disabled:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/60"
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
                <SubmitButton variant="dark" className="rounded-md px-3 py-1.5 text-sm">
                  Guardar
                </SubmitButton>
              )}
            </div>
          </form>
        </div>
        {!canManage && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Solo quien reportó, la persona asignada o un admin pueden cambiar estado/asignación.
          </p>
        )}
        </div>
      </div>

      {profile.role === "admin" && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <form action={updateTicketDetails} className="space-y-4">
            <input type="hidden" name="ticket_id" value={t.id} />
            <h2 className="text-sm font-semibold text-nexa-navy dark:text-white">Editar ticket</h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Título</label>
              <input
                name="title"
                required
                defaultValue={t.title}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
              <textarea
                name="description"
                required
                rows={4}
                defaultValue={t.description}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Pasos para reproducir
              </label>
              <textarea
                name="steps_to_reproduce"
                rows={3}
                defaultValue={t.steps_to_reproduce ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Entorno</label>
              <input
                name="environment"
                defaultValue={t.environment ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Severidad</label>
                <select
                  name="severity"
                  defaultValue={t.severity}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  {TICKET_SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prioridad</label>
                <select
                  name="priority"
                  defaultValue={t.priority}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Equipo destino
                </label>
                <select
                  name="target_role"
                  defaultValue={t.target_role ?? ""}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Sin definir</option>
                  {USER_ROLES.filter((r) => r !== "admin" && r !== "lider").map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <SubmitButton variant="primary" pendingLabel="Guardando..." className="rounded-md px-3 py-1.5 text-sm font-medium">
              Guardar cambios
            </SubmitButton>
          </form>
        </div>
      )}

      {!!history?.length && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-sm font-semibold text-nexa-navy dark:text-white">
            Historial ({history.length})
          </h2>
          <ul className="space-y-2 border-l border-slate-200 pl-4 dark:border-slate-700">
            {history.map((h) => {
              const actor = Array.isArray(h.actor) ? h.actor[0] : h.actor;
              return (
                <li key={h.id} className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {actor?.full_name ?? actor?.email ?? "usuario eliminado"}
                  </span>{" "}
                  {describeHistoryEntry(h)} · {formatDateTime(h.created_at)}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-3 text-sm font-semibold text-nexa-navy dark:text-white">
          Comentarios ({comments?.length ?? 0})
        </h2>

        <div className="mb-4 space-y-3">
          {(comments as TicketComment[] | null)?.map((c) => (
            <div key={c.id} className="rounded-md border-l-2 border-nexa-sky bg-nexa-light/40 p-3 text-sm dark:bg-nexa-sky/10">
              <p className="mb-1 text-xs font-medium text-nexa-blue/80 dark:text-nexa-sky">
                {c.author?.full_name ?? c.author?.email ?? "usuario eliminado"} ·{" "}
                {formatDateTime(c.created_at)}
              </p>
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">{c.body}</p>
            </div>
          ))}
          {comments?.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-slate-500">Todavía no hay comentarios.</p>
          )}
        </div>

        <form action={addComment} className="space-y-2">
          <input type="hidden" name="ticket_id" value={t.id} />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Escribe un comentario..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <SubmitButton variant="primary" pendingLabel="Enviando..." className="rounded-md px-3 py-1.5 text-sm font-medium">
            Comentar
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
