import { createClient } from "@/lib/supabase/server";
import { createTicket } from "./actions";
import { ROLE_LABELS, TICKET_PRIORITIES, TICKET_SEVERITIES, USER_ROLES } from "@/lib/types";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: projects } = await supabase.from("projects").select("id, name").order("name");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-nexa-navy">Nuevo ticket</h1>
      <p className="mb-6 text-sm text-slate-500">Reporta un bug encontrado en alguna de las apps.</p>

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!projects?.length ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          Todavía no hay ninguna app registrada. Un admin debe crear una en Admin → Apps / Proyectos
          antes de poder reportar tickets.
        </p>
      ) : (
        <form
          action={createTicket}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">App</label>
            <select
              name="project_id"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
            <input
              name="title"
              required
              placeholder="Ej: El botón de guardar no responde en Android"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="¿Qué pasó? ¿Qué esperabas que pasara?"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Pasos para reproducir
            </label>
            <textarea
              name="steps_to_reproduce"
              rows={3}
              placeholder={"1. ...\n2. ...\n3. ..."}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Entorno</label>
            <input
              name="environment"
              placeholder="Ej: Android real (Xiaomi Redmi 9), APK v0.4"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Severidad</label>
              <select
                name="severity"
                defaultValue="medium"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
              >
                {TICKET_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Prioridad</label>
              <select
                name="priority"
                defaultValue="medium"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Equipo destino
              </label>
              <select
                name="target_role"
                defaultValue=""
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20"
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

          <button
            type="submit"
            className="w-full rounded-md bg-nexa-blue px-3 py-2 text-sm font-medium text-white shadow-sm shadow-nexa-blue/30 transition-colors hover:bg-nexa-navy"
          >
            Crear ticket
          </button>
        </form>
      )}
    </div>
  );
}
