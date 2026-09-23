"use client";

import { useFormStatus } from "react-dom";

function Box({ done, disabled, label }: { done: boolean; disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  // Mientras se guarda, mostramos ya el estado nuevo para que se sienta inmediato.
  const shown = pending ? !done : done;

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-pressed={done}
      aria-label={label}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue focus-visible:ring-offset-1 disabled:cursor-not-allowed ${
        shown
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-slate-300 bg-white hover:border-nexa-blue dark:border-slate-500 dark:bg-slate-800"
      } ${pending ? "opacity-60" : ""}`}
    >
      {shown && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default function RequirementCheckbox({
  action,
  id,
  projectId,
  done,
  disabled = false,
  returnQuery = "",
  title,
}: {
  action: (formData: FormData) => void;
  id: string;
  projectId: string;
  done: boolean;
  disabled?: boolean;
  returnQuery?: string;
  title: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="done" value={String(!done)} />
      <input type="hidden" name="return_query" value={returnQuery} />
      <Box done={done} disabled={disabled} label={done ? `Marcar "${title}" como pendiente` : `Marcar "${title}" como hecho`} />
    </form>
  );
}
