"use client";

import { useEffect, useState } from "react";
import { signOut } from "@/app/login/actions";
import { ROLE_LABELS, type Profile } from "@/lib/types";
import NavLink from "./NavLink";
import ThemeToggle from "./ThemeToggle";
import AppSwitcher from "./AppSwitcher";
import NotificationBell from "./NotificationBell";
import Avatar from "@/components/ui/Avatar";
import { BoardIcon, ClipboardCheckIcon, FolderIcon, PlusIcon, ProgressIcon, TicketIcon, UsersIcon } from "@/components/ui/icons";

import { SIDEBAR_COOKIE } from "@/lib/ui-prefs";

const isTicketsActive = (p: string) => p === "/dashboard" || (p.startsWith("/tickets/") && p !== "/tickets/new");

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : "px-1"}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-nexa-sky to-nexa-blue text-sm font-bold text-white">
        N
      </span>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-white">Nexa Tracker</p>
          <p className="text-[11px] leading-tight text-blue-200/60">Bugs · QA</p>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ collapsed, children }: { collapsed: boolean; children: string }) {
  return collapsed ? (
    <div className="mx-auto my-2 h-px w-6 bg-white/10" aria-hidden="true" />
  ) : (
    <p className="px-2.5 pb-1 pt-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-blue-200/40">{children}</p>
  );
}

export default function Sidebar({
  profile,
  isLeader = false,
  initialCollapsed = false,
}: {
  profile: Profile;
  isLeader?: boolean;
  initialCollapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  }

  const displayName = profile.full_name ?? profile.email;
  // En móvil (drawer) siempre se muestra expandida.
  const c = collapsed && !open;

  const nav = (
    <nav aria-label="Navegación principal" className="space-y-0.5">
      <SectionLabel collapsed={c}>Principal</SectionLabel>
      <NavLink href="/dashboard" icon={<TicketIcon />} onNavigate={close} collapsed={c} match={isTicketsActive}>
        Tickets
      </NavLink>
      <NavLink href="/board" icon={<BoardIcon />} onNavigate={close} collapsed={c}>
        Tablero
      </NavLink>
      <NavLink href="/tickets/new" icon={<PlusIcon />} onNavigate={close} collapsed={c}>
        Nuevo ticket
      </NavLink>
      <NavLink href="/test-cases" icon={<ClipboardCheckIcon />} onNavigate={close} collapsed={c}>
        Casos de prueba
      </NavLink>
      <NavLink href="/progress" icon={<ProgressIcon />} onNavigate={close} collapsed={c}>
        Progreso
      </NavLink>

      {profile.role === "admin" && (
        <>
          <SectionLabel collapsed={c}>Admin</SectionLabel>
          <NavLink href="/admin/projects" icon={<FolderIcon />} onNavigate={close} collapsed={c}>
            Proyectos
          </NavLink>
          <NavLink href="/admin/users" icon={<UsersIcon />} onNavigate={close} collapsed={c}>
            Usuarios y roles
          </NavLink>
        </>
      )}

      {profile.role !== "admin" && isLeader && (
        <>
          <SectionLabel collapsed={c}>Líder</SectionLabel>
          <NavLink href="/admin/users" icon={<UsersIcon />} onNavigate={close} collapsed={c}>
            Usuarios y roles
          </NavLink>
        </>
      )}
    </nav>
  );

  return (
    <>
      {/* Barra superior en móvil */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-nexa-navy px-3 py-2 md:hidden">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="rounded-md p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-sky/60"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <Logo collapsed={false} />
        </div>
        <div className="flex items-center">
          <AppSwitcher buttonClassName="text-white hover:bg-white/10" />
          <ThemeToggle className="text-white hover:bg-white/10" />
          <NotificationBell buttonClassName="text-white hover:bg-white/10" panelAlign="right" />
        </div>
      </div>

      {/* Fondo oscuro al abrir el menú en móvil */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={close} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-nexa-navy py-3 transition-[transform,width] duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 ${
          c ? "px-2 md:w-[60px]" : "px-2.5 md:w-56"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-10 items-center">
          <Logo collapsed={c} />
        </div>

        <div className="mt-1 flex-1 overflow-y-auto">{nav}</div>

        {/* Usuario en móvil (en escritorio está en la barra superior) */}
        <div className="space-y-2 border-t border-white/10 pt-3 md:hidden">
          <div className="flex items-center gap-2 px-1">
            <Avatar name={displayName} className="ring-1 ring-white/10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-blue-200/70">{ROLE_LABELS[profile.role]}</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-md px-2.5 py-1.5 text-left text-sm text-blue-200/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Cerrar sesión
            </button>
          </form>
        </div>

        {/* Colapsar (solo escritorio) */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={c ? "Expandir menú lateral" : "Colapsar menú lateral"}
          title={c ? "Expandir" : "Colapsar"}
          className={`mt-2 hidden h-8 items-center gap-2 rounded-md text-xs text-blue-200/60 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-sky/60 md:flex ${
            c ? "justify-center" : "px-2.5"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={c ? "rotate-180" : ""}>
            <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!c && "Colapsar"}
        </button>
      </aside>
    </>
  );
}
