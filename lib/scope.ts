import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Alcance de lo que ve cada rol (la base de datos lo aplica con RLS; esto
// solo arma los selectores y listas de la interfaz para que coincidan):
// - admin: todos los proyectos y todas las personas.
// - resto (líder y miembros): solo sus proyectos (Equipo Nexa + líder asignado)
//   y la gente que comparte esos proyectos.

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface Scope {
  isAdmin: boolean;
  /** null = sin límite (admin). */
  projectIds: Set<string> | null;
  /** null = sin límite (admin). */
  personIds: Set<string> | null;
}

export async function getScope(supabase: Supabase, profile: Pick<Profile, "role">): Promise<Scope> {
  if (profile.role === "admin") return { isAdmin: true, projectIds: null, personIds: null };
  const [{ data: projectIds }, { data: personIds }] = await Promise.all([
    supabase.rpc("my_project_ids"),
    supabase.rpc("my_project_member_ids"),
  ]);
  return {
    isAdmin: false,
    projectIds: new Set((projectIds as string[] | null) ?? []),
    personIds: new Set((personIds as string[] | null) ?? []),
  };
}

export const inScope = (set: Set<string> | null, id: string | null | undefined) => set === null || (!!id && set.has(id));
