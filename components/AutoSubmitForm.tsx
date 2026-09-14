"use client";

import { useRef } from "react";

// A plain GET form that resubmits itself the moment any field inside it
// changes, so filters apply immediately instead of requiring an explicit
// "Filtrar" click.
export default function AutoSubmitForm({
  action,
  className,
  children,
}: {
  action: string;
  className?: string;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      className={className}
      onChange={() => formRef.current?.requestSubmit()}
    >
      {children}
    </form>
  );
}
