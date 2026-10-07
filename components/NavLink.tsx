"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  icon,
  onNavigate,
  collapsed = false,
  match,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  onNavigate?: () => void;
  /** Sidebar colapsada: solo el ícono, con el nombre como tooltip. */
  collapsed?: boolean;
  /** Regla propia de "activo" (ej. Tickets también en /tickets/[id]). */
  match?: (pathname: string) => boolean;
  children: string;
}) {
  const pathname = usePathname();
  const isActive = match ? match(pathname) : pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? children : undefined}
      aria-label={collapsed ? children : undefined}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex h-8 items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-sky/60 ${
        collapsed ? "justify-center px-0" : "px-2.5"
      } ${isActive ? "bg-white/10 text-white" : "text-blue-100/75 hover:bg-white/[0.06] hover:text-white"}`}
    >
      {/* Barra de estado activo a la izquierda */}
      {isActive && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-nexa-sky" aria-hidden="true" />}
      {icon && (
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center ${
            isActive ? "text-nexa-sky" : "text-blue-200/60 group-hover:text-blue-100"
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      {!collapsed && <span className="truncate">{children}</span>}
    </Link>
  );
}
