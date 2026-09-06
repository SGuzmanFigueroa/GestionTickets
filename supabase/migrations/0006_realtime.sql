-- Let the app subscribe to live changes instead of requiring a manual refresh.
alter publication supabase_realtime add table tickets;
alter publication supabase_realtime add table ticket_comments;
alter publication supabase_realtime add table ticket_history;
alter publication supabase_realtime add table test_cases;
alter publication supabase_realtime add table ticket_attachments;
