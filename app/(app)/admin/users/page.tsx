import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminOrLeader } from "@/lib/auth";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import SuccessBanner from "@/components/SuccessBanner";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import RoleSelect from "@/components/RoleSelect";
import DiscordIdInput from "@/components/DiscordIdInput";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import Avatar from "@/components/ui/Avatar";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { ROLE_LABELS, USER_ROLES, type Profile, type UserRole } from "@/lib/types";
import { deleteUser, updateUserDiscordId, updateUserRole } from "./actions";

const ROLE_DOT: Record<UserRole, string> = {
  admin: "bg-nexa-navy dark:bg-blue-200",
  lider: "bg-amber-500",
  qa: "bg-nexa-sky",
  developer: "bg-nexa-blue",
  backend: "bg-emerald-500",
  frontend: "bg-purple-500",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; role?: string }>;
}) {
  const { error, success, role } = await searchParams;
  const { profile: admin, isAdmin } = await requireAdminOrLeader();
  const assignableRoles = isAdmin
    ? USER_ROLES
    : USER_ROLES.filter((r) => r !== "admin" && r !== "lider");
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, role, discord_id, created_at")
    .order("full_name", { ascending: true });

  if (role && (USER_ROLES as string[]).includes(role)) {
    query = query.eq("role", role);
  }

  const [{ data: users }, { data: projectRows }] = await Promise.all([
    query,
    supabase
      .from("team_member_projects")
      .select("project:projects(code, name), member:team_members(profile_id)"),
  ]);

  const projectsByProfileId = new Map<string, string[]>();
  for (const row of projectRows ?? []) {
    const profileId = (row.member as unknown as { profile_id: string | null } | null)?.profile_id;
    const code = (row.project as unknown as { code: string } | null)?.code;
    if (!profileId || !code) continue;
    const list = projectsByProfileId.get(profileId) ?? [];
    list.push(code);
    projectsByProfileId.set(profileId, list);
  }

  const rows = (users as Profile[] | null) ?? [];

  return (
    <div>
      <PageHeader
        title="Equipo"
        description="Administra usuarios, proyectos asignados y permisos."
      />

      <p className="-mt-4 mb-6 text-sm text-slate-500 dark:text-slate-400">
        Las cuentas nuevas entran con rol QA. Asígnales el rol correcto aquí (Admin, QA, Developer,
        Backend, Frontend).
        {!isAdmin &&
          " Como líder, no puedes tocar cuentas admin ni de otros líderes, ni volver a nadie admin o líder."}
      </p>

      {success && <SuccessBanner message={success} />}
      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <AutoSubmitForm className="flex flex-wrap items-center gap-2 text-sm" action="/admin/users">
          <select
            name="role"
            defaultValue={role ?? ""}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 outline-none focus:border-nexa-blue dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Todos los roles</option>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          {role && (
            <Link
              href="/admin/users"
              className="rounded-md px-3 py-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Limpiar
            </Link>
          )}
        </AutoSubmitForm>

        <SearchInput
          placeholder="Buscar usuario..."
          scopeSelector="#users-table-body"
          noResultsSelector="#users-no-local-matches"
          className="sm:w-64"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-nexa-light/50 text-xs uppercase tracking-wide text-nexa-navy/70 dark:border-slate-700 dark:bg-slate-700/40 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Usuario</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Proyecto</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Rol</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Discord ID</th>
                <th scope="col" className="px-4 py-2.5 font-medium"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody id="users-table-body" className="divide-y divide-slate-100 dark:divide-slate-700">
              {rows.map((u) => {
                const displayName = u.full_name ?? u.email;
                return (
                  <tr
                    key={u.id}
                    data-search-row
                    data-search-text={`${u.full_name ?? ""} ${u.email}`}
                    className="h-14 transition-colors hover:bg-nexa-light/20 dark:hover:bg-slate-700/40"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={displayName} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ROLE_DOT[u.role]}`} />
                            <span className="truncate text-slate-800 dark:text-slate-100">{displayName}</span>
                          </div>
                          <p className="truncate text-xs text-slate-400 dark:text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {(projectsByProfileId.get(u.id) ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {projectsByProfileId.get(u.id)!.map((code) => (
                            <span
                              key={code}
                              className="rounded bg-nexa-light px-1.5 py-0.5 text-xs font-medium text-nexa-blue dark:bg-blue-950/40 dark:text-blue-300"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {!isAdmin && (u.role === "admin" || u.role === "lider") ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Solo un admin la edita</span>
                      ) : (
                        <RoleSelect
                          action={updateUserRole}
                          userId={u.id}
                          currentRole={u.role}
                          assignableRoles={assignableRoles}
                          disabled={u.id === admin.id}
                        />
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <DiscordIdInput
                        action={updateUserDiscordId}
                        userId={u.id}
                        currentDiscordId={u.discord_id}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isAdmin && u.id !== admin.id && (
                        <DropdownMenu label={`Más acciones para ${displayName}`}>
                          <form action={deleteUser}>
                            <input type="hidden" name="user_id" value={u.id} />
                            <ConfirmSubmitButton
                              title="¿Eliminar usuario?"
                              confirmMessage={`Esta acción puede afectar registros asociados a "${displayName}" y no se puede deshacer.`}
                              confirmLabel="Eliminar usuario"
                              className="block w-full px-3 py-1.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                              Eliminar usuario
                            </ConfirmSubmitButton>
                          </form>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p id="users-no-local-matches" className="hidden px-4 py-8 text-center text-sm text-slate-400">
          Ningún usuario visible coincide con tu búsqueda.
        </p>
      </div>
    </div>
  );
}
