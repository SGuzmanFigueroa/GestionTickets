"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { USER_ROLES } from "@/lib/types";

export async function updateUserRole(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
    redirect(`/admin/users?error=${encodeURIComponent("Rol inválido.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);

  if (error) {
    redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/users?success=${encodeURIComponent("Rol actualizado.")}`);
}

export async function deleteUser(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");

  if (!userId || userId === admin.id) {
    redirect(`/admin/users?error=${encodeURIComponent("No puedes eliminar tu propia cuenta.")}`);
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/users?success=${encodeURIComponent("Usuario eliminado.")}`);
}
