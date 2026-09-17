import type { TestCaseStatus, TicketPriority, TicketSeverity, TicketStatus } from "@/lib/types";

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-nexa-blue ring-1 ring-inset ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60",
  in_progress:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60",
  in_review:
    "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-800/60",
  resolved:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60",
  closed:
    "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/60",
  reopened: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800/60",
};

const SEVERITY_STYLES: Record<TicketSeverity, string> = {
  critical: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800/60",
  high: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-800/60",
  medium:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60",
  low: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/60",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  urgent: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800/60",
  high: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-800/60",
  medium:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60",
  low: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/60",
};

const TEST_CASE_STATUS_STYLES: Record<TestCaseStatus, string> = {
  not_run: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/60",
  passed:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60",
  failed: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800/60",
  blocked:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60",
};

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: TicketStatus; label: string }) {
  return <Badge className={STATUS_STYLES[status]}>{label}</Badge>;
}

export function SeverityBadge({ severity, label }: { severity: TicketSeverity; label: string }) {
  return <Badge className={SEVERITY_STYLES[severity]}>{label}</Badge>;
}

export function PriorityBadge({ priority, label }: { priority: TicketPriority; label: string }) {
  return <Badge className={PRIORITY_STYLES[priority]}>{label}</Badge>;
}

export function TestCaseStatusBadge({ status, label }: { status: TestCaseStatus; label: string }) {
  return <Badge className={TEST_CASE_STATUS_STYLES[status]}>{label}</Badge>;
}

export function ProjectBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge className="bg-nexa-light text-nexa-blue dark:bg-blue-950/40 dark:text-blue-300">
      {children}
    </Badge>
  );
}
