-- Screenshots pasted (Ctrl+V) when reporting a ticket.

insert into storage.buckets (id, name, public)
values ('ticket-images', 'ticket-images', true)
on conflict (id) do nothing;

create policy "authenticated users can upload ticket images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ticket-images');

create table ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets (id) on delete cascade,
  url text not null,
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index ticket_attachments_ticket_id_idx on ticket_attachments (ticket_id);

alter table ticket_attachments enable row level security;

create policy "attachments are readable by any authenticated user"
  on ticket_attachments for select
  to authenticated
  using (true);

create policy "any authenticated user can add an attachment"
  on ticket_attachments for insert
  to authenticated
  with check (uploaded_by = auth.uid());

create policy "admins can delete attachments"
  on ticket_attachments for delete
  to authenticated
  using (is_admin());
