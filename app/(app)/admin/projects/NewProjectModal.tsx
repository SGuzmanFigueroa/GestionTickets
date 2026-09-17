"use client";

import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { createProject } from "./actions";

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function NewProjectModal({
  leaders,
}: {
  leaders: { id: string; full_name: string | null; email: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <PlusIcon /> Nuevo proyecto
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo proyecto"
        description="Registra una app que el equipo QA vaya a probar."
      >
        <form action={createProject} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre de la app</label>
            <input name="name" required placeholder="Ej: Inventra" className={fieldClass} />
          </div>

          <div>
            <label className={labelClass}>Código</label>
            <input
              name="code"
              required
              maxLength={5}
              placeholder="Ej: INV"
              className={`${fieldClass} uppercase`}
            />
          </div>

          <div>
            <label className={labelClass}>Descripción</label>
            <input name="description" placeholder="Opcional" className={fieldClass} />
          </div>

          <div>
            <label className={labelClass}>Líder Nexa</label>
            <select name="leader_id" defaultValue="" className={fieldClass}>
              <option value="">Sin asignar</option>
              {leaders.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name ?? l.email}
                </option>
              ))}
            </select>
            {leaders.length === 0 && (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Todavía no hay nadie con rol Líder — asígnalo en Usuarios y roles para poder elegirlo aquí.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <SubmitButton variant="primary" pendingLabel="Agregando..." className="rounded-md px-3 py-2 text-sm font-medium">
              Agregar app
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
