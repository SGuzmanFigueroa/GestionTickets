"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Zona para adjuntar capturas: arrastrar y soltar, elegir archivo o pegar con
 * Ctrl+V. Sube a Supabase Storage y deja las URLs en un input oculto `name`.
 * - compact: una sola línea (cuando el ticket ya tiene adjuntos).
 * - autoSubmit: envía el formulario contenedor apenas termina de subir.
 */
export default function ImagePasteUpload({
  name,
  compact = false,
  autoSubmit = false,
}: {
  name: string;
  compact?: boolean;
  autoSubmit?: boolean;
}) {
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) {
      setError("Solo se pueden adjuntar imágenes.");
      return;
    }

    setUploading(true);
    setError(null);
    const supabase = createClient();
    const uploaded: string[] = [];

    for (const file of images) {
      const ext = file.type.split("/")[1] ?? "png";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("ticket-images").upload(path, file);
      if (uploadError) {
        setError("No se pudo subir una de las imágenes.");
      } else {
        uploaded.push(supabase.storage.from("ticket-images").getPublicUrl(path).data.publicUrl);
      }
    }

    setUploading(false);
    if (autoSubmit) {
      // Se envía solo lo recién subido (sin guardarlo en el estado), así no se
      // vuelve a adjuntar en la próxima subida.
      const hidden = hiddenRef.current;
      if (hidden && uploaded.length > 0) {
        hidden.value = uploaded.join(",");
        hidden.form?.requestSubmit();
      }
    } else {
      setUrls((prev) => [...prev, ...uploaded]);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const files = [...(e.clipboardData?.items ?? [])]
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (files.length === 0) return;
    e.preventDefault();
    void uploadFiles(files);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    void uploadFiles([...(e.dataTransfer.files ?? [])]);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    void uploadFiles([...(e.target.files ?? [])]);
    e.target.value = "";
  }

  return (
    <div>
      <div
        onPaste={handlePaste}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        tabIndex={0}
        role="button"
        aria-label="Adjuntar captura: arrastra, haz clic para elegir o pega con Ctrl + V"
        aria-busy={uploading}
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed text-center text-sm outline-none transition-colors focus-visible:border-nexa-blue focus-visible:ring-2 focus-visible:ring-nexa-blue/20 ${
          compact ? "min-h-10 px-3 py-2" : "min-h-[88px] flex-col px-3 py-4"
        } ${
          dragOver
            ? "border-nexa-blue bg-nexa-light/50 dark:bg-blue-950/30"
            : "border-slate-300 text-slate-500 hover:border-nexa-blue/60 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800/60"
        }`}
      >
        {uploading ? (
          <span className="text-slate-500">Subiendo…</span>
        ) : compact ? (
          <span className="text-xs">
            <span className="font-medium text-nexa-blue dark:text-blue-300">Agregar captura</span> · arrastra, elige o pega con Ctrl + V
          </span>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-slate-400">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="9" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 18l5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="font-medium text-slate-600 dark:text-slate-300">Arrastra capturas aquí o haz clic para elegir</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">También puedes pegar una imagen con Ctrl + V</span>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {!autoSubmit && urls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Captura adjunta" className="h-20 w-28 rounded-md border border-slate-200 object-cover dark:border-slate-700" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUrls((prev) => prev.filter((u) => u !== url));
                }}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                aria-label="Quitar imagen"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <input ref={hiddenRef} type="hidden" name={name} value={urls.join(",")} />
    </div>
  );
}
