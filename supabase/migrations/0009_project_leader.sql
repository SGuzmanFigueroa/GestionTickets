-- Lets an app/project be assigned a "Líder Nexa" when created, picked only
-- from accounts with profiles.role = 'lider' (see 0008_unify_lider_role.sql).
alter table projects add column if not exists leader_id uuid references profiles(id) on delete set null;
