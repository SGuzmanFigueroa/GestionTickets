"use client";

import Link from "next/link";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { deleteTicket } from "@/app/(app)/tickets/[id]/actions";
import { toast } from "@/lib/toast";

const ITEM =
  "block w-full px-3 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60";

/** Menú "•••" del ticket. Eliminar sigue pidiendo confirmación. */
export default function TicketActionsMenu({
  ticketId,
  code,
  title,
  canDelete,
}: {
  ticketId: string;
  code: string;
  title: string;
  canDelete: boolean;
}) {
  async function copyLink() {
    const url = `${window.location.origin}/tickets/${ticketId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast(`Enlace de ${code} copiado`);
    } catch {
      toast("No se pudo copiar el enlace", "error");
    }
  }

  return (
    <DropdownMenu label={`Más acciones para ${code}`} align="right">
      <button type="button" role="menuitem" onClick={copyLink} className={ITEM}>
        Copiar enlace
      </button>
      <Link href="/board" role="menuitem" className={ITEM}>
        Ver en el tablero
      </Link>
      {canDelete && (
        <>
          <div className="my-1 border-t border-slate-100 dark:border-slate-700" role="separator" />
          <form action={deleteTicket}>
            <input type="hidden" name="ticket_id" value={ticketId} />
            <ConfirmSubmitButton
              title={`¿Eliminar ${code}?`}
              confirmMessage={`Se eliminará "${title}" con sus comentarios, historial y capturas. Esto no se puede deshacer.`}
              confirmLabel="Eliminar ticket"
              className={`${ITEM} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30`}
            >
              Eliminar ticket
            </ConfirmSubmitButton>
          </form>
        </>
      )}
    </DropdownMenu>
  );
}
