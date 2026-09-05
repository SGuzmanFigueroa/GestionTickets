"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function createTestCase(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const projectId = String(formData.get("project_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const preconditions = String(formData.get("preconditions") ?? "").trim();
  const steps = String(formData.get("steps") ?? "").trim();
  const expectedResult = String(formData.get("expected_result") ?? "").trim();

  if (!projectId || !title || !steps || !expectedResult) {
    redirect(
      `/test-cases/new?error=${encodeURIComponent("Completa app, título, pasos y resultado esperado.")}`,
    );
  }

  const { data, error } = await supabase
    .from("test_cases")
    .insert({
      project_id: projectId,
      title,
      preconditions: preconditions || null,
      steps,
      expected_result: expectedResult,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/test-cases/new?error=${encodeURIComponent(error?.message ?? "No se pudo crear el caso de prueba")}`,
    );
  }

  redirect(`/test-cases/${data.id}`);
}
