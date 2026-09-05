"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

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

  if (!error && current) {
    await supabase.from("ticket_history").insert({
      ticket_id: ticketId,
      actor_id: profile.id,
      field: "status",
      old_value: current.status,
      new_value: status,
    });
  }

  revalidatePath(`/tickets/${ticketId}`);
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

  if (!error && current) {
    await supabase.from("ticket_history").insert({
      ticket_id: ticketId,
      actor_id: profile.id,
      field: "assignee",
      old_value: current.assignee_id,
      new_value: assigneeId || null,
    });
  }

  revalidatePath(`/tickets/${ticketId}`);
}

export async function addComment(formData: FormData) {
  const profile = await requireProfile();
  const ticketId = String(formData.get("ticket_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!body) redirect(`/tickets/${ticketId}`);

  const supabase = await createClient();
  await supabase.from("ticket_comments").insert({
    ticket_id: ticketId,
    author_id: profile.id,
    body,
  });

  revalidatePath(`/tickets/${ticketId}`);
}
