"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function SavingIndicator() {
  const { pending } = useFormStatus();
  return pending ? (
    <span className="text-xs text-slate-400 dark:text-slate-500">Guardando...</span>
  ) : null;
}

export default function DiscordIdInput({
  action,
  userId,
  returnQuery = "",
  currentDiscordId,
}: {
  action: (formData: FormData) => void;
  userId: string;
  /** Query string actual (filtros) para volver a la misma vista tras guardar. */
  returnQuery?: string;
  currentDiscordId: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState(currentDiscordId ?? "");

  return (
    <form ref={formRef} action={action} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="return_query" value={returnQuery} />
      <input
        type="text"
        name="discord_id"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => {
          if (value !== (currentDiscordId ?? "")) formRef.current?.requestSubmit();
        }}
        placeholder="Discord ID"
        className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
      <SavingIndicator />
    </form>
  );
}
