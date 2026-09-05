export type UserRole = "admin" | "qa" | "developer" | "backend" | "frontend";

export const USER_ROLES: UserRole[] = ["admin", "qa", "developer", "backend", "frontend"];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
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
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  project_id: string;
  title: string;
  description: string;
  steps_to_reproduce: string | null;
  environment: string | null;
  severity: TicketSeverity;
  priority: TicketPriority;
  status: TicketStatus;
  reporter_id: string;
  assignee_id: string | null;
  target_role: UserRole | null;
  created_at: string;
  updated_at: string;
}

export interface TicketWithRelations extends Ticket {
  project: Pick<Project, "id" | "name" | "slug">;
  reporter: Pick<Profile, "id" | "full_name" | "email"> | null;
  assignee: Pick<Profile, "id" | "full_name" | "email"> | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: Pick<Profile, "id" | "full_name" | "email"> | null;
}
