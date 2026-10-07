-- 1) Cambiar un ticket de proyecto.
--    Al cambiar de proyecto recibe el siguiente correlativo del proyecto nuevo
--    (ej. MKT-5 → INV-77), porque (project_id, ticket_number) es único.
create or replace function renumber_ticket_on_project_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.project_id is distinct from old.project_id then
    select coalesce(max(ticket_number), 0) + 1 into new.ticket_number
    from tickets
    where project_id = new.project_id;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_renumber_on_project_change on tickets;
create trigger tickets_renumber_on_project_change
  before update of project_id on tickets
  for each row execute function renumber_ticket_on_project_change();

-- Un líder solo puede mover el ticket a uno de sus proyectos (admin: a cualquiera).
-- Se agrega a enforce_ticket_locks (resto igual que 0018).
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
    (to_jsonb(new) - 'status' - 'assignee_id' - 'updated_at' - 'ticket_number')
      is distinct from (to_jsonb(old) - 'status' - 'assignee_id' - 'updated_at' - 'ticket_number');
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

  if new.project_id is distinct from old.project_id
     and new.project_id not in (select my_project_ids()) then
    raise exception 'Solo puedes mover el ticket a uno de tus proyectos.';
  end if;

  return new;
end;
$$;

-- 2) Carga de tareas del bot de Discord.
--    El bot publica cada 2 min cuántas tareas abiertas (sin ticket vinculado)
--    tiene cada persona, por Discord ID. El dashboard las suma a los tickets
--    pendientes para "Personas sin carga" y "Más carga pendiente".
create table if not exists bot_task_load (
  discord_id text primary key,
  open_tasks integer not null check (open_tasks >= 0),
  updated_at timestamptz not null default now()
);

alter table bot_task_load enable row level security;

-- Solo conteos por Discord ID; lo escribe el bot con la service key.
create policy "task load is readable by any authenticated user"
  on bot_task_load for select to authenticated
  using (true);
