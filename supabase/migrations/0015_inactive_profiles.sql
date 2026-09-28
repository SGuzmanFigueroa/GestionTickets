-- Perfiles de personas pausadas o retiradas en Equipo Nexa (team_members.status).
-- El dashboard las excluye de "Personas sin carga". team_members solo lo leen
-- admin/líderes, así que esto expone únicamente los ids, no el resto del registro.
create or replace function inactive_profile_ids()
returns setof uuid
language sql
stable
security definer set search_path = public
as $$
  select profile_id from team_members
  where profile_id is not null and status in ('pausado', 'retirado');
$$;

revoke all on function inactive_profile_ids() from public, anon;
grant execute on function inactive_profile_ids() to authenticated;
