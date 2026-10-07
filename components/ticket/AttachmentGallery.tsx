"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface AttachmentItem {
  id: string;
  url: string;
  uploadedBy: string | null;
  createdAt: string;
}

/** Las capturas se guardan con un UUID como nombre; mostramos algo legible. */
function fileName(index: number) {
  return `Captura ${index + 1}`;
}

/** Miniaturas grandes; clic para verlas en grande (flechas para navegar, Esc para cerrar). */
export default function AttachmentGallery({ items }: { items: AttachmentItem[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const close = useCallback(() => setIndex(null), []);

  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setIndex((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [index, items.length, close]);

  if (items.length === 0) return null;
  const current = index !== null ? items[index] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {items.map((a, i) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group block w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-nexa-blue/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 dark:border-slate-700 dark:bg-slate-800"
              aria-label={`Ver captura ${i + 1} en grande`}
            >
              <div className="aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
              </div>
              <div className="px-2.5 py-1.5">
                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{fileName(i)}</p>
                <p className="truncate text-[11px] text-slate-400">
                  {[a.uploadedBy, a.createdAt].filter(Boolean).join(" · ")}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {current &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Captura ${index! + 1} de ${items.length}`}
            className="fixed inset-0 z-[80] flex flex-col bg-slate-950/90 p-4"
            onClick={close}
          >
            <div className="flex items-center justify-between gap-3 pb-3 text-sm text-slate-200" onClick={(e) => e.stopPropagation()}>
              <span className="truncate">
                Captura {index! + 1} <span className="text-slate-400">de {items.length}</span>
              </span>
              <div className="flex items-center gap-1">
                <a
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md px-2.5 py-1 text-xs hover:bg-white/10"
                >
                  Abrir original ↗
                </a>
                <button type="button" onClick={close} aria-label="Cerrar" className="rounded-md px-2.5 py-1 text-lg leading-none hover:bg-white/10">
                  ×
                </button>
              </div>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((index! - 1 + items.length) % items.length);
                  }}
                  aria-label="Captura anterior"
                  className="absolute left-0 rounded-full bg-white/10 px-3 py-2 text-xl text-white hover:bg-white/20"
                >
                  ‹
                </button>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.url}
                alt={`Captura ${index! + 1}`}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((index! + 1) % items.length);
                  }}
                  aria-label="Captura siguiente"
                  className="absolute right-0 rounded-full bg-white/10 px-3 py-2 text-xl text-white hover:bg-white/20"
                >
                  ›
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
