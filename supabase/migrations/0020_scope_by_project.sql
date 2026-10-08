-- Cada rol ve solo lo de sus proyectos (admin: todo).
-- Proyectos de una persona = my_project_ids() (Equipo Nexa + projects.leader_id).

-- Casos de prueba: admin, miembros del proyecto o quien lo creó.
drop policy if exists "test cases are readable by any authenticated user" on test_cases;
create policy "test cases visible to admin and project members"
  on test_cases for select to authenticated
  using (is_admin() or project_id in (select my_project_ids()) or created_by = auth.uid());

drop policy if exists "any authenticated user can edit or run a test case" on test_cases;
create policy "project members can edit or run a test case"
  on test_cases for update to authenticated
  using (is_admin() or project_id in (select my_project_ids()) or created_by = auth.uid())
  with check (is_admin() or project_id in (select my_project_ids()) or created_by = auth.uid());

drop policy if exists "any authenticated user can create a test case" on test_cases;
create policy "project members can create a test case"
  on test_cases for insert to authenticated
  with check (is_admin() or project_id in (select my_project_ids()));

-- Checklist de progreso: lo ven el admin y los miembros del proyecto.
drop policy if exists "requirements are readable by any authenticated user" on project_requirements;
create policy "requirements visible to admin and project members"
  on project_requirements for select to authenticated
  using (is_admin() or project_id in (select my_project_ids()));

-- Gestionar el checklist: admin o un líder de ESE proyecto (antes: cualquier líder).
create or replace function can_manage_project(p_project_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select is_admin()
    or (is_leader() and p_project_id in (select my_project_ids()))
    or exists (select 1 from projects where id = p_project_id and leader_id = auth.uid());
$$;

-- Personas que comparten proyecto conmigo (miembros en Equipo Nexa + líderes
-- de esos proyectos). Para que un líder vea solo a la gente de sus proyectos.
create or replace function my_project_member_ids()
returns setof uuid
language sql
stable
security definer set search_path = public
as $$
  select distinct tm.profile_id
  from team_member_projects tmp
  join team_members tm on tm.id = tmp.member_id
  where tm.profile_id is not null and tmp.project_id in (select my_project_ids())
  union
  select leader_id from projects where leader_id is not null and id in (select my_project_ids())
  union
  select auth.uid();
$$;

revoke all on function my_project_member_ids() from public, anon;
grant execute on function my_project_member_ids() to authenticated;
