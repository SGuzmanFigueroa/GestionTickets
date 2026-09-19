"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/login/actions";
import { ROLE_LABELS, type Profile } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";

export default function UserMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName = profile.full_name ?? profile.email;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
      >
        <Avatar name={displayName} />
        <span className="hidden text-left lg:block">
          <span className="block max-w-[180px] truncate text-sm font-medium leading-tight text-slate-800 dark:text-slate-100">
            {displayName}
          </span>
          <span className="block text-xs leading-tight text-slate-400 dark:text-slate-500">
            {ROLE_LABELS[profile.role]}
          </span>
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <Avatar name={displayName} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{displayName}</p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">{profile.email}</p>
              <p className="mt-0.5 text-xs font-medium text-nexa-blue">{ROLE_LABELS[profile.role]}</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
