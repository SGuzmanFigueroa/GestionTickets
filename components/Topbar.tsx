"use client";

import { usePathname } from "next/navigation";
import AppSwitcher from "./AppSwitcher";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import type { Profile } from "@/lib/types";

const SEGMENT_LABELS: { test: (path: string) => boolean; label: string }[] = [
  { test: (p) => p === "/dashboard", label: "Tickets" },
  { test: (p) => p === "/tickets/new", label: "Nuevo ticket" },
  { test: (p) => /^\/tickets\/[^/]+$/.test(p), label: "Detalle de ticket" },
  { test: (p) => p === "/test-cases", label: "Casos de prueba" },
  { test: (p) => p === "/test-cases/new", label: "Nuevo caso de prueba" },
  { test: (p) => /^\/test-cases\/[^/]+$/.test(p), label: "Detalle de caso" },
  { test: (p) => p === "/admin/projects", label: "Proyectos" },
  { test: (p) => p === "/admin/users", label: "Usuarios y roles" },
];

export default function Topbar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const current = SEGMENT_LABELS.find((s) => s.test(pathname))?.label ?? "";

  return (
    <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-slate-200 bg-nexa-gray/80 px-8 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 md:flex">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        <span className="text-slate-400 dark:text-slate-500">Nexa Tracker</span>
        {current && (
          <>
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">/</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{current}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <AppSwitcher />
        <ThemeToggle />
        <NotificationBell />
        <UserMenu profile={profile} />
      </div>
    </div>
  );
}
