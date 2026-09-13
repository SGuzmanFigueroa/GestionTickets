import SubmitButton from "@/components/SubmitButton";
import { signIn, signUp, requestPasswordReset } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-nexa-navy via-nexa-blue to-nexa-sky px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white ring-1 ring-white/30">
            N
          </span>
          <h1 className="text-2xl font-semibold text-white">Nexa Bug Tracker</h1>
          <p className="mt-1 text-sm text-blue-100/80">
            Gestión de tickets de bugs para el equipo QA
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 shadow">{error}</div>
        )}
        {message && (
          <div className="rounded-md bg-white px-3 py-2 text-sm text-nexa-blue shadow">
            {message}
          </div>
        )}

        <form
          action={signIn}
          className="space-y-3 rounded-xl border border-white/20 bg-white p-5 shadow-xl shadow-nexa-navy/20"
        >
          <h2 className="text-sm font-medium text-slate-700">Iniciar sesión</h2>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="correo@nexa.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
          />
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Contraseña"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
          />
          <SubmitButton variant="primary" pendingLabel="Entrando..." className="w-full rounded-md px-3 py-2 text-sm font-medium">
            Entrar
          </SubmitButton>
        </form>

        <details className="rounded-xl border border-white/20 bg-white/95 p-5 shadow-lg shadow-nexa-navy/10">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            ¿Olvidaste tu contraseña?
          </summary>
          <form action={requestPasswordReset} className="mt-3 space-y-3">
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="correo@nexa.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            />
            <SubmitButton variant="dark" pendingLabel="Enviando..." className="w-full rounded-md px-3 py-2 text-sm font-medium">
              Enviar link de recuperación
            </SubmitButton>
            <p className="text-xs text-slate-400">
              Te llegará un correo con un link para elegir una nueva contraseña.
            </p>
          </form>
        </details>

        <details className="rounded-xl border border-white/20 bg-white/95 p-5 shadow-lg shadow-nexa-navy/10">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Crear cuenta nueva
          </summary>
          <form action={signUp} className="mt-3 space-y-3">
            <input
              name="full_name"
              type="text"
              required
              autoComplete="name"
              placeholder="Nombre completo"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            />
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="correo@nexa.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            />
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Contraseña (mín. 6 caracteres)"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            />
            <SubmitButton variant="dark" pendingLabel="Creando cuenta..." className="w-full rounded-md px-3 py-2 text-sm font-medium">
              Registrarme
            </SubmitButton>
            <p className="text-xs text-slate-400">
              Las cuentas nuevas entran con rol QA por defecto. Un admin puede cambiar el rol luego
              en Admin → Usuarios.
            </p>
          </form>
        </details>
      </div>
    </div>
  );
}
