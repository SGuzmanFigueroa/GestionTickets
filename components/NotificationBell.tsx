"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ActivityItem } from "@/app/api/activity/route";

const LAST_SEEN_KEY = "activity_last_seen";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/activity");
      const data = await res.json();
      const list: ActivityItem[] = data.items ?? [];
      setItems(list);

      let lastSeen = "";
      try {
        lastSeen = localStorage.getItem(LAST_SEEN_KEY) ?? "";
      } catch {
        // ignore
      }
      setUnread(list.filter((i) => !lastSeen || i.created_at > lastSeen).length);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch-on-mount: setLoading(true) runs synchronously before the first
    // await, which is the standard data-fetching-effect idiom.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items.length > 0) {
      setUnread(0);
      try {
        localStorage.setItem(LAST_SEEN_KEY, items[0].created_at);
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notificaciones"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-blue-100/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 8a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z"
          />
          <path
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M10 20a2 2 0 004 0"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Actividad reciente
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <p className="px-3 py-4 text-sm text-slate-400">Cargando...</p>
            )}
            {!loading && items.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-400">Todavía no hay actividad.</p>
            )}
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block border-b border-slate-50 px-3 py-2.5 text-sm text-slate-700 last:border-b-0 hover:bg-nexa-light/40 dark:border-slate-700/50 dark:text-slate-200 dark:hover:bg-slate-700/40"
              >
                <p>{item.text}</p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  {new Date(item.created_at).toLocaleString("es-PE", {
                    timeZone: "America/Lima",
                  })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
