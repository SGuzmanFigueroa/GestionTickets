"use client";

import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import Modal from "@/components/ui/Modal";
import { HINT, INPUT, LABEL } from "@/components/ui/styles";
import { updateProject } from "./actions";

export interface EditableProject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  leader_id: string | null;
}

/**
 * Editar nombre, descripción y líder de un proyecto. `trigger` define cómo se
 * ve el botón que lo abre (ítem del menú "•••" o el enlace "Asignar líder").
 */
export default function EditProjectModal({
  project,
  leaders,
  trigger,
  triggerClassName,
}: {
  project: EditableProject;
  leaders: { id: string; full_name: string | null; email: string }[];
  trigger: React.ReactNode;
  triggerClassName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" role="menuitem" onClick={() => setOpen(true)} className={triggerClassName}>
        {trigger}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Editar ${project.name}`} description={`Código ${project.code} (no se puede cambiar).`}>
        <form action={updateProject} className="space-y-4">
          <input type="hidden" name="id" value={project.id} />
          <div>
            <label htmlFor={`ep-name-${project.id}`} className={LABEL}>Nombre</label>
            <input id={`ep-name-${project.id}`} name="name" required defaultValue={project.name} className={INPUT} />
          </div>
          <div>
            <label htmlFor={`ep-desc-${project.id}`} className={LABEL}>Descripción</label>
            <input id={`ep-desc-${project.id}`} name="description" defaultValue={project.description ?? ""} placeholder="Opcional" className={INPUT} />
          </div>
          <div>
            <label htmlFor={`ep-leader-${project.id}`} className={LABEL}>Líder Nexa</label>
            <select id={`ep-leader-${project.id}`} name="leader_id" defaultValue={project.leader_id ?? ""} className={INPUT}>
              <option value="">Sin asignar</option>
              {leaders.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name ?? l.email}
                </option>
              ))}
            </select>
            <p className={HINT}>El líder ve todos los tickets del proyecto y puede moverlos, reasignarlos y editarlos.</p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <SubmitButton variant="primary" pendingLabel="Guardando…" className="h-9 rounded-md px-4 text-sm font-semibold">
              Guardar cambios
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
