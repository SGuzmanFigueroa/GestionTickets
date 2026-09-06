import "server-only";
import { createClient } from "@supabase/supabase-js";

// Uses the service_role key to bypass RLS. Only ever import this from
// Server Actions / Route Handlers — never from a Client Component, and
// never expose SUPABASE_SERVICE_ROLE_KEY with a NEXT_PUBLIC_ prefix.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor.",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
