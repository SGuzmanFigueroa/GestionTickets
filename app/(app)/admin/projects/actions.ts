"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProject(formData: FormData) {
  const profile = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    redirect(`/admin/projects?error=${encodeURIComponent("Ponle un nombre a la app.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({
    name,
    slug: slugify(name),
    description: description || null,
    created_by: profile.id,
  });

  if (error) {
    redirect(`/admin/projects?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/projects?success=${encodeURIComponent("App agregada.")}`);
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    redirect(`/admin/projects?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/projects?success=${encodeURIComponent("App eliminada.")}`);
}
