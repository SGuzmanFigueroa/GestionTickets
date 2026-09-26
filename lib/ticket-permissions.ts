import type { Profile, Ticket } from "@/lib/types";

type Guarded = Pick<Ticket, "status" | "assignee_id" | "reporter_id">;

export const isFinalStatus = (status: string) => status === "resolved" || status === "closed";

/**
 * Reglas de bloqueo (también aplicadas en la base de datos, migración 0014):
 * - Ticket finalizado (Resuelto/Cerrado): solo un admin cambia estado y asignado.
 * - Asignar un ticket sin responsable: líder, QA o quien participa en el ticket.
 * - Reasignar un ticket que ya tiene responsable: solo líder o admin.
 * - Estado: quien participa en el ticket o un líder.
 */
export function ticketPermissions(profile: Pick<Profile, "id" | "role">, t: Guarded) {
  if (profile.role === "admin") return { canChangeStatus: true, canChangeAssignee: true, lockReason: null };

  const involved = t.reporter_id === profile.id || t.assignee_id === profile.id;
  const finalized = isFinalStatus(t.status);
  const assigned = Boolean(t.assignee_id);
  const isLeader = profile.role === "lider";
  const isQa = profile.role === "qa";

  const canChangeStatus = !finalized && (involved || isLeader);
  const canChangeAssignee = !finalized && (assigned ? isLeader : involved || isLeader || isQa);

  const lockReason = finalized
    ? "Ticket finalizado: solo un admin puede cambiar el estado o la persona asignada."
    : assigned && !isLeader
      ? "Ticket asignado: solo un líder o un admin puede reasignarlo."
      : null;

  return { canChangeStatus, canChangeAssignee, lockReason };
}
