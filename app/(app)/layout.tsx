import { Suspense } from "react";
import { cookies } from "next/headers";
import { requireProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import LiveRefresh from "@/components/LiveRefresh";
import Toaster from "@/components/ui/Toaster";
import { SIDEBAR_COOKIE } from "@/lib/ui-prefs";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [profile, cookieStore] = await Promise.all([requireProfile(), cookies()]);
  const leader = profile.role === "lider";
  const sidebarCollapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed";

  return (
    <div className="min-h-screen bg-nexa-gray dark:bg-slate-900 md:flex">
      <LiveRefresh />
      <Sidebar profile={profile} isLeader={leader} initialCollapsed={sidebarCollapsed} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="hidden h-12 border-b border-slate-200 md:block dark:border-slate-800" />}>
          <Topbar profile={profile} />
        </Suspense>
        <main className="flex-1 px-4 py-4 md:px-6 md:py-5">
          <div className="mx-auto w-full max-w-[1920px]">{children}</div>
        </main>
      </div>
      <Suspense>
        <Toaster />
      </Suspense>
    </div>
  );
}
