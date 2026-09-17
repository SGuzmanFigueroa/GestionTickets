"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ImagePasteUpload({ name }: { name: string }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.type.split("/")[1] ?? "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("ticket-images")
      .upload(path, file);

    if (uploadError) {
      setError("No se pudo subir la imagen.");
    } else {
      const { data } = supabase.storage.from("ticket-images").getPublicUrl(path);
      setUrls((prev) => [...prev, data.publicUrl]);
    }
    setUploading(false);
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItem = [...items].find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) await uploadFile(file);
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  }

  async function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
    e.target.value = "";
  }

  function removeImage(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  return (
    <div>
      <div
        onPaste={handlePaste}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        tabIndex={0}
        role="button"
        aria-label="Adjuntar captura de pantalla"
        className={`flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border border-dashed px-3 py-4 text-center text-sm outline-none transition-colors focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 ${
          dragOver
            ? "border-nexa-blue bg-nexa-light/50 dark:bg-blue-950/30"
            : "border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500"
        }`}
      >
        {uploading ? (
          "Subiendo imagen..."
        ) : (
          <>
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Arrastra una captura aquí o haz clic para seleccionar
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              También puedes pegar una imagen con Ctrl + V
            </span>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {urls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Captura adjunta"
                className="h-16 w-16 rounded-md border border-slate-200 object-cover dark:border-slate-700"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(url);
                }}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Quitar imagen"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <input type="hidden" name={name} value={urls.join(",")} />
    </div>
  );
}
