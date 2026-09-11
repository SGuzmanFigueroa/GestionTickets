-- Unify "líder" into the single shared profiles.role enum instead of a
-- separate equipo-nexa-only team_members.is_leader flag: one place to
-- assign it (this app's Usuarios y roles page), one value to check
-- everywhere, in both apps. is_leader() itself is redefined in
-- equipo-nexa's migrations (where it originally lived) to check
-- profiles.role = 'lider' instead of the now-dropped team_members column.

alter type user_role add value if not exists 'lider';

-- A leader can update anyone's role except an existing admin's or another
-- leader's, and can't grant admin or líder either — both directions
-- blocked in USING/WITH CHECK. Replaces the earlier "non-admin" version
-- of this policy, which didn't yet account for líder itself.
drop policy if exists "leaders can update non-admin roles" on profiles;
drop policy if exists "leaders can update non-elevated roles" on profiles;
create policy "leaders can update non-elevated roles"
  on profiles for update
  to authenticated
  using (is_leader() and role not in ('admin'::user_role, 'lider'::user_role))
  with check (is_leader() and role not in ('admin'::user_role, 'lider'::user_role));
