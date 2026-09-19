-- Once a ticket is finalized (resolved/closed) or assigned, only admins can
-- change its status / assignee. Leaders also can't change the status of a
-- ticket assigned to someone else. Mirrors lib/ticket-permissions.ts.

create or replace function enforce_ticket_locks()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
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

  if old.assignee_id is not null
     and new.assignee_id is distinct from old.assignee_id then
    raise exception 'Ticket asignado: solo un admin puede cambiar la persona asignada.';
  end if;

  if new.status is distinct from old.status
     and old.assignee_id is not null
     and is_leader()
     and auth.uid() is distinct from old.assignee_id
     and auth.uid() is distinct from old.reporter_id then
    raise exception 'Un líder no puede cambiar el estado de un ticket asignado a otra persona.';
  end if;

  return new;
end;
$$;

drop trigger if exists tickets_enforce_locks on tickets;
create trigger tickets_enforce_locks
  before update on tickets
  for each row execute function enforce_ticket_locks();
