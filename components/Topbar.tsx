"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AppSwitcher from "./AppSwitcher";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import type { Profile } from "@/lib/types";

// Migas por sección: [etiqueta de sección, href, subpágina].
const SECTIONS: { test: (path: string) => boolean; crumbs: { label: string; href?: string }[] }[] = [
  { test: (p) => p === "/dashboard", crumbs: [{ label: "Tickets" }] },
  { test: (p) => p === "/board", crumbs: [{ label: "Tablero" }] },
  { test: (p) => p === "/tickets/new", crumbs: [{ label: "Tickets", href: "/dashboard" }, { label: "Nuevo ticket" }] },
  { test: (p) => p === "/test-cases", crumbs: [{ label: "Casos de prueba" }] },
  { test: (p) => p === "/test-cases/new", crumbs: [{ label: "Casos de prueba", href: "/test-cases" }, { label: "Nuevo caso" }] },
  { test: (p) => /^\/test-cases\/[^/]+$/.test(p), crumbs: [{ label: "Casos de prueba", href: "/test-cases" }, { label: "Detalle" }] },
  { test: (p) => p === "/progress", crumbs: [{ label: "Progreso" }] },
  { test: (p) => /^\/progress\/[^/]+$/.test(p), crumbs: [{ label: "Progreso", href: "/progress" }, { label: "Checklist" }] },
  { test: (p) => p === "/admin/projects", crumbs: [{ label: "Admin" }, { label: "Proyectos" }] },
  { test: (p) => p === "/admin/users", crumbs: [{ label: "Admin" }, { label: "Usuarios y roles" }] },
];

function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" enfoca el buscador desde cualquier parte (salvo mientras se escribe).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable='true']");
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = inputRef.current?.value.trim() ?? "";
        router.push(q ? `/dashboard?q=${encodeURIComponent(q)}` : "/dashboard");
      }}
      className="relative w-full max-w-sm"
    >
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        key={pathname === "/dashboard" ? searchParams.get("q") ?? "" : "other"}
        defaultValue={pathname === "/dashboard" ? searchParams.get("q") ?? "" : ""}
        type="search"
        placeholder="Buscar tickets por código, título o persona…"
        aria-label="Buscar tickets"
        className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-9 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      <kbd
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 px-1.5 text-[10px] font-medium text-slate-400 dark:border-slate-600"
        aria-hidden="true"
      >
        /
      </kbd>
    </form>
  );
}

export default function Topbar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const crumbs = SECTIONS.find((s) => s.test(pathname))?.crumbs ?? [];

  return (
    <header className="sticky top-0 z-30 hidden h-12 items-center gap-4 border-b border-slate-200 bg-white/90 px-5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 md:flex">
      <nav aria-label="Ruta" className="hidden min-w-0 shrink-0 text-sm lg:block">
        <ol className="flex items-center gap-1.5">
          {crumbs.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">/</span>}
              {c.href ? (
                <Link href={c.href} className="text-slate-500 hover:text-nexa-blue hover:underline dark:text-slate-400">
                  {c.label}
                </Link>
              ) : (
                <span
                  className={i === crumbs.length - 1 ? "font-medium text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}
                  aria-current={i === crumbs.length - 1 ? "page" : undefined}
                >
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-1 justify-center">
        <GlobalSearch />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href="/tickets/new"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-nexa-blue px-3 text-sm font-medium text-white transition-colors hover:bg-nexa-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 focus-visible:ring-offset-2"
        >
          <PlusIcon /> <span className="hidden xl:inline">Crear ticket</span>
          <span className="xl:hidden">Crear</span>
        </Link>
        <AppSwitcher />
        <ThemeToggle />
        <NotificationBell />
        <UserMenu profile={profile} />
      </div>
    </header>
  );
}
