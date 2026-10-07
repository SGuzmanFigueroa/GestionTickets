import Link from "next/link";
import ImagePasteUpload from "@/components/ImagePasteUpload";
import { addTicketAttachments } from "@/app/(app)/tickets/[id]/actions";
import type { TicketPriority, TicketSeverity, TicketStatus, UserRole } from "@/lib/types";
import ActivityFeed, { type ActivityItem } from "./ActivityFeed";
import AttachmentGallery, { type AttachmentItem } from "./AttachmentGallery";
import TicketActionsMenu from "./TicketActionsMenu";
import { TicketDetailsPanel, TicketTextEditor } from "./TicketEditors";
import type { PersonOption } from "./FieldEditors";

export interface TicketViewProps {
  ticket: {
    id: string;
    code: string;
    title: string;
    description: string;
    stepsToReproduce: string;
    environment: string;
    status: TicketStatus;
    priority: TicketPriority;
    severity: TicketSeverity;
    targetRole: UserRole | null;
    assigneeId: string | null;
    project: { id: string; code: string; name: string };
    testCase: { id: string; title: string } | null;
  };
  meta: { label: string; value: React.ReactNode }[];
  permissions: {
    nextStatuses: TicketStatus[];
    canChangeAssignee: boolean;
    canEditDetails: boolean;
    canDelete: boolean;
    lockReason: string | null;
  };
  people: PersonOption[];
  projects: { id: string; code: string; name: string }[];
  attachments: AttachmentItem[];
  activity: ActivityItem[];
  me: string;
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-nexa-navy dark:text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Detalle del ticket estilo issue tracker: contenido a la izquierda, detalles fijos a la derecha. */
export default function TicketView({ ticket: t, meta, permissions: p, people, projects, attachments, activity, me }: TicketViewProps) {
  const editable = p.canEditDetails;

  return (
    <div>
      {/* Migas + acciones */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <nav aria-label="Ruta" className="min-w-0 text-sm">
          <ol className="flex min-w-0 items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <li>
              <Link href="/dashboard" className="hover:text-nexa-blue hover:underline">
                Tickets
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</li>
            <li>
              <Link href={`/dashboard?project=${t.project.id}`} className="hover:text-nexa-blue hover:underline" title={t.project.name}>
                {t.project.code}
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</li>
            <li aria-current="page" className="truncate font-medium text-slate-700 dark:text-slate-200">
              {t.code}
            </li>
          </ol>
        </nav>
        <TicketActionsMenu ticketId={t.id} code={t.code} title={t.title} canDelete={p.canDelete} />
      </div>

      {/* Código + título (el título es el protagonista) */}
      <div className="mb-5">
        <p className="mb-0.5 font-mono text-xs font-medium text-slate-400 dark:text-slate-500">{t.code}</p>
        <TicketTextEditor
          ticketId={t.id}
          field="title"
          value={t.title}
          editable={editable}
          label="Título"
          placeholder="Agrega un título"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] 2xl:gap-10">
        {/* Panel de detalles: primero en móvil, fijo a la derecha en escritorio */}
        <aside className="lg:order-2 lg:sticky lg:top-16 lg:self-start" aria-label="Detalles del ticket">
          <TicketDetailsPanel
            ticketId={t.id}
            status={t.status}
            nextStatuses={p.nextStatuses}
            assigneeId={t.assigneeId}
            people={people}
            canChangeAssignee={p.canChangeAssignee}
            canEditDetails={p.canEditDetails}
            priority={t.priority}
            severity={t.severity}
            targetRole={t.targetRole}
            projectId={t.project.id}
            projects={projects}
            lockReason={p.lockReason}
            meta={meta}
          />
        </aside>

        <div className="min-w-0 space-y-7 lg:order-1">
          <Section title="Descripción">
            <TicketTextEditor
              ticketId={t.id}
              field="description"
              value={t.description}
              editable={editable}
              label="Descripción"
              placeholder="Agrega una descripción"
            />
          </Section>

          {(t.stepsToReproduce || editable) && (
            <Section title="Pasos para reproducir">
              <TicketTextEditor
                ticketId={t.id}
                field="steps_to_reproduce"
                value={t.stepsToReproduce}
                editable={editable}
                label="Pasos para reproducir"
                placeholder="Agrega los pasos para reproducir el problema…"
              />
            </Section>
          )}

          {(t.environment || editable) && (
            <Section title="Entorno">
              <TicketTextEditor
                ticketId={t.id}
                field="environment"
                value={t.environment}
                editable={editable}
                label="Entorno"
                placeholder="Navegador, dispositivo, ambiente (ej. Chrome 128 · staging)…"
              />
            </Section>
          )}

          {t.testCase && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Originado del caso de prueba{" "}
              <Link href={`/test-cases/${t.testCase.id}`} className="font-medium text-nexa-blue hover:underline dark:text-blue-300">
                {t.testCase.title}
              </Link>
            </p>
          )}

          <Section title={`Adjuntos${attachments.length ? ` (${attachments.length})` : ""}`}>
            <div className="space-y-3">
              <AttachmentGallery items={attachments} />
              <form action={addTicketAttachments}>
                <input type="hidden" name="ticket_id" value={t.id} />
                <ImagePasteUpload name="attachments" compact={attachments.length > 0} autoSubmit />
              </form>
            </div>
          </Section>

          <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
            <ActivityFeed ticketId={t.id} me={me} items={activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
