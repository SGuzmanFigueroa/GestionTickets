import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// cache(): the layout and the page share one auth check + one profiles
// query per request instead of repeating both round trips to Supabase.
// getClaims() verifies the JWT locally when the project uses asymmetric
// signing keys (falls back to a getUser() network call otherwise).
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", userId)
    .single();

  return profile as Profile | null;
});

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
