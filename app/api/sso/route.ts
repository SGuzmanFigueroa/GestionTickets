import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Inicio de sesión compartido entre las apps de Nexa (Equipo Nexa ⇄ Nexa
// Tracker). Viven en dominios distintos, así que no pueden compartir la
// cookie de sesión. La app de origen manda aquí el access_token de su
// sesión (vía /auth/sso#access_token=...); lo validamos contra el mismo
// proyecto Supabase y le creamos a este dominio una sesión PROPIA con un
// magic link generado en el servidor (nunca se envía correo). No se
// reutiliza el refresh_token de la otra app: compartirlo haría que la
// detección de reuso de Supabase cerrara la sesión en ambas.
// Requiere SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del
// servidor (Netlify); sin ella responde 503 y /auth/sso manda a /login.
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const accessToken = typeof body?.access_token === "string" ? body.access_token : "";
  if (!accessToken) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);
  if (error || !user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  // Ya hay sesión aquí con la misma cuenta: nada que hacer.
  const { data: current } = await supabase.auth.getClaims();
  if (current?.claims?.sub === user.id) return NextResponse.json({ ok: true });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return NextResponse.json({ ok: false }, { status: 503 });

  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) return NextResponse.json({ ok: false }, { status: 500 });

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyError) return NextResponse.json({ ok: false }, { status: 500 });

  return NextResponse.json({ ok: true });
}
