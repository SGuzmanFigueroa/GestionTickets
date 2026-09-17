import { requireProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import LiveRefresh from "@/components/LiveRefresh";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const leader = profile.role === "lider";

  return (
    <div className="min-h-screen bg-nexa-gray dark:bg-slate-900 md:flex">
      <LiveRefresh />
      <Sidebar profile={profile} isLeader={leader} />
      <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
