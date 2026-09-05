import type { TestCaseStatus, TicketPriority, TicketSeverity, TicketStatus } from "@/lib/types";

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-nexa-blue ring-1 ring-inset ring-blue-200",
  in_progress: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  in_review: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  closed: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  reopened: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

const SEVERITY_STYLES: Record<TicketSeverity, string> = {
  critical: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  high: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  medium: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  low: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  urgent: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  high: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  medium: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  low: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

const TEST_CASE_STATUS_STYLES: Record<TestCaseStatus, string> = {
  not_run: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  passed: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  failed: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  blocked: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
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
