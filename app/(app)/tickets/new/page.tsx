import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/SubmitButton";
import ImagePasteUpload from "@/components/ImagePasteUpload";
import EmptyState from "@/components/ui/EmptyState";
import { createTicket } from "./actions";
import {
  PRIORITY_LABELS,
  ROLE_LABELS,
  SEVERITY_LABELS,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  USER_ROLES,
} from "@/lib/types";

const fieldClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; project_id?: string; title?: string; test_case_id?: string }>;
}) {
  const { error, project_id, title, test_case_id } = await searchParams;
  const supabase = await createClient();
  const { data: projects } = await supabase.from("projects").select("id, name").order("name");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-nexa-navy dark:text-white">Crear nuevo ticket</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Reporta un problema encontrado durante las pruebas.
      </p>

      {test_case_id && (
        <p className="mb-4 rounded-md bg-nexa-light p-3 text-sm text-nexa-blue dark:bg-blue-950/30 dark:text-blue-300">
          Este ticket va a quedar enlazado al caso de prueba que falló.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>
      )}

      {!projects?.length ? (
        <EmptyState
          title="Todavía no hay ninguna app registrada"
          description="Un admin debe crear una en Proyectos antes de poder reportar tickets."
        />
      ) : (
        <form action={createTicket} className="space-y-6">
          {test_case_id && <input type="hidden" name="test_case_id" value={test_case_id} />}

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-sm font-semibold text-nexa-navy dark:text-white">Información básica</h2>

            <div>
              <label className={labelClass}>Proyecto / App</label>
              <select
                name="project_id"
                required
                defaultValue={project_id ?? projects[0]?.id}
                className={fieldClass}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Título</label>
              <input
                name="title"
                required
                defaultValue={title ?? ""}
                placeholder="Ej: El botón de guardar no responde en Android"
                className={fieldClass}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-sm font-semibold text-nexa-navy dark:text-white">Detalles del problema</h2>

            <div>
              <label className={labelClass}>Descripción</label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="¿Qué pasó? ¿Qué esperabas que pasara?"
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Pasos para reproducir</label>
              <textarea
                name="steps_to_reproduce"
                rows={3}
                placeholder={"1. ...\n2. ...\n3. ..."}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Capturas de pantalla</label>
              <ImagePasteUpload name="attachments" />
            </div>

            <div>
              <label className={labelClass}>Entorno</label>
              <input
                name="environment"
                placeholder="Ej. Android 15 · Pixel 8 · App v1.4.2"
                className={fieldClass}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-sm font-semibold text-nexa-navy dark:text-white">Clasificación y asignación</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Severidad</label>
                <p className="mb-1 -mt-0.5 text-xs text-slate-400 dark:text-slate-500">¿Qué tan grave es el impacto?</p>
                <select name="severity" defaultValue="medium" className={fieldClass}>
                  {TICKET_SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {SEVERITY_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Prioridad</label>
                <p className="mb-1 -mt-0.5 text-xs text-slate-400 dark:text-slate-500">¿Qué tan urgente es corregirlo?</p>
                <select name="priority" defaultValue="medium" className={fieldClass}>
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Equipo destino</label>
                <p className="mb-1 -mt-0.5 text-xs text-slate-400 dark:text-slate-500">¿Quién debería atenderlo?</p>
                <select name="target_role" defaultValue="" className={fieldClass}>
                  <option value="">Sin definir</option>
                  {USER_ROLES.filter((r) => r !== "admin" && r !== "lider").map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard"
              className="rounded-md px-4 py-2 text-center text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </Link>
            <SubmitButton variant="primary" pendingLabel="Creando ticket..." className="rounded-md px-4 py-2 text-sm font-medium">
              Crear ticket
            </SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
