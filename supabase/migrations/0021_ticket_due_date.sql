-- Fecha límite del ticket. La pone un líder (o admin).
-- - Al editar: due_date es un dato más del ticket, así que enforce_ticket_locks
--   (migración 0016) ya exige líder y ticket no finalizado.
-- - Al crear: si quien reporta no es líder ni admin, se descarta.

alter table tickets add column if not exists due_date date;

create or replace function enforce_ticket_due_date_on_insert()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.due_date is not null and auth.uid() is not null and not is_admin() and not is_leader() then
    new.due_date := null;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_due_date_on_insert on tickets;
create trigger tickets_due_date_on_insert
  before insert on tickets
  for each row execute function enforce_ticket_due_date_on_insert();
