-- Allow deleting a user without being blocked by their past activity.
-- Historical tickets/comments/test cases keep existing but show no author
-- once that profile is deleted (ON DELETE SET NULL instead of the implicit
-- NO ACTION/RESTRICT from the original foreign keys).

alter table tickets alter column reporter_id drop not null;
alter table tickets drop constraint tickets_reporter_id_fkey;
alter table tickets
  add constraint tickets_reporter_id_fkey foreign key (reporter_id) references profiles (id) on delete set null;

alter table tickets drop constraint tickets_assignee_id_fkey;
alter table tickets
  add constraint tickets_assignee_id_fkey foreign key (assignee_id) references profiles (id) on delete set null;

alter table ticket_comments alter column author_id drop not null;
alter table ticket_comments drop constraint ticket_comments_author_id_fkey;
alter table ticket_comments
  add constraint ticket_comments_author_id_fkey foreign key (author_id) references profiles (id) on delete set null;

alter table ticket_history alter column actor_id drop not null;
alter table ticket_history drop constraint ticket_history_actor_id_fkey;
alter table ticket_history
  add constraint ticket_history_actor_id_fkey foreign key (actor_id) references profiles (id) on delete set null;

alter table test_cases alter column created_by drop not null;
alter table test_cases drop constraint test_cases_created_by_fkey;
alter table test_cases
  add constraint test_cases_created_by_fkey foreign key (created_by) references profiles (id) on delete set null;

alter table test_cases drop constraint test_cases_last_run_by_fkey;
alter table test_cases
  add constraint test_cases_last_run_by_fkey foreign key (last_run_by) references profiles (id) on delete set null;
