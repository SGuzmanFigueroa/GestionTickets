"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { ROLE_LABELS, type UserRole } from "@/lib/types";

function SavingIndicator() {
  const { pending } = useFormStatus();
  return pending ? (
    <span className="text-xs text-slate-400 dark:text-slate-500">Guardando...</span>
  ) : null;
}

export default function RoleSelect({
  action,
  userId,
  returnQuery = "",
  currentRole,
  assignableRoles,
  disabled,
}: {
  action: (formData: FormData) => void;
  userId: string;
  /** Query string actual (filtros) para volver a la misma vista tras guardar. */
  returnQuery?: string;
  currentRole: UserRole;
  assignableRoles: UserRole[];
  disabled?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="return_query" value={returnQuery} />
      <select
        name="role"
        defaultValue={currentRole}
        disabled={disabled}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 disabled:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/60"
      >
        {assignableRoles.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <SavingIndicator />
    </form>
  );
}
