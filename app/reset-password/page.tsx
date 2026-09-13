"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Clicking the recovery link logs the browser in via a temporary session;
    // Supabase fires this event once that session is established.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("ready");
    });

    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "invalid" : current));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // The recovery link leaves the browser signed in; sign out so the
    // redirect below actually lands on /login instead of being bounced
    // to /dashboard by the proxy's "already authenticated" rule.
    await supabase.auth.signOut();

    router.push(
      `/login?message=${encodeURIComponent("Contraseña actualizada. Ya puedes iniciar sesión.")}`,
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-nexa-navy via-nexa-blue to-nexa-sky px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white ring-1 ring-white/30">
            N
          </span>
          <h1 className="text-2xl font-semibold text-white">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-blue-100/80">Nexa Bug Tracker</p>
        </div>

        <div className="rounded-xl border border-white/20 bg-white p-5 shadow-xl shadow-nexa-navy/20">
          {status === "checking" && (
            <p className="text-sm text-slate-500">Verificando el link...</p>
          )}

          {status === "invalid" && (
            <div className="space-y-3 text-sm">
              <p className="text-red-600">
                Este link no es válido o ya expiró. Solicita uno nuevo desde la pantalla de inicio
                de sesión.
              </p>
              <a href="/login" className="font-medium text-nexa-blue hover:underline">
                Volver a iniciar sesión
              </a>
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <h2 className="text-sm font-medium text-slate-700">Elige tu nueva contraseña</h2>
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
              />
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-nexa-blue px-3 py-2 text-sm font-medium text-white shadow-sm shadow-nexa-blue/30 transition-colors hover:bg-nexa-navy disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
