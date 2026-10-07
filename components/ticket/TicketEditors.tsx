"use client";

import { useRouter } from "next/navigation";
import { PriorityIcon } from "@/components/Badge";
import {
  changeTicketAssignee,
  changeTicketStatus,
  updateTicketFields,
  type TicketFieldsPatch,
} from "@/app/(app)/tickets/[id]/actions";
import {
  PRIORITY_LABELS,
  ROLE_LABELS,
  SEVERITY_LABELS,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  USER_ROLES,
  type TicketPriority,
  type TicketSeverity,
  type TicketStatus,
  type UserRole,
} from "@/lib/types";
import { InlineText, OptionPicker, StatusPicker, UserPicker, type Option, type PersonOption } from "./FieldEditors";

const SEVERITY_DOT: Record<TicketSeverity, string> = {
  critical: "bg-red-600",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-slate-400",
};

const PRIORITY_OPTIONS: Option<TicketPriority>[] = TICKET_PRIORITIES.map((p) => ({
  value: p,
  label: PRIORITY_LABELS[p],
  icon: <PriorityIcon priority={p} />,
}));

const SEVERITY_OPTIONS: Option<TicketSeverity>[] = TICKET_SEVERITIES.map((s) => ({
  value: s,
  label: SEVERITY_LABELS[s],
  icon: <span className={`h-2.5 w-2.5 shrink-0 rotate-45 rounded-[2px] ${SEVERITY_DOT[s]}`} aria-hidden="true" />,
}));

const TEAM_OPTIONS: Option<UserRole | "none">[] = [
  { value: "none", label: "Sin definir" },
  ...USER_ROLES.filter((r) => r !== "admin" && r !== "lider").map((r) => ({ value: r, label: ROLE_LABELS[r] })),
];

type TextField = "title" | "description" | "steps_to_reproduce" | "environment";

/** Título y textos largos del ticket, editables inline. */
export function TicketTextEditor({
  ticketId,
  field,
  value,
  editable,
  label,
  placeholder,
}: {
  ticketId: string;
  field: TextField;
  value: string;
  editable: boolean;
  label: string;
  placeholder: string;
}) {
  const required = field === "title" || field === "description";
  return (
    <InlineText
      key={value}
      value={value}
      editable={editable}
      label={label}
      placeholder={placeholder}
      required={required}
      multiline={field === "description" || field === "steps_to_reproduce"}
      variant={field === "title" ? "title" : "body"}
      successMessage={`${label} actualizado`}
      save={(v) => updateTicketFields(ticketId, { [field]: v } as TicketFieldsPatch)}
    />
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-2 py-1">
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/** Panel lateral: estado, asignado y metadatos, todos editables según permisos. */
export function TicketDetailsPanel({
  ticketId,
  status,
  nextStatuses,
  assigneeId,
  people,
  canChangeAssignee,
  canEditDetails,
  priority,
  severity,
  targetRole,
  projectId,
  projects,
  lockReason,
  meta,
}: {
  ticketId: string;
  status: TicketStatus;
  nextStatuses: TicketStatus[];
  assigneeId: string | null;
  people: PersonOption[];
  canChangeAssignee: boolean;
  canEditDetails: boolean;
  priority: TicketPriority;
  severity: TicketSeverity;
  targetRole: UserRole | null;
  projectId: string;
  projects: { id: string; code: string; name: string }[];
  lockReason: string | null;
  meta: { label: string; value: React.ReactNode }[];
}) {
  const router = useRouter();
  const projectOptions: Option<string>[] = projects.map((p) => ({
    value: p.id,
    label: `${p.code} · ${p.name}`,
    icon: (
      <span className="shrink-0 rounded-[3px] bg-nexa-light px-1 text-[10px] font-bold text-nexa-blue dark:bg-blue-950/50 dark:text-blue-300">
        {p.code}
      </span>
    ),
  }));

  return (
    <div className="space-y-4">
      <div>
        <StatusPicker
          key={status}
          status={status}
          nextStatuses={nextStatuses}
          save={(s) => changeTicketStatus(ticketId, s)}
        />
        {nextStatuses.length === 0 && (
          <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">No puedes mover este ticket a otro estado.</p>
        )}
      </div>

      <section aria-labelledby="ticket-details-title" className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <h2 id="ticket-details-title" className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Detalles
        </h2>
        <dl className="px-2 py-2">
          <Row label="Asignado a">
            <UserPicker
              key={assigneeId ?? "none"}
              assigneeId={assigneeId}
              people={people}
              editable={canChangeAssignee}
              save={(id) => changeTicketAssignee(ticketId, id)}
            />
          </Row>
          <Row label="Prioridad">
            <OptionPicker
              key={priority}
              label="Prioridad"
              value={priority}
              options={PRIORITY_OPTIONS}
              editable={canEditDetails}
              successMessage="Prioridad actualizada"
              save={(v) => updateTicketFields(ticketId, { priority: v })}
            />
          </Row>
          <Row label="Severidad">
            <OptionPicker
              key={severity}
              label="Severidad"
              value={severity}
              options={SEVERITY_OPTIONS}
              editable={canEditDetails}
              successMessage="Severidad actualizada"
              save={(v) => updateTicketFields(ticketId, { severity: v })}
            />
          </Row>
          <Row label="Proyecto">
            <OptionPicker
              key={projectId}
              label="Proyecto"
              value={projectId}
              options={projectOptions}
              editable={canEditDetails && projects.length > 1}
              successMessage="Ticket movido de proyecto"
              confirmMessage={(next) =>
                `El ticket pasará a ${next.label} y recibirá el siguiente código de ese proyecto.`
              }
              save={async (v) => {
                const result = await updateTicketFields(ticketId, { project_id: v });
                if (!result.error) router.refresh();
                return result;
              }}
            />
          </Row>
          <Row label="Equipo destino">
            <OptionPicker
              key={targetRole ?? "none"}
              label="Equipo destino"
              value={targetRole ?? "none"}
              options={TEAM_OPTIONS}
              editable={canEditDetails}
              successMessage="Equipo destino actualizado"
              save={(v) => updateTicketFields(ticketId, { target_role: v === "none" ? null : v })}
            />
          </Row>
        </dl>
        <dl className="border-t border-slate-100 px-3 py-2 dark:border-slate-700">
          {meta.map((m) => (
            <div key={m.label} className="grid grid-cols-[104px_minmax(0,1fr)] gap-2 py-1 text-xs">
              <dt className="text-slate-500 dark:text-slate-400">{m.label}</dt>
              <dd className="min-w-0 text-slate-700 dark:text-slate-200">{m.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {lockReason && (
        <p className="flex items-start gap-1.5 rounded-md bg-slate-100 px-2.5 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-px shrink-0">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          {lockReason}
        </p>
      )}
    </div>
  );
}
