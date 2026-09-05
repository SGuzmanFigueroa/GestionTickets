import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ROLE_LABELS, USER_ROLES, type Profile, type UserRole } from "@/lib/types";
import { updateUserRole } from "./actions";

const ROLE_DOT: Record<UserRole, string> = {
  admin: "bg-nexa-navy",
  qa: "bg-nexa-sky",
  developer: "bg-nexa-blue",
  backend: "bg-emerald-500",
  frontend: "bg-purple-500",
};

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-nexa-navy">Usuarios y roles</h1>
      <p className="mb-6 text-sm text-slate-500">
        Las cuentas nuevas entran con rol QA. Asígnales el rol correcto aquí (Admin, QA, Developer,
        Backend, Frontend).
      </p>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-nexa-light/50 text-xs uppercase tracking-wide text-nexa-navy/70">
            <tr>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Correo</th>
              <th className="px-4 py-2 font-medium">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(users as Profile[] | null)?.map((u) => (
              <tr key={u.id} className="hover:bg-nexa-light/20">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${ROLE_DOT[u.role]}`} />
                    <span className="text-slate-800">{u.full_name ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-500">{u.email}</td>
                <td className="px-4 py-2.5">
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="user_id" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      disabled={u.id === admin.id}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 disabled:bg-slate-50"
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    {u.id !== admin.id && (
                      <button
                        type="submit"
                        className="rounded-md bg-nexa-navy px-2 py-1 text-xs text-white hover:bg-slate-900"
                      >
                        Guardar
                      </button>
                    )}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
