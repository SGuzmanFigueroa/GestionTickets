"use client";

import { useEffect, useRef } from "react";

// Destino del salto desde otra app de Nexa (ver app/api/sso/route.ts). El
// token llega en el #hash para que nunca viaje al servidor en la URL ni
// quede en logs; se borra de la barra de direcciones apenas se lee.
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export default function SsoPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const next = safeNext(params.get("next"));
    window.history.replaceState(null, "", window.location.pathname);

    if (!accessToken) {
      window.location.replace("/login");
      return;
    }

    fetch("/api/sso", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ access_token: accessToken }),
    })
      .then((res) => window.location.replace(res.ok ? next : "/login"))
      .catch(() => window.location.replace("/login"));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-nexa-gray text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
      Conectando tu sesión de Nexa…
    </div>
  );
}
