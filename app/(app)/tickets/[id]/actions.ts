"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireProfile } from "@/lib/auth";
import { sendTicketAssignedEmail } from "@/lib/email";
import { allowedStatuses, ticketPermissions } from "@/lib/ticket-permissions";
import {
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  USER_ROLES,
  type TicketPriority,
  type TicketSeverity,
  type TicketStatus,
  type UserRole,
} from "@/lib/types";

// Acciones de edición inline del detalle del ticket. Devuelven un error
// legible (o null) en vez de redirigir, para que el campo pueda volver a su
// valor anterior si algo falla. Las reglas son las mismas de
// lib/ticket-permissions.ts y del trigger enforce_ticket_locks.

type Result = { error: string | null };

const GUARDED_COLUMNS = "status, assignee_id, reporter_id, project_id, ticket_number, project:projects(code)";

function codeOf(row: { ticket_number: number; project: unknown } | null) {
  return row ? `${(row.project as { code: string } | null)?.code}-${row.ticket_number}` : null;
}

export async function changeTicketStatus(ticketId: string, status: TicketStatus): Promise<Result> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: current } = await supabase.from("tickets").select(GUARDED_COLUMNS).eq("id", ticketId).single();

  if (!current) return { error: "No encontramos este ticket." };
  if (!allowedStatuses(profile, current).includes(status)) {
    return { error: "No puedes mover este ticket a ese estado." };
  }

  const { error } = await supabase.from("tickets").update({ status }).eq("id", ticketId);
  if (error) return { error: error.message };

  await supabase.from("ticket_history").insert({
    ticket_id: ticketId,
    actor_id: profile.id,
    field: "status",
    old_value: current.status,
    new_value: status,
  });

  revalidatePath(`/tickets/${ticketId}`);
  return { error: null };
}

export async function changeTicketAssignee(ticketId: string, assigneeId: string | null): Promise<Result> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: current } = await supabase.from("tickets").select(GUARDED_COLUMNS).eq("id", ticketId).single();

  if (!current) return { error: "No encontramos este ticket." };
  if (!ticketPermissions(profile, current).canChangeAssignee) {
    return { error: "No tienes permiso para cambiar la persona asignada de este ticket." };
  }

  const { error } = await supabase.from("tickets").update({ assignee_id: assigneeId }).eq("id", ticketId);
  if (error) return { error: error.message };

  await supabase.from("ticket_history").insert({
    ticket_id: ticketId,
    actor_id: profile.id,
    field: "assignee",
    old_value: current.assignee_id,
    new_value: assigneeId,
  });

  if (assigneeId && assigneeId !== current.assignee_id) {
    const [{ data: ticket }, { data: assignee }] = await Promise.all([
      supabase.from("tickets").select("title, ticket_number, project:projects(code)").eq("id", ticketId).single(),
      supabase.from("profiles").select("email").eq("id", assigneeId).single(),
    ]);
    if (ticket && assignee?.email) {
      await sendTicketAssignedEmail({
        to: assignee.email,
        ticketCode: codeOf(ticket) ?? "",
        ticketTitle: ticket.title,
        ticketId,
        assignedByName: profile.full_name ?? profile.email,
      });
    }
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { error: null };
}

export interface TicketFieldsPatch {
  title?: string;
  description?: string;
  steps_to_reproduce?: string | null;
  environment?: string | null;
  severity?: TicketSeverity;
  priority?: TicketPriority;
  target_role?: UserRole | null;
  project_id?: string;
}

