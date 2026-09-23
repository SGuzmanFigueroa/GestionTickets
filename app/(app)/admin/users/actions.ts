"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireAdminOrLeader } from "@/lib/auth";
import { USER_ROLES } from "@/lib/types";

// Filtros de /admin/users que deben sobrevivir al guardar un cambio.
const FILTER_KEYS = ["role", "project"] as const;

/** Vuelve a /admin/users con los filtros que tenía el usuario y un mensaje. */
function back(formData: FormData, kind: "success" | "error", message: string): never {
  const current = new URLSearchParams(String(formData.get("return_query") ?? ""));
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = current.get(key);
    if (value) params.set(key, value);
  }
  params.set(kind, message);
  redirect(`/admin/users?${params.toString()}`);
}

export async function updateUserRole(formData: FormData) {
  const { isAdmin } = await requireAdminOrLeader();
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
    back(formData, "error", "Rol inválido.");
  }

  if (!isAdmin && (role === "admin" || role === "lider")) {
    back(formData, "error", "Solo un admin puede asignar admin o líder.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);

  if (error) {
    back(formData, "error", error.message);
  }

  back(formData, "success", "Rol actualizado.");
}

export async function updateUserDiscordId(formData: FormData) {
  await requireAdminOrLeader();
  const userId = String(formData.get("user_id") ?? "");
  const raw = String(formData.get("discord_id") ?? "").trim();

  if (raw && !/^\d{15,25}$/.test(raw)) {
    back(
      formData,
      "error",
      "El Discord ID debe ser solo numeros (clic derecho al usuario en Discord, con Modo Desarrollador activado, Copiar ID de usuario).",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ discord_id: raw || null })
    .eq("id", userId);

  if (error) {
    const message = error.code === "23505" ? "Ese Discord ID ya esta vinculado a otro usuario." : error.message;
    back(formData, "error", message);
  }

  back(formData, "success", "Discord ID actualizado.");
}

export async function deleteUser(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");

  if (!userId || userId === admin.id) {
    back(formData, "error", "No puedes eliminar tu propia cuenta.");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    back(
      formData,
      "error",
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor para poder eliminar cuentas.",
    );
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    // Normalmente es una llave foránea: la persona creó registros (proyectos,
    // integrantes en Equipo Nexa, movimientos en Nexa Core) que la referencian.
    const message = /database error/i.test(error.message)
      ? "No se pudo eliminar: esta persona creó proyectos o registros en Equipo Nexa / Nexa Core que dependen de su cuenta."
      : error.message;
    back(formData, "error", message);
  }

  back(formData, "success", "Usuario eliminado.");
}
