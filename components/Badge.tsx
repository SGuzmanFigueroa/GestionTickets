import type { TestCaseStatus, TicketPriority, TicketSeverity, TicketStatus } from "@/lib/types";

// Insignias compactas del design system. El significado nunca depende solo del
// color: el estado lleva texto en mayúsculas; prioridad y severidad, un ícono.

export const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200",
  reopened: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  done: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300",
  in_review: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  closed: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const SEVERITY_STYLES: Record<TicketSeverity, string> = {
  critical: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800/60",
  high: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-800/60",
  medium: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60",
  low: "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/60",
};

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  urgent: "text-red-600 dark:text-red-400",
  high: "text-orange-600 dark:text-orange-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-sky-600 dark:text-sky-400",
};

const TEST_CASE_STATUS_STYLES: Record<TestCaseStatus, string> = {
  not_run: "bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200",
  passed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  blocked: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
};

/** Ícono de prioridad: ⇈ urgente, ↑ alta, = media, ↓ baja. */
export function PriorityIcon({ priority, className = "" }: { priority: TicketPriority; className?: string }) {
  const paths: Record<TicketPriority, string> = {
    urgent: "M4 9l4-4 4 4M4 13l4-4 4 4",
    high: "M4 10l4-4 4 4",
    medium: "M4 6.5h8M4 9.5h8",
    low: "M4 6l4 4 4-4",
  };
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" className={`shrink-0 ${PRIORITY_COLOR[priority]} ${className}`}>
      <path d={paths[priority]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Ícono de severidad: rombo que se llena según el nivel. */
function SeverityIcon({ severity }: { severity: TicketSeverity }) {
  const fill = severity === "critical" || severity === "high" ? "currentColor" : "none";
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" className="shrink-0">
      <path d="M6 1l5 5-5 5-5-5z" fill={fill} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      {severity === "critical" && <path d="M6 3.5v3" stroke="white" strokeWidth="1.3" strokeLinecap="round" />}
    </svg>
  );
}

/** Estado: "lozenge" en mayúsculas, como en un issue tracker. */
export function StatusBadge({ status, label }: { status: TicketStatus; label: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold uppercase leading-4 tracking-wide ${STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
}

export function SeverityBadge({ severity, label }: { severity: TicketSeverity; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold leading-4 ring-1 ring-inset ${SEVERITY_STYLES[severity]}`}
    >
      <SeverityIcon severity={severity} />
      {label}
    </span>
  );
}

/** Prioridad: ícono de color + texto, sin fondo (más liviano en tablas). */
export function PriorityBadge({ priority, label }: { priority: TicketPriority; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-200">
      <PriorityIcon priority={priority} />
      {label}
    </span>
  );
}

export function TestCaseStatusBadge({ status, label }: { status: TestCaseStatus; label: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold uppercase leading-4 tracking-wide ${TEST_CASE_STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
}

export function ProjectBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-[4px] bg-nexa-light px-1.5 py-0.5 text-xs font-medium text-nexa-blue dark:bg-blue-950/40 dark:text-blue-300">
      {children}
    </span>
  );
}
