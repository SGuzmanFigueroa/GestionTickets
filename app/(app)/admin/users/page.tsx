import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminOrLeader } from "@/lib/auth";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import RoleSelect from "@/components/RoleSelect";
import DiscordIdInput from "@/components/DiscordIdInput";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import Avatar from "@/components/ui/Avatar";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { FILTER_SELECT, SURFACE, TABLE_HEAD, TABLE_ROW, TABLE_TOOLBAR, TD, TH } from "@/components/ui/styles";
import { ROLE_LABELS, USER_ROLES, type Profile, type UserRole } from "@/lib/types";
import { deleteUser, updateUserDiscordId, updateUserRole } from "./actions";

const ROLE_DOT: Record<UserRole, string> = {
  admin: "bg-nexa-navy dark:bg-blue-200",
  lider: "bg-amber-500",
  qa: "bg-nexa-sky",
  developer: "bg-nexa-blue",
  backend: "bg-emerald-500",
  frontend: "bg-purple-500",
  marketing: "bg-rose-500",
};

// Estado del integrante en Equipo Nexa (team_members.status).
const MEMBER_STATUS_LABEL: Record<string, string> = { activo: "Activo", pausado: "Pausado", retirado: "Retirado" };
const MEMBER_STATUS_STYLE: Record<string, string> = {
  activo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  pausado: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  retirado: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; role?: string; project?: string }>;
}) {
  const { role, project } = await searchParams;
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

  const [{ data: users }, { data: projectRows }, { data: projects }] = await Promise.all([
    query,
    supabase
      .from("team_member_projects")
      .select("project:projects(id, code, name), member:team_members(profile_id)"),
    supabase.from("projects").select("id, code, name").order("name"),
  ]);

  const projectsByProfileId = new Map<string, { id: string; code: string }[]>();
  for (const row of projectRows ?? []) {
    const profileId = (row.member as unknown as { profile_id: string | null } | null)?.profile_id;
    const p = row.project as unknown as { id: string; code: string } | null;
    if (!profileId || !p) continue;
    const list = projectsByProfileId.get(profileId) ?? [];
    list.push({ id: p.id, code: p.code });
    projectsByProfileId.set(profileId, list);
  }

  // Filtro por proyecto (se combina con el de rol): "none" = sin proyecto asignado.
  const rows = ((users as Profile[] | null) ?? []).filter((u) => {
    if (!project) return true;
    const assigned = projectsByProfileId.get(u.id) ?? [];
    return project === "none" ? assigned.length === 0 : assigned.some((p) => p.id === project);
  });

  const filterParams = new URLSearchParams();
  if (role) filterParams.set("role", role);
  if (project) filterParams.set("project", project);
  const returnQuery = filterParams.toString();
  const hasFilters = Boolean(role || project);


  // Carga y estado de cada persona (solo lectura; no cambia permisos).
  const [{ data: openTickets }, { data: memberStatus }] = await Promise.all([
    supabase.from("tickets").select("assignee_id").not("assignee_id", "is", null).not("status", "in", "(resolved,closed)"),
    supabase.from("team_members").select("profile_id, status").not("profile_id", "is", null),
  ]);
  const pendingBy = new Map<string, number>();
  for (const t of openTickets ?? []) pendingBy.set(t.assignee_id!, (pendingBy.get(t.assignee_id!) ?? 0) + 1);
  const statusBy = new Map((memberStatus ?? []).map((m) => [m.profile_id as string, String(m.status)]));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Usuarios y roles"
        description={
          "Las cuentas nuevas entran con rol QA; asígnales su rol aquí." +
          (!isAdmin ? " Como líder, no puedes tocar cuentas admin ni de otros líderes, ni volver a nadie admin o líder." : "")
        }
      />

      <AutoSubmitForm className="flex flex-wrap items-center gap-2 text-sm" action="/admin/users">
        <label className="sr-only" htmlFor="u-role">Rol</label>
        <select id="u-role" name="role" defaultValue={role ?? ""} className={FILTER_SELECT}>
          <option value="">Rol: todos</option>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="u-project">Proyecto</label>
        <select id="u-project" name="project" defaultValue={project ?? ""} className={FILTER_SELECT}>
          <option value="">Proyecto: todos</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
          ))}
          <option value="none">Sin proyecto</option>
        </select>
        {hasFilters && (
          <Link
            href="/admin/users"
            className="inline-flex h-8 items-center rounded-md px-2.5 text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Limpiar filtros
          </Link>
        )}
      </AutoSubmitForm>

      <div className={SURFACE}>
        <div className={TABLE_TOOLBAR}>
          <SearchInput
            placeholder="Buscar por nombre o correo…"
            scopeSelector="#users-table-body"
            noResultsSelector="#users-no-local-matches"
            className="w-full sm:w-80"
          />
          <p className="ml-auto text-xs text-slate-500 dark:text-slate-400">
            {rows.length} {rows.length === 1 ? "usuario" : "usuarios"}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className={TABLE_HEAD}>
              <tr>
                <th scope="col" className={TH}>Usuario</th>
                <th scope="col" className={`${TH} w-44`}>Rol</th>
                <th scope="col" className={`${TH} w-40`}>Proyectos</th>
                <th scope="col" className={`${TH} w-28`}>Pendientes</th>
                <th scope="col" className={`${TH} w-28`}>Estado</th>
                <th scope="col" className={`${TH} w-44`}>Discord ID</th>
                <th scope="col" className={`${TH} w-12`}><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody id="users-table-body" className="divide-y divide-slate-100 dark:divide-slate-700/70">
              {rows.map((u) => {
                const displayName = u.full_name ?? u.email;
                const pending = pendingBy.get(u.id) ?? 0;
                const memberState = statusBy.get(u.id);
                return (
                  <tr key={u.id} data-search-row data-search-text={`${u.full_name ?? ""} ${u.email} ${ROLE_LABELS[u.role]}`} className={TABLE_ROW}>
                    <td className={`${TD} max-w-0`}>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={displayName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800 dark:text-slate-100">{displayName}</p>
                          <p className="truncate text-xs text-slate-400 dark:text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={TD}>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${ROLE_DOT[u.role]}`} aria-hidden="true" />
                        {!isAdmin && (u.role === "admin" || u.role === "lider") ? (
                          <span className="text-sm text-slate-600 dark:text-slate-300" title="Solo un admin la edita">
                            {ROLE_LABELS[u.role]}
                          </span>
                        ) : (
                          <RoleSelect
                            action={updateUserRole}
                            userId={u.id}
                            currentRole={u.role}
                            assignableRoles={assignableRoles}
                            disabled={u.id === admin.id}
                            returnQuery={returnQuery}
                          />
                        )}
                      </div>
                    </td>
                    <td className={TD}>
                      {(projectsByProfileId.get(u.id) ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {projectsByProfileId.get(u.id)!.map(({ id, code }) => (
                            <span key={id} className="rounded-[4px] bg-nexa-light px-1.5 py-0.5 text-[11px] font-semibold text-nexa-blue dark:bg-blue-950/40 dark:text-blue-300">
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className={TD}>
                      {pending > 0 ? (
                        <Link
                          href={`/dashboard?assignee=${u.id}`}
                          className="tabular-nums text-slate-700 hover:text-nexa-blue hover:underline dark:text-slate-200"
                          title={`Ver los tickets pendientes de ${displayName}`}
                        >
                          {pending} {pending === 1 ? "ticket" : "tickets"}
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Sin carga</span>
                      )}
                    </td>
                    <td className={TD}>
                      <span
                        className={`inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          MEMBER_STATUS_STYLE[memberState ?? ""] ?? "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400"
                        }`}
                      >
                        {MEMBER_STATUS_LABEL[memberState ?? ""] ?? "Sin ficha"}
                      </span>
                    </td>
                    <td className={TD}>
                      <DiscordIdInput action={updateUserDiscordId} userId={u.id} currentDiscordId={u.discord_id} returnQuery={returnQuery} />
                    </td>
                    <td className={`${TD} text-right`}>
                      {isAdmin && u.id !== admin.id && (
                        <DropdownMenu label={`Más acciones para ${displayName}`}>
                          <form action={deleteUser}>
                            <input type="hidden" name="user_id" value={u.id} />
                            <input type="hidden" name="return_query" value={returnQuery} />
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
          Ningún usuario coincide con tu búsqueda.
        </p>
      </div>
    </div>
  );
}
