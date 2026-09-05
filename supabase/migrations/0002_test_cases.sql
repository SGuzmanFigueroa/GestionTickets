-- Test cases: QA writes/edits test cases per app and records pass/fail results.
-- A failed case can be linked to a bug ticket.

create type test_case_status as enum ('not_run', 'passed', 'failed', 'blocked');

create table test_cases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  preconditions text,
  steps text not null,
  expected_result text not null,
  status test_case_status not null default 'not_run',
  last_run_by uuid references profiles (id),
  last_run_at timestamptz,
  last_run_notes text,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index test_cases_project_id_idx on test_cases (project_id);
create index test_cases_status_idx on test_cases (status);

create trigger test_cases_set_updated_at
  before update on test_cases
  for each row execute procedure set_updated_at();

-- A ticket can originate from a failed test case.
alter table tickets add column test_case_id uuid references test_cases (id) on delete set null;

alter table test_cases enable row level security;

create policy "test cases are readable by any authenticated user"
  on test_cases for select
  to authenticated
  using (true);

create policy "any authenticated user can create a test case"
  on test_cases for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "any authenticated user can edit or run a test case"
  on test_cases for update
  to authenticated
  using (true)
  with check (true);

create policy "admins can delete test cases"
  on test_cases for delete
  to authenticated
  using (is_admin());
