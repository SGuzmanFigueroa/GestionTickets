"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { sendTicketAssignedEmail } from "@/lib/email";

export async function createTicket(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const projectId = String(formData.get("project_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const stepsToReproduce = String(formData.get("steps_to_reproduce") ?? "").trim();
  const environment = String(formData.get("environment") ?? "").trim();
  const severity = String(formData.get("severity") ?? "medium");
  const priority = String(formData.get("priority") ?? "medium");
  const targetRole = String(formData.get("target_role") ?? "");
  const testCaseId = String(formData.get("test_case_id") ?? "");
  // Asignación inicial: quien reporta puede asignar su ticket mientras no tenga responsable.
  const assigneeId = String(formData.get("assignee_id") ?? "") || null;
  const attachments = String(formData.get("attachments") ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (!projectId || !title || !description) {
    redirect(`/tickets/new?error=${encodeURIComponent("Completa app, título y descripción.")}`);
  }

  // Solo se reporta en proyectos propios (admin: en cualquiera).
  if (profile.role !== "admin") {
    const { data: myProjectIds } = await supabase.rpc("my_project_ids");
    if (!((myProjectIds as string[] | null) ?? []).includes(projectId)) {
      redirect(`/tickets/new?error=${encodeURIComponent("Solo puedes reportar tickets en tus proyectos.")}`);
    }
  }

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      project_id: projectId,
      title,
      description,
      steps_to_reproduce: stepsToReproduce || null,
      environment: environment || null,
      severity,
      priority,
      target_role: targetRole || null,
      test_case_id: testCaseId || null,
      reporter_id: profile.id,
      assignee_id: assigneeId,
    })
    .select("id, ticket_number, project:projects(code)")
    .single();

  if (error || !data) {
    redirect(`/tickets/new?error=${encodeURIComponent(error?.message ?? "No se pudo crear el ticket")}`);
  }

  if (attachments.length > 0) {
    await supabase.from("ticket_attachments").insert(
      attachments.map((url) => ({
        ticket_id: data.id,
        url,
        uploaded_by: profile.id,
      })),
    );
  }

  if (assigneeId) {
    await supabase.from("ticket_history").insert({
      ticket_id: data.id,
      actor_id: profile.id,
      field: "assignee",
      old_value: null,
      new_value: assigneeId,
    });
    const { data: assignee } = await supabase.from("profiles").select("email").eq("id", assigneeId).single();
    if (assignee?.email) {
      await sendTicketAssignedEmail({
        to: assignee.email,
        ticketCode: `${(data.project as unknown as { code: string } | null)?.code}-${data.ticket_number}`,
        ticketTitle: title,
        ticketId: data.id,
        assignedByName: profile.full_name ?? profile.email,
      });
    }
  }

  redirect(`/tickets/${data.id}?success=${encodeURIComponent("Ticket creado")}`);
}
