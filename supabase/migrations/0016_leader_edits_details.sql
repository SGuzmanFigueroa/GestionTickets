-- Reglas de edición de tickets (refleja lib/ticket-permissions.ts). Admin: todo.
-- - Finalizado (Resuelto/Cerrado): nadie más cambia estado, asignado ni datos.
-- - Reasignar (ya tenía responsable): solo líder.
-- - Estado: quien participa en el ticket o un líder.
-- - Datos (título, descripción, pasos, entorno, severidad, prioridad, área…):
--   solo líder, y solo si no está finalizado.
-- Además vuelve a conectar el trigger: la función existía pero el trigger
-- tickets_enforce_locks no estaba creado, así que estas reglas solo se
-- aplicaban en la app.

create or replace function enforce_ticket_locks()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  involved boolean := coalesce(auth.uid() = old.reporter_id, false) or coalesce(auth.uid() = old.assignee_id, false);
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

  if new.status is distinct from old.status and not involved and not is_leader() then
    raise exception 'Solo quien participa en el ticket, un líder o un admin puede cambiar su estado.';
  end if;

  if details_changed and not is_leader() then
    raise exception 'Solo un líder o un admin puede editar los datos del ticket.';
  end if;

  return new;
end;
$$;

drop trigger if exists tickets_enforce_locks on tickets;
create trigger tickets_enforce_locks
  before update on tickets
  for each row execute function enforce_ticket_locks();
