"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireProfile } from "@/lib/auth";
import { sendTicketAssignedEmail } from "@/lib/email";

export async function updateTicketStatus(formData: FormData) {
  const profile = await requireProfile();
  const ticketId = String(formData.get("ticket_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("tickets")
    .select("status")
    .eq("id", ticketId)
    .single();

  const { error } = await supabase.from("tickets").update({ status }).eq("id", ticketId);

  if (error) {
    redirect(`/tickets/${ticketId}?error=${encodeURIComponent(error.message)}`);
  }

  if (current) {
    await supabase.from("ticket_history").insert({
      ticket_id: ticketId,
      actor_id: profile.id,
      field: "status",
      old_value: current.status,
      new_value: status,
    });
  }

  redirect(`/tickets/${ticketId}?success=${encodeURIComponent("Estado actualizado.")}`);
}

export async function updateTicketAssignee(formData: FormData) {
  const profile = await requireProfile();
  const ticketId = String(formData.get("ticket_id") ?? "");
  const assigneeId = String(formData.get("assignee_id") ?? "");
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("tickets")
    .select("assignee_id")
    .eq("id", ticketId)
    .single();

  const { error } = await supabase
    .from("tickets")
    .update({ assignee_id: assigneeId || null })
    .eq("id", ticketId);

  if (error) {
    redirect(`/tickets/${ticketId}?error=${encodeURIComponent(error.message)}`);
  }

  if (current) {
    await supabase.from("ticket_history").insert({
      ticket_id: ticketId,
      actor_id: profile.id,
      field: "assignee",
      old_value: current.assignee_id,
      new_value: assigneeId || null,
    });
  }

  if (assigneeId && assigneeId !== current?.assignee_id) {
    const [{ data: ticket }, { data: assignee }] = await Promise.all([
      supabase.from("tickets").select("title, ticket_number, project_id").eq("id", ticketId).single(),
      supabase.from("profiles").select("email").eq("id", assigneeId).single(),
    ]);

    if (ticket && assignee?.email) {
      const { data: project } = await supabase
        .from("projects")
        .select("code")
        .eq("id", ticket.project_id)
        .single();

      await sendTicketAssignedEmail({
        to: assignee.email,
        ticketCode: `${project?.code}-${ticket.ticket_number}`,
        ticketTitle: ticket.title,
        ticketId,
        assignedByName: profile.full_name ?? profile.email,
      });
    }
  }

  redirect(`/tickets/${ticketId}?success=${encodeURIComponent("Asignación actualizada.")}`);
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

  redirect(`/tickets/${ticketId}?success=${encodeURIComponent("Comentario agregado.")}`);
}

export async function updateTicketDetails(formData: FormData) {
  await requireAdmin();
  const ticketId = String(formData.get("ticket_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const stepsToReproduce = String(formData.get("steps_to_reproduce") ?? "").trim();
  const environment = String(formData.get("environment") ?? "").trim();
  const severity = String(formData.get("severity") ?? "medium");
  const priority = String(formData.get("priority") ?? "medium");
  const targetRole = String(formData.get("target_role") ?? "");

  if (!title || !description) {
    redirect(`/tickets/${ticketId}?error=${encodeURIComponent("Completa título y descripción.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({
      title,
      description,
      steps_to_reproduce: stepsToReproduce || null,
      environment: environment || null,
      severity,
      priority,
      target_role: targetRole || null,
    })
    .eq("id", ticketId);

  if (error) {
    redirect(`/tickets/${ticketId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/tickets/${ticketId}?success=${encodeURIComponent("Ticket actualizado.")}`);
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

  redirect(`/tickets/${ticketId}?success=${encodeURIComponent("Imagen adjuntada.")}`);
}

export async function deleteTicket(formData: FormData) {
  await requireAdmin();
  const ticketId = String(formData.get("ticket_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("tickets").delete().eq("id", ticketId);

  if (error) {
    redirect(`/tickets/${ticketId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/dashboard?success=${encodeURIComponent("Ticket eliminado.")}`);
}
