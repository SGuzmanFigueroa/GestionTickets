-- Bug tracker schema: roles, projects (apps), tickets, comments
-- Run this in the Supabase SQL editor of your project (or via `supabase db push`).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('admin', 'qa', 'developer', 'backend', 'frontend');
create type ticket_status as enum ('open', 'in_progress', 'in_review', 'resolved', 'closed', 'reopened');
create type ticket_severity as enum ('critical', 'high', 'medium', 'low');
create type ticket_priority as enum ('urgent', 'high', 'medium', 'low');

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users, holds the role used for permissions
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'qa',
  created_at timestamptz not null default now()
);

-- Auto-create a profile whenever a new user signs up (default role: qa).
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------------
-- projects: the apps being tracked (Inventra, etc.)
-- ---------------------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- tickets: bug reports scoped to a project
-- ---------------------------------------------------------------------------
create table tickets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  description text not null,
  steps_to_reproduce text,
  environment text,
  severity ticket_severity not null default 'medium',
  priority ticket_priority not null default 'medium',
  status ticket_status not null default 'open',
  reporter_id uuid not null references profiles (id),
  assignee_id uuid references profiles (id),
  target_role user_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tickets_project_id_idx on tickets (project_id);
create index tickets_status_idx on tickets (status);
create index tickets_assignee_id_idx on tickets (assignee_id);

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tickets_set_updated_at
  before update on tickets
  for each row execute procedure set_updated_at();

-- ---------------------------------------------------------------------------
-- ticket_comments
-- ---------------------------------------------------------------------------
create table ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets (id) on delete cascade,
  author_id uuid not null references profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

create index ticket_comments_ticket_id_idx on ticket_comments (ticket_id);

-- ---------------------------------------------------------------------------
-- ticket_history: lightweight audit trail of status/assignee changes
-- ---------------------------------------------------------------------------
create table ticket_history (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets (id) on delete cascade,
  actor_id uuid not null references profiles (id),
  field text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table projects enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security;
alter table ticket_history enable row level security;

-- Helper: is the current user an admin?
create function is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles policies
create policy "profiles are readable by any authenticated user"
  on profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile (not role)"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));

create policy "admins can update any profile"
  on profiles for update
  to authenticated
  using (is_admin());

-- projects policies
create policy "projects are readable by any authenticated user"
  on projects for select
  to authenticated
  using (true);

create policy "admins manage projects"
  on projects for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- tickets policies
create policy "tickets are readable by any authenticated user"
  on tickets for select
  to authenticated
  using (true);

create policy "any authenticated user can report a ticket"
  on tickets for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "reporter, assignee or admin can update a ticket"
  on tickets for update
  to authenticated
  using (auth.uid() = reporter_id or auth.uid() = assignee_id or is_admin())
  with check (auth.uid() = reporter_id or auth.uid() = assignee_id or is_admin());

create policy "admins can delete tickets"
  on tickets for delete
  to authenticated
  using (is_admin());

-- ticket_comments policies
create policy "comments are readable by any authenticated user"
  on ticket_comments for select
  to authenticated
  using (true);

create policy "any authenticated user can comment"
  on ticket_comments for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "admins can delete comments"
  on ticket_comments for delete
  to authenticated
  using (is_admin());

-- ticket_history policies
create policy "history is readable by any authenticated user"
  on ticket_history for select
  to authenticated
  using (true);

create policy "any authenticated user can write history for their own action"
  on ticket_history for insert
  to authenticated
  with check (actor_id = auth.uid());
