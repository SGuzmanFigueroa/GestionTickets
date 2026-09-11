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

// "Líder" is profiles.role === "lider" — same shared role, assigned right
// here on /admin/users alongside QA/Developer/Backend/Frontend. A leader
// isn't a bug-tracker admin: they can reassign tickets and assign
// non-elevated roles, enforced at the RLS layer (is_leader()), not just
// this app-level check.
export async function requireAdminOrLeader(): Promise<{ profile: Profile; isAdmin: boolean }> {
  const profile = await requireProfile();
  if (profile.role === "admin") return { profile, isAdmin: true };
  if (profile.role === "lider") return { profile, isAdmin: false };
  redirect("/dashboard");
}
