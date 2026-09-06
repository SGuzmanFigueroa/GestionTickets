"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const WATCHED_TABLES = [
  "tickets",
  "ticket_comments",
  "ticket_history",
  "ticket_attachments",
  "test_cases",
];

// Refreshes the current route's server-rendered data when anyone (including
// another person) changes a watched table, so nobody has to hit reload.
export default function LiveRefresh() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("live-data-changes");

    for (const table of WATCHED_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        // Debounce: several rows can change in the same action (e.g. a
        // ticket update plus a history row) — one refresh covers all of them.
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => router.refresh(), 300);
      });
    }

    channel.subscribe();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
