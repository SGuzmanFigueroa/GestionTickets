import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Misma regla que can_manage_project() en la base (0020_scope_by_project.sql):
// admin, un líder de ESE proyecto (es parte de él) o el líder asignado.
export function canManageProjectWith(
  profile: Pick<Profile, "id" | "role">,
  leaderId: string | null,
  isMyProject: boolean,
) {
  return (
    profile.role === "admin" ||
    (profile.role === "lider" && isMyProject) ||
    (leaderId !== null && leaderId === profile.id)
  );
}

export async function canManageProject(profile: Pick<Profile, "id" | "role">, projectId: string) {
  if (profile.role === "admin") return true;
  const supabase = await createClient();
  const [{ data }, { data: myProjectIds }] = await Promise.all([
    supabase.from("projects").select("leader_id").eq("id", projectId).maybeSingle(),
    supabase.rpc("my_project_ids"),
  ]);
  const isMyProject = ((myProjectIds as string[] | null) ?? []).includes(projectId);
  return canManageProjectWith(profile, data?.leader_id ?? null, isMyProject);
}
