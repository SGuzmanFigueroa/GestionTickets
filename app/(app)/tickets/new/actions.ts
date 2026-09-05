"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

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

  if (!projectId || !title || !description) {
    redirect(`/tickets/new?error=${encodeURIComponent("Completa app, título y descripción.")}`);
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
      reporter_id: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/tickets/new?error=${encodeURIComponent(error?.message ?? "No se pudo crear el ticket")}`);
  }

  redirect(`/tickets/${data.id}`);
}
