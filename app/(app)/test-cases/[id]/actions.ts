"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function updateTestCase(formData: FormData) {
  await requireProfile();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const preconditions = String(formData.get("preconditions") ?? "").trim();
  const steps = String(formData.get("steps") ?? "").trim();
  const expectedResult = String(formData.get("expected_result") ?? "").trim();

  if (!title || !steps || !expectedResult) {
    redirect(
      `/test-cases/${id}?error=${encodeURIComponent("Completa título, pasos y resultado esperado.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("test_cases")
    .update({
      title,
      preconditions: preconditions || null,
      steps,
      expected_result: expectedResult,
    })
    .eq("id", id);

  if (error) {
    redirect(`/test-cases/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/test-cases/${id}?success=${encodeURIComponent("Cambios guardados.")}`);
}

export async function recordTestCaseRun(formData: FormData) {
  const profile = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("test_cases")
    .update({
      status,
      last_run_by: profile.id,
      last_run_at: new Date().toISOString(),
      last_run_notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    redirect(`/test-cases/${id}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/test-cases/${id}?success=${encodeURIComponent("Resultado registrado.")}`);
}
