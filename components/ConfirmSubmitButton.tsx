"use client";

import { useState } from "react";
import AlertDialog from "@/components/ui/AlertDialog";

export default function ConfirmSubmitButton({
  confirmMessage,
  title = "¿Confirmar acción?",
  confirmLabel = "Eliminar",
  className,
  children,
}: {
  confirmMessage: string;
  title?: string;
  confirmLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<HTMLFormElement | null>(null);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={(e) => {
          setForm(e.currentTarget.form);
          setOpen(true);
        }}
      >
        {children}
      </button>
      <AlertDialog
        open={open}
        title={title}
        description={confirmMessage}
        confirmLabel={confirmLabel}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          form?.requestSubmit();
        }}
      />
    </>
  );
}
