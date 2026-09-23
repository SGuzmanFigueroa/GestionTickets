-- Checklist de progreso por proyecto: cada punto esperado según el MVP o el
-- diseño en Figma, marcado como hecho a medida que se completa.

alter table projects add column if not exists figma_url text;
alter table projects add column if not exists mvp_url text;

create table if not exists project_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  section text,
  source text not null default 'mvp' check (source in ('mvp', 'figma')),
  figma_url text,
  done boolean not null default false,
  done_by uuid references profiles (id) on delete set null,
  done_at timestamptz,
  position int not null default 0,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists project_requirements_project_id_idx on project_requirements (project_id);

-- ¿Puede el usuario actual gestionar el checklist de este proyecto?
-- Admin, cualquier líder, o el líder asignado al proyecto.
create or replace function can_manage_project(p_project_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select is_admin() or is_leader() or exists (
    select 1 from projects where id = p_project_id and leader_id = auth.uid()
  );
$$;

alter table project_requirements enable row level security;

create policy "requirements are readable by any authenticated user"
  on project_requirements for select
  to authenticated
  using (true);

create policy "admins and leaders manage requirements"
  on project_requirements for all
  to authenticated
  using (can_manage_project(project_id))
  with check (can_manage_project(project_id));
