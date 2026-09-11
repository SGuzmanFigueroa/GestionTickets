export type UserRole = "admin" | "lider" | "qa" | "developer" | "backend" | "frontend";

export const USER_ROLES: UserRole[] = ["admin", "lider", "qa", "developer", "backend", "frontend"];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  lider: "Líder",
  qa: "QA",
  developer: "Developer",
  backend: "Backend",
  frontend: "Frontend",
};

export type TicketStatus =
  | "open"
  | "in_progress"
  | "in_review"
  | "resolved"
  | "closed"
  | "reopened";

export const TICKET_STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "in_review",
  "resolved",
  "closed",
  "reopened",
];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Abierto",
  in_progress: "En progreso",
  in_review: "En revisión",
  resolved: "Resuelto",
  closed: "Cerrado",
  reopened: "Reabierto",
};

export type TicketSeverity = "critical" | "high" | "medium" | "low";
export const TICKET_SEVERITIES: TicketSeverity[] = ["critical", "high", "medium", "low"];

export type TicketPriority = "urgent" | "high" | "medium" | "low";
export const TICKET_PRIORITIES: TicketPriority[] = ["urgent", "high", "medium", "low"];

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  project_id: string;
  ticket_number: number;
  title: string;
  description: string;
  steps_to_reproduce: string | null;
  environment: string | null;
  severity: TicketSeverity;
  priority: TicketPriority;
  status: TicketStatus;
  reporter_id: string | null;
  assignee_id: string | null;
  target_role: UserRole | null;
  test_case_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketWithRelations extends Ticket {
  project: Pick<Project, "id" | "name" | "slug" | "code">;
  reporter: Pick<Profile, "id" | "full_name" | "email"> | null;
  assignee: Pick<Profile, "id" | "full_name" | "email"> | null;
  test_case: Pick<TestCase, "id" | "title"> | null;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  url: string;
  uploaded_by: string | null;
  created_at: string;
}

export type TestCaseStatus = "not_run" | "passed" | "failed" | "blocked";

export const TEST_CASE_STATUSES: TestCaseStatus[] = ["not_run", "passed", "failed", "blocked"];

export const TEST_CASE_STATUS_LABELS: Record<TestCaseStatus, string> = {
  not_run: "Sin ejecutar",
  passed: "Pasó",
  failed: "Falló",
  blocked: "Bloqueado",
};

export interface TestCase {
  id: string;
  project_id: string;
  title: string;
  preconditions: string | null;
  steps: string;
  expected_result: string;
  status: TestCaseStatus;
  last_run_by: string | null;
  last_run_at: string | null;
  last_run_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestCaseWithRelations extends TestCase {
  project: Pick<Project, "id" | "name" | "slug" | "code">;
  last_run_by_profile: Pick<Profile, "id" | "full_name" | "email"> | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  author: Pick<Profile, "id" | "full_name" | "email"> | null;
}
