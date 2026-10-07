import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/SubmitButton";
import ImagePasteUpload from "@/components/ImagePasteUpload";
import EmptyState from "@/components/ui/EmptyState";
import { HINT, INPUT, LABEL } from "@/components/ui/styles";
import { createTicket } from "./actions";
import {
  PRIORITY_LABELS,
  ROLE_LABELS,
  SEVERITY_LABELS,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  USER_ROLES,
  type UserRole,
} from "@/lib/types";

function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <header className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-700">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h2>
        {description && <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>}
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ project_id?: string; title?: string; test_case_id?: string }>;
}) {
  const { project_id, title, test_case_id } = await searchParams;
  const supabase = await createClient();
  const [{ data: projects }, { data: people }, { data: inactiveIds }] = await Promise.all([
    supabase.from("projects").select("id, name, code").order("name"),
    supabase.from("profiles").select("id, full_name, email, role").order("full_name"),
    supabase.rpc("inactive_profile_ids"),
  ]);
  const inactive = new Set<string>((inactiveIds as string[] | null) ?? []);
  const assignable = (people ?? []).filter((p) => !inactive.has(p.id));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-nexa-navy dark:text-white">Crear ticket</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Reporta un problema encontrado durante las pruebas.</p>
      </div>

      {test_case_id && (
        <p className="mb-4 rounded-md border border-blue-100 bg-nexa-light px-3 py-2 text-sm text-nexa-blue dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
          Este ticket va a quedar enlazado al caso de prueba que falló.
        </p>
      )}

      {!projects?.length ? (
        <EmptyState
          title="Todavía no hay ninguna app registrada"
          description="Un admin debe crear una en Proyectos antes de poder reportar tickets."
        />
      ) : (
        <form action={createTicket} className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {test_case_id && <input type="hidden" name="test_case_id" value={test_case_id} />}

          <div className="min-w-0 space-y-4">
            <Group title="Información principal">
              <div>
                <label htmlFor="nt-project" className={LABEL}>
                  Proyecto / App <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <select id="nt-project" name="project_id" required defaultValue={project_id ?? projects[0]?.id} className={INPUT}>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="nt-title" className={LABEL}>
                  Título <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="nt-title"
                  name="title"
                  required
                  defaultValue={title ?? ""}
                  placeholder="Ej: El botón de guardar no responde en Android"
                  className={`${INPUT} text-base font-medium`}
                />
              </div>
              <div>
                <label htmlFor="nt-description" className={LABEL}>
                  Descripción <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="nt-description"
                  name="description"
                  required
                  rows={5}
                  placeholder="¿Qué pasó? ¿Qué esperabas que pasara?"
                  className={INPUT}
                />
              </div>
            </Group>

            <Group title="Evidencia" description="Ayuda a quien lo corrija a reproducirlo rápido.">
              <div>
                <label htmlFor="nt-steps" className={LABEL}>Pasos para reproducir</label>
                <textarea id="nt-steps" name="steps_to_reproduce" rows={4} placeholder={"1. ...\n2. ...\n3. ..."} className={INPUT} />
              </div>
              <div>
                <label htmlFor="nt-env" className={LABEL}>Entorno</label>
                <input id="nt-env" name="environment" placeholder="Ej. Android 15 · Pixel 8 · App v1.4.2" className={INPUT} />
              </div>
              <div>
                <span className={LABEL}>Capturas de pantalla</span>
                <ImagePasteUpload name="attachments" />
              </div>
            </Group>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-16 lg:self-start">
            <Group title="Detalles">
              <div>
                <label htmlFor="nt-priority" className={LABEL}>Prioridad</label>
                <select id="nt-priority" name="priority" defaultValue="medium" aria-describedby="nt-priority-hint" className={INPUT}>
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
                <p id="nt-priority-hint" className={HINT}>¿Qué tan urgente es corregirlo?</p>
              </div>
              <div>
                <label htmlFor="nt-severity" className={LABEL}>Severidad</label>
                <select id="nt-severity" name="severity" defaultValue="medium" aria-describedby="nt-severity-hint" className={INPUT}>
                  {TICKET_SEVERITIES.map((s) => (
                    <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
                  ))}
                </select>
                <p id="nt-severity-hint" className={HINT}>¿Qué tan grave es el impacto?</p>
              </div>
              <div>
                <label htmlFor="nt-team" className={LABEL}>Equipo destino</label>
                <select id="nt-team" name="target_role" defaultValue="" className={INPUT}>
                  <option value="">Sin definir</option>
                  {USER_ROLES.filter((r) => r !== "admin" && r !== "lider").map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="nt-assignee" className={LABEL}>Asignado a</label>
                <select id="nt-assignee" name="assignee_id" defaultValue="" aria-describedby="nt-assignee-hint" className={INPUT}>
                  <option value="">Sin asignar</option>
                  {assignable.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name ?? p.email} · {ROLE_LABELS[p.role as UserRole]}
                    </option>
                  ))}
                </select>
                <p id="nt-assignee-hint" className={HINT}>Opcional. Le llegará un correo avisándole.</p>
              </div>
            </Group>

            <div className="flex flex-col gap-2">
              <SubmitButton variant="primary" pendingLabel="Creando ticket…" className="h-9 rounded-md px-4 text-sm font-semibold">
                Crear ticket
              </SubmitButton>
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center justify-center rounded-md text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </Link>
            </div>
          </aside>
        </form>
      )}
    </div>
  );
}