/** Edita uno o varios datos del ticket (título, descripción, prioridad, proyecto…). Solo líder (no finalizado) o admin. */
export async function updateTicketFields(
  ticketId: string,
  patch: TicketFieldsPatch,
): Promise<Result & { newCode?: string | null }> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: current } = await supabase.from("tickets").select(GUARDED_COLUMNS).eq("id", ticketId).single();

  if (!current) return { error: "No encontramos este ticket." };
  if (!ticketPermissions(profile, current).canEditDetails) {
    return { error: "Solo un líder puede editar el ticket, y solo mientras no esté certificado o cerrado." };
  }

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) return { error: "El título no puede quedar vacío." };
    update.title = title;
  }
  if (patch.description !== undefined) {
    const description = patch.description.trim();
    if (!description) return { error: "La descripción no puede quedar vacía." };
    update.description = description;
  }
  if (patch.steps_to_reproduce !== undefined) update.steps_to_reproduce = patch.steps_to_reproduce?.trim() || null;
  if (patch.environment !== undefined) update.environment = patch.environment?.trim() || null;
  if (patch.severity !== undefined) {
    if (!TICKET_SEVERITIES.includes(patch.severity)) return { error: "Severidad inválida." };
    update.severity = patch.severity;
  }
  if (patch.priority !== undefined) {
    if (!TICKET_PRIORITIES.includes(patch.priority)) return { error: "Prioridad inválida." };
    update.priority = patch.priority;
  }
  if (patch.target_role !== undefined) {
    if (patch.target_role !== null && !USER_ROLES.includes(patch.target_role)) return { error: "Equipo inválido." };
    update.target_role = patch.target_role;
  }

  // Cambio de proyecto: el admin a cualquiera; un líder solo a uno de sus proyectos.
  const movingProject = Boolean(patch.project_id) && patch.project_id !== current.project_id;
  if (movingProject) {
    if (profile.role !== "admin") {
      const { data: myProjectIds } = await supabase.rpc("my_project_ids");
      if (!((myProjectIds as string[] | null) ?? []).includes(patch.project_id!)) {
        return { error: "Solo puedes mover el ticket a uno de tus proyectos." };
      }
    }
    update.project_id = patch.project_id;
  }

  if (Object.keys(update).length === 0) return { error: null };

  const { error } = await supabase.from("tickets").update(update).eq("id", ticketId);
  if (error) return { error: error.message };

  let newCode: string | null = null;
  if (movingProject) {
    // Guardamos el código anterior y el nuevo (el nuevo número lo asigna la base).
    const { data: moved } = await supabase
      .from("tickets")
      .select("ticket_number, project:projects(code)")
      .eq("id", ticketId)
      .single();
    newCode = codeOf(moved);
    await supabase.from("ticket_history").insert({
      ticket_id: ticketId,
      actor_id: profile.id,
      field: "project",
      old_value: codeOf(current),
      new_value: newCode,
    });
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { error: null, newCode };
}

export async function addComment(formData: FormData) {
  const profile = await requireProfile();
  const ticketId = String(formData.get("ticket_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    redirect(`/tickets/${ticketId}?error=${encodeURIComponent("Escribe algo antes de comentar.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ticket_comments").insert({
    ticket_id: ticketId,
    author_id: profile.id,
    body,
  });

  if (error) {
    redirect(`/tickets/${ticketId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/tickets/${ticketId}?success=${encodeURIComponent("Comentario agregado")}`);
}

export async function addTicketAttachments(formData: FormData) {
  const profile = await requireProfile();
  const ticketId = String(formData.get("ticket_id") ?? "");
  const attachments = String(formData.get("attachments") ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (attachments.length === 0) {
    redirect(`/tickets/${ticketId}?error=${encodeURIComponent("Pega una captura antes de subirla.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ticket_attachments").insert(
    attachments.map((url) => ({
      ticket_id: ticketId,
      url,
      uploaded_by: profile.id,
    })),
  );

  if (error) {
    redirect(`/tickets/${ticketId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/tickets/${ticketId}?success=${encodeURIComponent(attachments.length === 1 ? "Imagen adjuntada" : "Imágenes adjuntadas")}`);
}

export async function deleteTicket(formData: FormData) {
  await requireAdmin();
  const ticketId = String(formData.get("ticket_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("tickets").delete().eq("id", ticketId);

  if (error) {
    redirect(`/tickets/${ticketId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/dashboard?success=${encodeURIComponent("Ticket eliminado")}`);
}
