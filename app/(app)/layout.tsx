import { requireProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import LiveRefresh from "@/components/LiveRefresh";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const leader = profile.role === "lider";

  return (
    <div className="min-h-screen bg-nexa-gray dark:bg-slate-900 md:flex">
      <LiveRefresh />
      <Sidebar profile={profile} isLeader={leader} />
      <div className="hidden md:block">
        <div className="fixed right-6 top-6 z-30">
          <NotificationBell />
        </div>
      </div>
      <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
