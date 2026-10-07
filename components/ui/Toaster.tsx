"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TOAST_EVENT, type ToastDetail } from "@/lib/toast";

interface Item extends ToastDetail {
  id: number;
}

const DURATION = { success: 3500, error: 7000 } as const;

/** Pila de toasts (esquina inferior derecha). Montado una vez en el layout de la app. */
export default function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  const nextId = useRef(1);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback(
    ({ message, kind }: ToastDetail) => {
      const id = nextId.current++;
      setItems((all) => [...all.slice(-3), { id, message, kind }]);
      setTimeout(() => dismiss(id), DURATION[kind]);
    },
    [dismiss],
  );

  useEffect(() => {
    const onToast = (e: Event) => push((e as CustomEvent<ToastDetail>).detail);
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, [push]);

  // ?success= / ?error= de las server actions → toast, y se limpian de la URL
  // (conservando el resto de filtros).
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (!success && !error) return;
    queueMicrotask(() => {
      if (success) push({ message: success, kind: "success" });
      if (error) push({ message: error, kind: "error" });
    });
    const rest = new URLSearchParams(searchParams.toString());
    rest.delete("success");
    rest.delete("error");
    const qs = rest.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, pathname, router, push]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-lg motion-safe:animate-[toast-in_180ms_ease-out] sm:w-auto ${
            t.kind === "error"
              ? "border-red-200 bg-white text-red-700 dark:border-red-900/60 dark:bg-slate-800 dark:text-red-300"
              : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          }`}
        >
          <span
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
              t.kind === "error" ? "bg-red-500" : "bg-emerald-500"
            }`}
            aria-hidden="true"
          >
            {t.kind === "error" ? "!" : "✓"}
          </span>
          <span className="min-w-0 flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Cerrar aviso"
            className="-mr-1 rounded p-0.5 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:hover:text-slate-200"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
