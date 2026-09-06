import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import SubmitButton from "@/components/SubmitButton";
import SuccessBanner from "@/components/SuccessBanner";
import { ROLE_LABELS, USER_ROLES, type Profile, type UserRole } from "@/lib/types";
import { deleteUser, updateUserRole } from "./actions";

const ROLE_DOT: Record<UserRole, string> = {
  admin: "bg-nexa-navy",
  qa: "bg-nexa-sky",
  developer: "bg-nexa-blue",
  backend: "bg-emerald-500",
  frontend: "bg-purple-500",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("full_name", { ascending: true });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-nexa-navy dark:text-white">Usuarios y roles</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Las cuentas nuevas entran con rol QA. Asígnales el rol correcto aquí (Admin, QA, Developer,
        Backend, Frontend).
      </p>

      {success && <SuccessBanner message={success} />}
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-nexa-light/50 text-xs uppercase tracking-wide text-nexa-navy/70 dark:border-slate-700 dark:bg-slate-700/40 dark:text-slate-300">
            <tr>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Correo</th>
              <th className="px-4 py-2 font-medium">Rol</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {(users as Profile[] | null)?.map((u) => (
              <tr key={u.id} className="hover:bg-nexa-light/20 dark:hover:bg-slate-700/40">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${ROLE_DOT[u.role]}`} />
                    <span className="text-slate-800 dark:text-slate-100">{u.full_name ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{u.email}</td>
                <td className="px-4 py-2.5">
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="user_id" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      disabled={u.id === admin.id}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 disabled:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/60"
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    {u.id !== admin.id && (
                      <SubmitButton variant="dark" pendingLabel="..." className="rounded-md px-2 py-1 text-xs">
                        Guardar
                      </SubmitButton>
                    )}
                  </form>
                </td>
                <td className="px-4 py-2.5">
                  {u.id !== admin.id && (
                    <form action={deleteUser}>
                      <input type="hidden" name="user_id" value={u.id} />
                      <ConfirmSubmitButton
                        confirmMessage={`¿Eliminar la cuenta de ${u.full_name ?? u.email}? Esto no se puede deshacer.`}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Eliminar
                      </ConfirmSubmitButton>
                    </form>
                  )}
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
