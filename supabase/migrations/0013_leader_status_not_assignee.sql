-- Un líder puede cambiar el estado de cualquier ticket no finalizado, pero
-- no puede elegir la persona asignada (salvo en tickets que él reportó).
-- Reemplaza la regla de 0010 que hacía lo contrario. Refleja lib/ticket-permissions.ts.

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

  if new.assignee_id is distinct from old.assignee_id
     and is_leader()
     and auth.uid() is distinct from old.reporter_id then
    raise exception 'Un líder no puede elegir la persona asignada de un ticket que no reportó.';
  end if;

  return new;
end;
$$;
