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
  const leaderId = String(formData.get("leader_id") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!name) {
    redirect(`/admin/projects?error=${encodeURIComponent("Ponle un nombre a la app.")}`);
  }
  if (!code) {
    redirect(`/admin/projects?error=${encodeURIComponent("Ponle un código corto a la app (ej. INV).")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({
    name,
    slug: slugify(name),
    code,
    description: description || null,
    leader_id: leaderId || null,
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
