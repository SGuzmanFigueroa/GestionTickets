import type { Profile, Ticket } from "@/lib/types";

type Guarded = Pick<Ticket, "status" | "assignee_id" | "reporter_id">;

export const isFinalStatus = (status: string) => status === "resolved" || status === "closed";

/**
 * Reglas de bloqueo (también aplicadas en la base de datos, migración 0013):
 * - Ticket finalizado (Resuelto/Cerrado): solo un admin cambia estado y asignado.
 * - Ticket ya asignado: solo un admin cambia el asignado.
 * - Un líder cambia el estado de cualquier ticket no finalizado, pero no
 *   elige responsable (salvo en los tickets que él mismo reportó).
 */
export function ticketPermissions(profile: Pick<Profile, "id" | "role">, t: Guarded) {
  if (profile.role === "admin") return { canChangeStatus: true, canChangeAssignee: true, lockReason: null };

  const involved = t.reporter_id === profile.id || t.assignee_id === profile.id;
  const finalized = isFinalStatus(t.status);
  const assigned = Boolean(t.assignee_id);
  const isLeader = profile.role === "lider";

  const canChangeStatus = !finalized && (involved || isLeader);
  const canChangeAssignee = !finalized && !assigned && involved;

  const lockReason = finalized
    ? "Ticket finalizado: solo un admin puede cambiar el estado o la persona asignada."
    : assigned
      ? "Ticket asignado: solo un admin puede cambiar la persona asignada."
      : isLeader && !involved
        ? "Como líder puedes cambiar el estado; la persona asignada la elige un admin o quien reportó el ticket."
        : null;

  return { canChangeStatus, canChangeAssignee, lockReason };
}
