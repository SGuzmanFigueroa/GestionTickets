import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/SubmitButton";
import ImagePasteUpload from "@/components/ImagePasteUpload";
import { createTicket } from "./actions";
import { ROLE_LABELS, TICKET_PRIORITIES, TICKET_SEVERITIES, USER_ROLES } from "@/lib/types";

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
      <h1 className="mb-1 text-xl font-semibold text-nexa-navy dark:text-white">Nuevo ticket</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Reporta un bug encontrado en alguna de las apps.</p>

      {test_case_id && (
        <p className="mb-4 rounded-md bg-nexa-light p-3 text-sm text-nexa-blue">
          Este ticket va a quedar enlazado al caso de prueba que falló.
        </p>
      )}

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {!projects?.length ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          Todavía no hay ninguna app registrada. Un admin debe crear una en Admin → Apps / Proyectos
          antes de poder reportar tickets.
        </p>
      ) : (
        <form
          action={createTicket}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {test_case_id && <input type="hidden" name="test_case_id" value={test_case_id} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">App</label>
            <select
              name="project_id"
              required
              defaultValue={project_id ?? projects[0]?.id}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Título</label>
            <input
              name="title"
              required
              defaultValue={title ?? ""}
              placeholder="Ej: El botón de guardar no responde en Android"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="¿Qué pasó? ¿Qué esperabas que pasara?"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Pasos para reproducir
            </label>
            <textarea
              name="steps_to_reproduce"
              rows={3}
              placeholder={"1. ...\n2. ...\n3. ..."}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Capturas de pantalla
            </label>
            <ImagePasteUpload name="attachments" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Entorno</label>
            <input
              name="environment"
              placeholder="Ej: Android real (Xiaomi Redmi 9), APK v0.4"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Severidad</label>
              <select
                name="severity"
                defaultValue="medium"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {TICKET_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Prioridad</label>
              <select
                name="priority"
                defaultValue="medium"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Equipo destino
              </label>
              <select
                name="target_role"
                defaultValue=""
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Sin definir</option>
                {USER_ROLES.filter((r) => r !== "admin").map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <SubmitButton
            variant="primary"
            pendingLabel="Creando ticket..."
            className="w-full rounded-md px-3 py-2 text-sm font-medium"
          >
            Crear ticket
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
