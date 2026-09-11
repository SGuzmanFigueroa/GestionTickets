import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

// "Líder" is defined in equipo-nexa's schema (team_members.is_leader), not
// here — both apps share the same Supabase project, so this just checks the
// same flag. A leader isn't a bug-tracker admin: they can reassign tickets
// and assign non-admin roles, enforced at the RLS layer (is_leader()), not
// just this app-level check.
export async function isLeader(profileId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("id")
    .eq("profile_id", profileId)
    .eq("is_leader", true)
    .maybeSingle();
  return Boolean(data);
}

export async function requireAdminOrLeader(): Promise<{ profile: Profile; isAdmin: boolean }> {
  const profile = await requireProfile();
  if (profile.role === "admin") return { profile, isAdmin: true };
  if (await isLeader(profile.id)) return { profile, isAdmin: false };
  redirect("/dashboard");
}
