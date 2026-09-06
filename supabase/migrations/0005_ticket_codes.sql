-- Short Jira-style ticket codes: <PROJECT_CODE>-<ticket_number>, e.g. INV-1.

alter table projects add column code text;
update projects set code = upper(left(regexp_replace(name, '[^a-zA-Z]', '', 'g'), 3)) where code is null;
alter table projects alter column code set not null;
alter table projects add constraint projects_code_key unique (code);

alter table tickets add column ticket_number integer;

-- Backfill existing tickets with a per-project sequence based on creation order.
with numbered as (
  select id, row_number() over (partition by project_id order by created_at) as rn
  from tickets
)
update tickets t set ticket_number = numbered.rn
from numbered
where numbered.id = t.id;

alter table tickets alter column ticket_number set not null;
alter table tickets add constraint tickets_project_id_ticket_number_key unique (project_id, ticket_number);

create function set_ticket_number()
returns trigger
language plpgsql
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

create trigger tickets_set_ticket_number
  before insert on tickets
  for each row execute procedure set_ticket_number();
