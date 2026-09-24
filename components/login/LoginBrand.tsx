import { STATUS_LABELS, type TicketStatus } from "@/lib/types";

// Panel de marca del login — decorativo (server component, sin estado).
// Muestra de qué trata la app con su propio vocabulario: el ciclo real de
// un ticket y los roles del equipo, con los mismos colores que /admin/users.

const FLOW: TicketStatus[] = ["open", "in_progress", "in_review", "resolved", "closed"];

const TEAM = [
  { label: "QA", dot: "bg-nexa-sky", detail: "Reporta y verifica" },
  { label: "Backend", dot: "bg-emerald-400", detail: "APIs y datos" },
  { label: "Frontend", dot: "bg-purple-400", detail: "Pantallas y UI" },
  { label: "Marketing", dot: "bg-rose-400", detail: "Contenido y campañas" },
  { label: "Líder", dot: "bg-amber-400", detail: "Asigna y prioriza" },
];

const GRID = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
};

function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-nexa-sky to-nexa-blue font-bold text-white shadow-[0_6px_16px_-6px_rgba(41,182,246,0.8)] ${
        size === "md" ? "h-10 w-10 rounded-[10px] text-lg" : "h-9 w-9 rounded-[9px] text-base"
      }`}
    >
      N
    </span>
  );
}

function Backdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={GRID} />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[460px] w-[460px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, var(--nexa-blue) 0%, transparent 65%)" }}
      />
    </>
  );
}

function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={small ? "sm" : "md"} />
      <div className="flex flex-col gap-0.5">
        <p className={`font-bold tracking-wide text-white ${small ? "text-[14px]" : "text-[15px]"}`}>Nexa Tracker</p>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-blue-200/60">Bugs · QA</p>
      </div>
    </div>
  );
}

export default function LoginBrand() {
  return (
    <div
      className="relative hidden shrink-0 overflow-hidden bg-nexa-navy md:flex md:w-[46%] lg:w-[54%]"
      aria-hidden="true"
    >
      <Backdrop />

      <div className="relative flex min-h-[100dvh] w-full flex-col justify-between px-10 py-10 lg:px-16 lg:py-12 xl:px-20">
        <Wordmark />

        <div className="max-w-[560px] py-12">
          <p className="text-balance text-[30px] font-bold leading-[1.15] tracking-tight text-white lg:text-[38px]">
            Cada bug, del reporte al cierre, con todo el equipo.
          </p>
          <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-blue-100/70">
            Tickets, casos de prueba y avance de cada proyecto en un mismo lugar.
          </p>

          {/* Ciclo de vida real de un ticket */}
          <div className="mt-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200/50">
              Ciclo de un ticket
            </p>
            <ol className="flex w-full">
              {FLOW.map((s, i) => {
                const highlight = s === "resolved";
                return (
                  <li key={s} className="relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                    {/* Tramo de línea hacia el siguiente estado */}
                    {i < FLOW.length - 1 && (
                      <span className="absolute left-1/2 top-[5px] h-px w-full bg-white/20" />
                    )}
                    <span
                      className={`relative h-[11px] w-[11px] rounded-full border-2 ${
                        highlight ? "border-emerald-300 bg-emerald-400" : "border-nexa-sky/70 bg-nexa-navy"
                      }`}
                    />
                    <span
                      className={`px-1 text-[12px] font-medium leading-tight ${
                        highlight ? "text-emerald-200" : "text-blue-50/85"
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Equipo */}
          <div className="mt-8 hidden lg:block">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200/50">Un solo equipo</p>
            <ul className="grid grid-cols-2 gap-x-6 border-t border-white/10 xl:grid-cols-3">
              {TEAM.map((t) => (
                <li key={t.label} className="flex items-center gap-2.5 border-b border-white/10 py-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${t.dot}`} />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-white">{t.label}</span>
                    <span className="block text-[12px] text-blue-200/60">{t.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-[11.5px] font-medium tracking-wide text-blue-200/50">NEXA CONSULTING TI S.A.C.</p>
      </div>
    </div>
  );
}

/** Franja de marca para móvil, donde el panel lateral no se muestra. */
export function LoginBrandMobile() {
  return (
    <div className="relative overflow-hidden bg-nexa-navy px-5 pb-16 pt-9 sm:px-8 md:hidden" aria-hidden="true">
      <Backdrop />
      <div className="relative mx-auto flex w-full max-w-[420px] flex-col gap-4">
        <Wordmark small />
        <p className="text-balance text-[21px] font-bold leading-tight tracking-tight text-white">
          Cada bug, del reporte al cierre, con todo el equipo.
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {TEAM.slice(0, 4).map((t) => (
            <span key={t.label} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-blue-100/80">
              <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
