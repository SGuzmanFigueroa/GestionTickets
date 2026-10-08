"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

// A GET filter form that applies itself the moment any field inside it changes,
// so filters apply immediately instead of requiring an explicit "Filtrar" click.
// `preserve`: params that live outside the form (e.g. the list's search `q`
// and `sort`) and must survive a filter change.
export default function AutoSubmitForm({
  action,
  className,
  children,
  preserve = [],
}: {
  action: string;
  className?: string;
  children: React.ReactNode;
  preserve?: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function apply() {
    const form = formRef.current;
    if (!form) return;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form).entries()) params.append(key, String(value));
    const current = new URLSearchParams(window.location.search);
    for (const key of preserve) {
      const value = current.get(key);
      if (value && !params.has(key)) params.set(key, value);
    }
    router.push(`${action}?${params.toString()}`, { scroll: false });
  }

  return (
    <form
      ref={formRef}
      action={action}
      className={className}
      onChange={apply}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      {children}
    </form>
  );
}
