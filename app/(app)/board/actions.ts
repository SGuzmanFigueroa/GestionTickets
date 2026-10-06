"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { allowedStatuses } from "@/lib/ticket-permissions";
import { STATUS_LABELS, type TicketStatus } from "@/lib/types";

/** Mueve un ticket de columna en el tablero. Devuelve un error legible o null. */
export async function moveTicket(ticketId: string, status: TicketStatus): Promise<string | null> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("tickets")
    .select("status, assignee_id, reporter_id")
    .eq("id", ticketId)
    .single();

  if (!current) return "No encontramos ese ticket.";
  if (!allowedStatuses(profile, current).includes(status)) {
    return `No puedes mover este ticket a "${STATUS_LABELS[status]}".`;
  }

  const { error } = await supabase.from("tickets").update({ status }).eq("id", ticketId);
  if (error) return error.message;

  await supabase.from("ticket_history").insert({
    ticket_id: ticketId,
    actor_id: profile.id,
    field: "status",
    old_value: current.status,
    new_value: status,
  });

  revalidatePath("/board");
  revalidatePath("/dashboard");
  return null;
}
