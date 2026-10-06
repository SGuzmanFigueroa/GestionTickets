import type { Profile, Ticket, TicketStatus } from "@/lib/types";

type Guarded = Pick<Ticket, "status" | "assignee_id" | "reporter_id">;

export const isFinalStatus = (status: string) => status === "resolved" || status === "closed";

const ALL_STATUSES: TicketStatus[] = ["open", "in_progress", "done", "in_review", "resolved", "closed", "reopened"];
const WORK_STATUSES: TicketStatus[] = ["open", "in_progress", "done"];

/**
 * Estados a los que esta persona puede mover el ticket (sin incluir el actual).
 * Mismo criterio que enforce_ticket_locks (migración 0018):
 * - Admin: cualquiera.
 * - Ticket finalizado (Certificado/Cerrado): nadie más.
 * - Líder: cualquiera.
 * - Responsable: Por hacer ↔ En progreso ↔ Hecho.
 * - QA: Hecho → En revisión / Reabierto; En revisión → Certificado / Hecho / Reabierto.
 */
export function allowedStatuses(profile: Pick<Profile, "id" | "role">, t: Guarded): TicketStatus[] {
  const current = t.status;
  const others = (list: TicketStatus[]) => list.filter((s) => s !== current);

  if (profile.role === "admin") return others(ALL_STATUSES);
  if (isFinalStatus(current)) return [];
  if (profile.role === "lider") return others(ALL_STATUSES);

  const result = new Set<TicketStatus>();
  if (t.assignee_id === profile.id && ["open", "reopened", "in_progress", "done"].includes(current)) {
    others(WORK_STATUSES).forEach((s) => result.add(s));
  }
  if (profile.role === "qa") {
    if (current === "done") ["in_review", "reopened"].forEach((s) => result.add(s as TicketStatus));
    if (current === "in_review") ["resolved", "done", "reopened"].forEach((s) => result.add(s as TicketStatus));
  }
  return ALL_STATUSES.filter((s) => result.has(s));
}

/**
 * Reglas de bloqueo (también aplicadas en la base de datos, migración 0018):
 * - Ticket finalizado (Certificado/Cerrado): solo un admin lo modifica.
 * - Estado: por etapa, ver allowedStatuses().
 * - Asignar un ticket sin responsable: líder, QA o quien participa en el ticket.
 * - Reasignar un ticket que ya tiene responsable: solo líder o admin.
 * - Datos del ticket (título, descripción, prioridad…): solo líder, si no está finalizado.
 */
export function ticketPermissions(profile: Pick<Profile, "id" | "role">, t: Guarded) {
  const nextStatuses = allowedStatuses(profile, t);
  if (profile.role === "admin") {
    return { canChangeStatus: true, nextStatuses, canChangeAssignee: true, canEditDetails: true, lockReason: null };
  }

  const involved = t.reporter_id === profile.id || t.assignee_id === profile.id;
  const finalized = isFinalStatus(t.status);
  const assigned = Boolean(t.assignee_id);
  const isLeader = profile.role === "lider";
  const isQa = profile.role === "qa";

  const canChangeStatus = nextStatuses.length > 0;
  const canChangeAssignee = !finalized && (assigned ? isLeader : involved || isLeader || isQa);
  // Título, descripción, pasos, entorno, severidad, prioridad y área: solo líder, y solo si no está finalizado.
  const canEditDetails = !finalized && isLeader;

  const lockReason = finalized
    ? "Ticket certificado o cerrado: solo un admin puede modificarlo."
    : assigned && !isLeader
      ? "Ticket asignado: solo un líder o un admin puede reasignarlo."
      : null;

  return { canChangeStatus, nextStatuses, canChangeAssignee, canEditDetails, lockReason };
}
