"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireProfile } from "@/lib/auth";
import { canManageProject } from "@/lib/project-permissions";

const FILTER_KEYS = ["view", "source"] as const;

/** Vuelve al checklist del proyecto conservando los filtros, con un mensaje. */
function back(formData: FormData, kind: "success" | "error", message: string): never {
  const projectId = String(formData.get("project_id") ?? "");
  const current = new URLSearchParams(String(formData.get("return_query") ?? ""));
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = current.get(key);
    if (value) params.set(key, value);
  }
  params.set(kind, message);
  redirect(`/progress/${projectId}?${params.toString()}`);
}

function cleanUrl(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export async function toggleRequirement(formData: FormData) {
  const profile = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const done = formData.get("done") === "true";

  if (!(await canManageProject(profile, projectId))) {
    back(formData, "error", "Solo un admin o el líder del proyecto puede marcar avances.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_requirements")
    .update({
      done,
      done_by: done ? profile.id : null,
      done_at: done ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) back(formData, "error", error.message);

  // Sin redirect: la página se refresca en su lugar y los filtros quedan igual.
  revalidatePath(`/progress/${projectId}`);
  revalidatePath("/progress");
}

export async function addRequirements(formData: FormData) {
  const profile = await requireProfile();
  const projectId = String(formData.get("project_id") ?? "");
  const source = formData.get("source") === "figma" ? "figma" : "mvp";
  const section = String(formData.get("section") ?? "").trim() || null;
  const figmaUrl = cleanUrl(formData.get("figma_url"));
  // Una línea = un punto del checklist, así se puede pegar la lista del MVP completa.
  const titles = String(formData.get("titles") ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)]|\[\s?[xX ]?\])\s*/, "").trim())
    .filter(Boolean);

  if (!(await canManageProject(profile, projectId))) {
    back(formData, "error", "Solo un admin o el líder del proyecto puede editar el checklist.");
  }
  if (titles.length === 0) {
    back(formData, "error", "Escribe al menos un punto (uno por línea).");
  }

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("project_requirements")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.position ?? 0) + 1;

  const { error } = await supabase.from("project_requirements").insert(
    titles.map((title, i) => ({
      project_id: projectId,
      title,
      section,
      source,
      figma_url: figmaUrl,
      position: start + i,
      created_by: profile.id,
    })),
  );

  if (error) back(formData, "error", error.message);

  revalidatePath("/progress");
  back(formData, "success", titles.length === 1 ? "Punto agregado." : `${titles.length} puntos agregados.`);
}

export async function deleteRequirement(formData: FormData) {
  const profile = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");

  if (!(await canManageProject(profile, projectId))) {
    back(formData, "error", "Solo un admin o el líder del proyecto puede editar el checklist.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_requirements").delete().eq("id", id);
  if (error) back(formData, "error", error.message);

  revalidatePath("/progress");
  back(formData, "success", "Punto eliminado.");
}

export async function updateProjectLinks(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ figma_url: cleanUrl(formData.get("figma_url")), mvp_url: cleanUrl(formData.get("mvp_url")) })
    .eq("id", projectId);

  if (error) back(formData, "error", error.message);

  revalidatePath("/progress");
  back(formData, "success", "Links del proyecto guardados.");
}
