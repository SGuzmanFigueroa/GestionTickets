"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ImagePasteUpload({ name }: { name: string }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItem = [...items].find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;

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

  function removeImage(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  return (
    <div>
      <div
        onPaste={handlePaste}
        tabIndex={0}
        className="flex min-h-[60px] cursor-text items-center justify-center rounded-md border border-dashed border-slate-300 px-3 py-3 text-center text-sm text-slate-400 outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500"
      >
        {uploading ? "Subiendo imagen..." : "Haz click aquí y pega una captura con Ctrl+V"}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

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
                onClick={() => removeImage(url)}
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
