"use client";

import { useId, useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { requestPasswordReset, signIn, signUp } from "@/app/login/actions";

type View = "signin" | "signup" | "reset";

const INPUT =
  "h-11 w-full rounded-[10px] border border-slate-300 bg-white px-3.5 text-[14.5px] text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 hover:border-slate-400 focus:border-nexa-blue focus:ring-[3px] focus:ring-nexa-blue/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500";
const LABEL = "mb-1.5 block text-[13px] font-semibold text-slate-700 dark:text-slate-200";
const BUTTON = "h-11 w-full rounded-[10px] text-[14.5px] font-semibold";

function Field({
  label,
  hint,
  children,
  id,
}: {
  label: string;
  hint?: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  minLength,
  hint,
}: {
  id: string;
  label: string;
  autoComplete: string;
  minLength?: number;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field id={id} label={label} hint={hint}>
      <div className="relative">
        <input
          id={id}
          name="password"
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          aria-describedby={hint ? `${id}-hint` : undefined}
          placeholder="Ingresa tu contraseña"
          className={`${INPUT} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:hover:text-slate-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {visible ? (
              <>
                <path d="M3.5 3.5l17 17" />
                <path d="M10.6 5.7A10.7 10.7 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a15.6 15.6 0 0 1-3.4 4.2M6.4 6.8C3.7 8.6 2 12 2 12s3.6 6.5 10 6.5a10 10 0 0 0 4.2-.9" />
                <path d="M9.9 10.1a3 3 0 0 0 4.1 4.1" />
              </>
            ) : (
              <>
                <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
    </Field>
  );
}

function Notice({ kind, children }: { kind: "error" | "info"; children: React.ReactNode }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`mb-5 flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-[13px] leading-snug ${
        kind === "error"
          ? "border-red-100 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          : "border-blue-100 bg-nexa-light text-nexa-blue dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-px shrink-0" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        {kind === "error" ? (
          <>
            <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16" r="0.9" fill="currentColor" />
          </>
        ) : (
          <path d="M8.5 12.2l2.3 2.3 4.7-4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      <span>{children}</span>
    </div>
  );
}

export default function AuthCard({ error, message }: { error?: string; message?: string }) {
  const [view, setView] = useState<View>("signin");
  const uid = useId();
  const id = (name: string) => `${uid}-${view}-${name}`;

  const tab = (value: Exclude<View, "reset">, label: string) => {
    const active = view === value || (value === "signin" && view === "reset");
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => setView(value)}
        className={`h-9 flex-1 rounded-lg text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 ${
          active
            ? "bg-white text-nexa-navy shadow-sm dark:bg-slate-700 dark:text-white"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(10,31,68,0.04),0_16px_40px_-20px_rgba(10,31,68,0.25)] dark:border-slate-700 dark:bg-slate-800 sm:p-8">
      <div role="tablist" aria-label="Acceso" className="mb-6 flex gap-1 rounded-[10px] bg-slate-100 p-1 dark:bg-slate-900/60">
        {tab("signin", "Iniciar sesión")}
        {tab("signup", "Crear cuenta")}
      </div>

      {error && <Notice kind="error">{error}</Notice>}
      {message && <Notice kind="info">{message}</Notice>}

      {view === "signin" && (
        <form action={signIn} className="space-y-4">
          <div className="pb-1">
            <h1 className="text-[22px] font-bold tracking-tight text-nexa-navy dark:text-white">Bienvenido de vuelta</h1>
            <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">Entra para ver y trabajar tus tickets.</p>
          </div>
          <Field id={id("email")} label="Correo electrónico">
            <input
              id={id("email")}
              name="email"
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              spellCheck={false}
              placeholder="Ingresa tu correo"
              className={INPUT}
            />
          </Field>
          <PasswordField id={id("password")} label="Contraseña" autoComplete="current-password" />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setView("reset")}
              className="rounded text-[13px] font-medium text-nexa-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:text-blue-300"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <SubmitButton variant="primary" pendingLabel="Entrando..." className={BUTTON}>
            Entrar
          </SubmitButton>
        </form>
      )}

      {view === "signup" && (
        <form action={signUp} className="space-y-4">
          <div className="pb-1">
            <h1 className="text-[22px] font-bold tracking-tight text-nexa-navy dark:text-white">Crea tu cuenta</h1>
            <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">
              Entras como QA; un admin te asigna tu rol (Backend, Frontend, Marketing…).
            </p>
          </div>
          <Field id={id("name")} label="Nombre completo">
            <input
              id={id("name")}
              name="full_name"
              type="text"
              required
              autoComplete="name"
              placeholder="Ingresa tu nombre y apellido"
              className={INPUT}
            />
          </Field>
          <Field id={id("email")} label="Correo electrónico">
            <input
              id={id("email")}
              name="email"
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              spellCheck={false}
              placeholder="Ingresa tu correo"
              className={INPUT}
            />
          </Field>
          <PasswordField
            id={id("password")}
            label="Contraseña"
            autoComplete="new-password"
            minLength={6}
            hint="Mínimo 6 caracteres."
          />
          <SubmitButton variant="dark" pendingLabel="Creando cuenta..." className={BUTTON}>
            Crear cuenta
          </SubmitButton>
        </form>
      )}

      {view === "reset" && (
        <form action={requestPasswordReset} className="space-y-4">
          <div className="pb-1">
            <h1 className="text-[22px] font-bold tracking-tight text-nexa-navy dark:text-white">Recupera tu contraseña</h1>
            <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">
              Te enviaremos un link para elegir una nueva. Puedes abrirlo desde cualquier dispositivo.
            </p>
          </div>
          <Field id={id("email")} label="Correo electrónico">
            <input
              id={id("email")}
              name="email"
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              spellCheck={false}
              placeholder="Ingresa tu correo"
              className={INPUT}
            />
          </Field>
          <SubmitButton variant="primary" pendingLabel="Enviando..." className={BUTTON}>
            Enviar link de recuperación
          </SubmitButton>
          <button
            type="button"
            onClick={() => setView("signin")}
            className="w-full rounded text-center text-[13px] font-medium text-slate-500 hover:text-nexa-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:text-slate-400"
          >
            ← Volver a iniciar sesión
          </button>
        </form>
      )}
    </div>
  );
}
