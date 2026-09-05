"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireProfile } from "@/lib/auth";

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
