"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Recuerda los filtros (query string) y la posición de scroll de una lista.
 * - Al volver a la página sin filtros en la URL (desde el menú, las migas,
 *   tras abrir un ticket…), restaura los últimos filtros usados.
 * - Si la URL ya trae filtros (aunque estén vacíos, ej. "Estado: todos"), los
 *   respeta y los guarda.
 * - "?clear=1" borra lo guardado (botón "Limpiar filtros").
 */
export default function FilterMemory({ storageKey }: { storageKey: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filtersKey = `nexa:filters:${storageKey}`;
  const scrollKey = `nexa:scroll:${storageKey}`;

  useEffect(() => {
    const raw = new URLSearchParams(searchParams.toString());
    raw.delete("success");
    raw.delete("error");

    try {
      if (raw.get("clear") === "1") {
        localStorage.removeItem(filtersKey);
        sessionStorage.removeItem(scrollKey);
        raw.delete("clear");
        const rest = raw.toString();
        router.replace(rest ? `${pathname}?${rest}` : pathname, { scroll: false });
        return;
      }

      if ([...raw.keys()].length === 0) {
        const saved = localStorage.getItem(filtersKey);
        if (saved) router.replace(`${pathname}?${saved}`, { scroll: false });
        return;
      }

      // Guardar solo los filtros con valor; si todos están vacíos, no hay nada que recordar.
      const meaningful = new URLSearchParams([...raw.entries()].filter(([, v]) => v !== ""));
      const value = meaningful.toString();
      if (value) localStorage.setItem(filtersKey, value);
      else localStorage.removeItem(filtersKey);
    } catch {
      // Sin almacenamiento (modo privado): la página funciona igual, solo no recuerda.
    }
  }, [searchParams, pathname, router, filtersKey, scrollKey]);

  // Posición de scroll: se guarda mientras se navega la lista y se restaura al volver.
  useEffect(() => {
    try {
      const y = Number(sessionStorage.getItem(scrollKey));
      if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y));
    } catch {
      // ignorar
    }
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(scrollKey, String(Math.round(window.scrollY)));
        } catch {
          // ignorar
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [scrollKey]);

  return null;
}
