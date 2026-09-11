-- Extend equipo-nexa's "líder" concept (team_members.is_leader / is_leader(),
-- defined in that app's migrations) into bug-tracker: a leader can reassign
-- any ticket and assign non-admin roles to other accounts, without becoming
-- a bug-tracker admin. Both apps share this Supabase project, so is_leader()
-- is already available here.

drop policy "reporter, assignee or admin can update a ticket" on tickets;
create policy "reporter, assignee, leader or admin can update a ticket"
  on tickets for update
  to authenticated
  using (auth.uid() = reporter_id or auth.uid() = assignee_id or is_admin() or is_leader())
  with check (auth.uid() = reporter_id or auth.uid() = assignee_id or is_admin() or is_leader());

-- Leaders can change anyone's role EXCEPT touching an admin account or
-- granting admin — both the row being edited and the new value must be
-- non-admin.
create policy "leaders can update non-admin roles"
  on profiles for update
  to authenticated
  using (is_leader() and role <> 'admin'::user_role)
  with check (is_leader() and role <> 'admin'::user_role);
