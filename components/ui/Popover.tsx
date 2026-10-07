"use client";

import { useEffect, useRef, useState } from "react";

/** Abre/cierra un popover; se cierra al hacer clic fuera o con Escape. */
export function usePopover<T extends HTMLElement = HTMLDivElement>() {
  const [open, setOpen] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, ref };
}

/**
 * Navegación con flechas entre las opciones (role="option") de un listbox.
 * Enfoca la opción seleccionada (o la primera) al abrir.
 */
export function useListboxKeys(open: boolean) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const options = () => [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const selected = options().find((o) => o.getAttribute("aria-selected") === "true");
    // Si hay un buscador dentro, el foco va al buscador (lo maneja quien lo renderiza).
    if (!listRef.current.closest("[data-has-search]")) (selected ?? options()[0])?.focus();
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[Math.min(items.length - 1, index + 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[Math.max(0, index - 1)]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  }

  return { listRef, onKeyDown };
}

export const POPOVER_PANEL =
  "absolute z-40 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800";

export const POPOVER_OPTION =
  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700 outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 aria-selected:bg-nexa-light/70 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:bg-slate-700 dark:aria-selected:bg-blue-950/50";
