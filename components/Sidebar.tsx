"use client";

import { useState } from "react";
import { signOut } from "@/app/login/actions";
import { ROLE_LABELS, type Profile } from "@/lib/types";
import NavLink from "./NavLink";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

export default function Sidebar({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {/* Barra superior en móvil */}
      <div className="flex items-center justify-between bg-nexa-navy px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-nexa-sky to-nexa-blue text-sm font-bold text-white">
            N
          </span>
          <p className="text-sm font-semibold text-white">Nexa Tracker</p>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell
            buttonClassName="text-white hover:bg-white/10"
            panelAlign="right"
          />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="rounded-md p-2 text-white hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Fondo oscuro al abrir el menú en móvil */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col justify-between bg-nexa-navy px-4 py-6 transition-transform duration-200 md:static md:z-auto md:w-60 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="mb-8 flex items-center gap-2 px-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-nexa-sky to-nexa-blue text-sm font-bold text-white">
              N
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-white">Nexa Tracker</p>
              <p className="text-xs leading-tight text-blue-200/70">Bugs · QA</p>
            </div>
          </div>

          <nav className="space-y-1">
            <NavLink href="/dashboard" onNavigate={close}>
              Tickets
            </NavLink>
            <NavLink href="/tickets/new" onNavigate={close}>
              + Nuevo ticket
            </NavLink>
            <NavLink href="/test-cases" onNavigate={close}>
              Casos de prueba
            </NavLink>

            {profile.role === "admin" && (
              <div className="mt-6 space-y-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-blue-200/50">
                  Admin
                </p>
                <NavLink href="/admin/projects" onNavigate={close}>
                  Apps / Proyectos
                </NavLink>
                <NavLink href="/admin/users" onNavigate={close}>
                  Usuarios y roles
                </NavLink>
              </div>
            )}
          </nav>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 px-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nexa-sky/20 text-xs font-semibold text-nexa-sky">
              {(profile.full_name ?? profile.email).slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {profile.full_name ?? profile.email}
              </p>
              <p className="text-xs text-blue-200/70">{ROLE_LABELS[profile.role]}</p>
            </div>
          </div>
          <ThemeToggle />
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-md px-3 py-1.5 text-left text-sm text-blue-200/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
