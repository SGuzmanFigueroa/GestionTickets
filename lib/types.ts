export type UserRole = "admin" | "lider" | "qa" | "developer" | "backend" | "frontend" | "marketing";

export const USER_ROLES: UserRole[] = ["admin", "lider", "qa", "developer", "backend", "frontend", "marketing"];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  lider: "Líder",
  qa: "QA",
  developer: "Developer",
  backend: "Backend",
  frontend: "Frontend",
  marketing: "Marketing",
};

export type TicketStatus =
  | "open"
  | "in_progress"
  | "done"
  | "in_review"
  | "resolved"
  | "closed"
  | "reopened";

export const TICKET_STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "done",
  "in_review",
  "resolved",
  "closed",
  "reopened",
];

// "resolved" se muestra como "Certificado": QA ya lo revisó y lo dio por bueno.
export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Por hacer",
  in_progress: "En progreso",
  done: "Hecho",
  in_review: "En revisión",
  resolved: "Certificado",
  closed: "Cerrado",
  reopened: "Reabierto",
};

/** Columnas del tablero kanban, en orden, con los estados que agrupa cada una. */
export const BOARD_COLUMNS: { id: TicketStatus; label: string; statuses: TicketStatus[] }[] = [
  { id: "open", label: "Por hacer", statuses: ["open", "reopened"] },
  { id: "in_progress", label: "En progreso", statuses: ["in_progress"] },
  { id: "done", label: "Hecho", statuses: ["done"] },
  { id: "in_review", label: "En revisión", statuses: ["in_review"] },
  { id: "resolved", label: "Certificado", statuses: ["resolved"] },
];

export type TicketSeverity = "critical" | "high" | "medium" | "low";
export const TICKET_SEVERITIES: TicketSeverity[] = ["critical", "high", "medium", "low"];

export const SEVERITY_LABELS: Record<TicketSeverity, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export type TicketPriority = "urgent" | "high" | "medium" | "low";
export const TICKET_PRIORITIES: TicketPriority[] = ["urgent", "high", "medium", "low"];

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  discord_id: string | null;
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

export type RequirementSource = "mvp" | "figma";

export const REQUIREMENT_SOURCE_LABELS: Record<RequirementSource, string> = {
  mvp: "MVP",
  figma: "Figma",
};

export interface ProjectRequirement {
  id: string;
  project_id: string;
  title: string;
  section: string | null;
  source: RequirementSource;
  figma_url: string | null;
  done: boolean;
  done_by: string | null;
  done_at: string | null;
  position: number;
  created_at: string;
}
