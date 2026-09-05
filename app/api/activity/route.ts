import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { STATUS_LABELS, type TicketStatus } from "@/lib/types";

export interface ActivityItem {
  id: string;
  type: "ticket_created" | "comment" | "status_change";
  text: string;
  href: string;
  created_at: string;
}

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ items: [] }, { status: 401 });

  const supabase = await createClient();

  const [{ data: tickets }, { data: comments }, { data: history }] = await Promise.all([
    supabase
      .from("tickets")
      .select("id, title, created_at, reporter:profiles!tickets_reporter_id_fkey(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("ticket_comments")
      .select("id, ticket_id, created_at, author:profiles(full_name, email), ticket:tickets(title)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("ticket_history")
      .select(
        "id, ticket_id, field, new_value, created_at, actor:profiles(full_name, email), ticket:tickets(title)",
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const items: ActivityItem[] = [];

  for (const t of tickets ?? []) {
    const reporter = Array.isArray(t.reporter) ? t.reporter[0] : t.reporter;
    items.push({
      id: `ticket-${t.id}`,
      type: "ticket_created",
      text: `${reporter?.full_name ?? reporter?.email ?? "Alguien"} reportó "${t.title}"`,
      href: `/tickets/${t.id}`,
      created_at: t.created_at,
    });
  }

  for (const c of comments ?? []) {
    const author = Array.isArray(c.author) ? c.author[0] : c.author;
    const ticket = Array.isArray(c.ticket) ? c.ticket[0] : c.ticket;
    items.push({
      id: `comment-${c.id}`,
      type: "comment",
      text: `${author?.full_name ?? author?.email ?? "Alguien"} comentó en "${ticket?.title ?? "un ticket"}"`,
      href: `/tickets/${c.ticket_id}`,
      created_at: c.created_at,
    });
  }

  for (const h of history ?? []) {
    if (h.field !== "status") continue;
    const actor = Array.isArray(h.actor) ? h.actor[0] : h.actor;
    const ticket = Array.isArray(h.ticket) ? h.ticket[0] : h.ticket;
    const statusLabel = STATUS_LABELS[h.new_value as TicketStatus] ?? h.new_value;
    items.push({
      id: `history-${h.id}`,
      type: "status_change",
      text: `${actor?.full_name ?? actor?.email ?? "Alguien"} cambió "${ticket?.title ?? "un ticket"}" a ${statusLabel}`,
      href: `/tickets/${h.ticket_id}`,
      created_at: h.created_at,
    });
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ items: items.slice(0, 15) });
}
