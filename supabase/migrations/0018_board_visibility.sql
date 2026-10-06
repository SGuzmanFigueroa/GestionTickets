-- Tablero kanban: visibilidad por persona/proyecto y movimientos por etapa.
-- Refleja lib/ticket-permissions.ts.

-- 1) El número correlativo (MKT-10…) debe calcularse sobre TODOS los tickets
--    del proyecto, no solo los visibles para quien crea el ticket.
create or replace function set_ticket_number()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.ticket_number is null then
    select coalesce(max(ticket_number), 0) + 1 into new.ticket_number
    from tickets
    where project_id = new.project_id;
  end if;
  return new;
end;
$$;

-- 2) Proyectos de la persona actual: los asignados en Equipo Nexa
--    (team_member_projects) y los que lidera (projects.leader_id).
create or replace function my_project_ids()
returns setof uuid
language sql
stable
security definer set search_path = public
as $$
  select tmp.project_id
  from team_member_projects tmp
  join team_members tm on tm.id = tmp.member_id
  where tm.profile_id = auth.uid()
  union
  select id from projects where leader_id = auth.uid();
$$;

revoke all on function my_project_ids() from public, anon;
grant execute on function my_project_ids() to authenticated;

-- 3) Quién ve cada ticket:
--    admin: todos · líder: los de sus proyectos · todos: los que reportó o tiene asignados.
drop policy if exists "tickets are readable by any authenticated user" on tickets;
create policy "tickets are visible to admin, project leaders and involved people"
  on tickets for select
  to authenticated
  using (
    is_admin()
    or reporter_id = auth.uid()
    or assignee_id = auth.uid()
    or (is_leader() and project_id in (select my_project_ids()))
  );

-- Comentarios, historial y capturas siguen la visibilidad de su ticket.
drop policy if exists "comments are readable by any authenticated user" on ticket_comments;
create policy "comments follow ticket visibility"
  on ticket_comments for select to authenticated
  using (exists (select 1 from tickets t where t.id = ticket_id));

drop policy if exists "any authenticated user can comment" on ticket_comments;
create policy "people who see the ticket can comment"
  on ticket_comments for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from tickets t where t.id = ticket_id));

drop policy if exists "history is readable by any authenticated user" on ticket_history;
create policy "history follows ticket visibility"
  on ticket_history for select to authenticated
  using (exists (select 1 from tickets t where t.id = ticket_id));

drop policy if exists "attachments are readable by any authenticated user" on ticket_attachments;
create policy "attachments follow ticket visibility"
  on ticket_attachments for select to authenticated
  using (exists (select 1 from tickets t where t.id = ticket_id));

drop policy if exists "any authenticated user can add an attachment" on ticket_attachments;
create policy "people who see the ticket can add attachments"
  on ticket_attachments for insert to authenticated
  with check (exists (select 1 from tickets t where t.id = ticket_id));

-- 4) Movimientos de estado por etapa (además de las reglas de 0016):
--    responsable: Por hacer ↔ En progreso ↔ Hecho
--    QA: Hecho → En revisión / Reabierto; En revisión → Certificado / Hecho / Reabierto
--    líder: cualquiera (mientras no esté finalizado) · admin: todo.
create or replace function enforce_ticket_locks()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  is_assignee boolean := coalesce(auth.uid() = old.assignee_id, false);
  finalized boolean := old.status in ('resolved', 'closed');
  details_changed boolean :=
    (to_jsonb(new) - 'status' - 'assignee_id' - 'updated_at')
      is distinct from (to_jsonb(old) - 'status' - 'assignee_id' - 'updated_at');
begin
  -- No end-user session (service role / bot / SQL editor) or admin: allow.
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if finalized
     and (new.status is distinct from old.status
          or new.assignee_id is distinct from old.assignee_id
          or details_changed) then
    raise exception 'Ticket finalizado: solo un admin puede modificarlo.';
  end if;

  if old.assignee_id is not null
     and new.assignee_id is distinct from old.assignee_id
     and not is_leader() then
    raise exception 'Ticket asignado: solo un líder o un admin puede reasignarlo.';
  end if;

  if new.status is distinct from old.status and not is_leader() then
    if not (
      (is_assignee
        and old.status in ('open', 'reopened', 'in_progress', 'done')
        and new.status in ('open', 'in_progress', 'done'))
      or (is_qa() and (
        (old.status = 'done' and new.status in ('in_review', 'reopened'))
        or (old.status = 'in_review' and new.status in ('resolved', 'done', 'reopened'))
      ))
    ) then
      raise exception 'No puedes mover el ticket a ese estado.';
    end if;
  end if;

  if details_changed and not is_leader() then
    raise exception 'Solo un líder o un admin puede editar los datos del ticket.';
  end if;

  return new;
end;
$$;
