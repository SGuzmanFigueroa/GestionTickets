import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase's password-recovery (and magic-link) emails redirect here with a
// PKCE `code`. The exchange has to happen server-side so the resulting
// session cookies can be set before the browser ever renders a page —
// doing this in a Client Component can't write cookies.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Links de recuperación sin `code`: la sesión viene en el #hash, que el
  // servidor no ve pero el navegador conserva al seguir este redirect.
  // /reset-password la toma del hash (o muestra que el link expiró).
  if (!code && next === "/reset-password") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Este link no es válido o ya expiró. Pide uno nuevo en ¿Olvidaste tu contraseña?")}`,
  );
}
