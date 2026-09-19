import type { Profile, Ticket } from "@/lib/types";

type Guarded = Pick<Ticket, "status" | "assignee_id" | "reporter_id">;

export const isFinalStatus = (status: string) => status === "resolved" || status === "closed";

/**
 * Reglas de bloqueo (también aplicadas en la base de datos, migración 0010):
 * - Ticket finalizado (Resuelto/Cerrado): solo un admin cambia estado y asignado.
 * - Ticket ya asignado: solo un admin cambia el asignado.
 * - Un líder no cambia el estado de un ticket asignado a otra persona.
 */
export function ticketPermissions(profile: Pick<Profile, "id" | "role">, t: Guarded) {
  if (profile.role === "admin") return { canChangeStatus: true, canChangeAssignee: true, lockReason: null };

  const involved = t.reporter_id === profile.id || t.assignee_id === profile.id;
  const finalized = isFinalStatus(t.status);
  const assigned = Boolean(t.assignee_id);

  const canChangeStatus =
    !finalized && (involved || (profile.role === "lider" && !assigned));
  const canChangeAssignee =
    !finalized && !assigned && (involved || profile.role === "lider");

  const lockReason = finalized
    ? "Ticket finalizado: solo un admin puede cambiar el estado o la persona asignada."
    : assigned
      ? "Ticket asignado: solo un admin puede cambiar la persona asignada."
      : null;

  return { canChangeStatus, canChangeAssignee, lockReason };
}
