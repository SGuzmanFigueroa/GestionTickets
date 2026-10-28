-- Borrar imágenes adjuntas por si alguien se equivocó.
-- Pueden borrar: quien subió la imagen, los líderes y el admin
-- (siempre que vean el ticket). Refleja canDeleteAttachment en el detalle.

drop policy if exists "admins can delete attachments" on ticket_attachments;
drop policy if exists "uploader, leaders and admins can delete attachments" on ticket_attachments;
create policy "uploader, leaders and admins can delete attachments"
  on ticket_attachments for delete to authenticated
  using (
    (uploaded_by = auth.uid() or is_leader() or is_admin())
    and exists (select 1 from tickets t where t.id = ticket_id)
  );

-- El archivo en Storage: su dueño (quien lo subió), líderes y admin.
drop policy if exists "uploader, leaders and admins can delete ticket images" on storage.objects;
create policy "uploader, leaders and admins can delete ticket images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'ticket-images' and (owner_id = auth.uid()::text or is_leader() or is_admin()));
