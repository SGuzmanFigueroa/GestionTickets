-- Asignar vs. reasignar (reemplaza las reglas de asignado de 0010/0013):
-- - Asignar un ticket sin responsable: líder, QA o quien participa en el ticket.
-- - Reasignar un ticket que ya tiene responsable: solo líder o admin.
-- - Un QA que no participa en el ticket solo puede asignarlo; nada más.
-- Refleja lib/ticket-permissions.ts.

create or replace function is_qa()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'qa'::user_role);
$$;

-- Los QA necesitan poder hacer UPDATE para asignar tickets ajenos; el
-- trigger de abajo limita qué pueden cambiar.
drop policy if exists "reporter, assignee, leader or admin can update a ticket" on tickets;
create policy "reporter, assignee, leader, qa or admin can update a ticket"
  on tickets for update
  to authenticated
  using (auth.uid() = reporter_id or auth.uid() = assignee_id or is_admin() or is_leader() or is_qa())
  with check (auth.uid() = reporter_id or auth.uid() = assignee_id or is_admin() or is_leader() or is_qa());

create or replace function enforce_ticket_locks()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  involved boolean := coalesce(auth.uid() = old.reporter_id, false) or coalesce(auth.uid() = old.assignee_id, false);
begin
  -- No end-user session (service role / SQL editor) or admin: allow.
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if old.status in ('resolved', 'closed')
     and (new.status is distinct from old.status
          or new.assignee_id is distinct from old.assignee_id) then
    raise exception 'Ticket finalizado: solo un admin puede cambiar el estado o el asignado.';
  end if;

  -- Reasignar (ya tenía responsable): solo líder.
  if old.assignee_id is not null
     and new.assignee_id is distinct from old.assignee_id
     and not is_leader() then
    raise exception 'Ticket asignado: solo un líder o un admin puede reasignarlo.';
  end if;

  -- QA que no participa en el ticket: solo puede asignarlo (sin tocar nada más).
  if not involved and not is_leader()
     and (to_jsonb(new) - 'assignee_id' - 'updated_at') is distinct from (to_jsonb(old) - 'assignee_id' - 'updated_at') then
    raise exception 'Solo puedes asignar este ticket; el resto lo cambia quien participa en él, un líder o un admin.';
  end if;

  return new;
end;
$$;
