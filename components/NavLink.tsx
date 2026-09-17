"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  icon,
  onNavigate,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  onNavigate?: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive ? "bg-white/10 text-white" : "text-blue-100/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {icon && (
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center ${
            isActive ? "text-nexa-sky" : "text-blue-200/60 group-hover:text-blue-100"
          }`}
        >
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
      {isActive && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-nexa-sky" aria-hidden="true" />}
    </Link>
  );
}
