import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Misma regla que can_manage_project() en la base (0012_project_requirements.sql):
// admin, cualquier líder o el líder asignado al proyecto.
export function canManageProjectWith(profile: Pick<Profile, "id" | "role">, leaderId: string | null) {
  return profile.role === "admin" || profile.role === "lider" || (leaderId !== null && leaderId === profile.id);
}

export async function canManageProject(profile: Pick<Profile, "id" | "role">, projectId: string) {
  if (profile.role === "admin" || profile.role === "lider") return true;
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("leader_id").eq("id", projectId).maybeSingle();
  return canManageProjectWith(profile, data?.leader_id ?? null);
}
