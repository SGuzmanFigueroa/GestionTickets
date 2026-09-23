type IconProps = { className?: string };

const base = "shrink-0";

export function TicketIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} width="16" height="16">
      <path
        d="M3 8a2 2 0 100-4H3a1 1 0 00-1 1v2a1 1 0 001 1 1 1 0 010 2 1 1 0 00-1 1v2a1 1 0 001 1h14a1 1 0 001-1v-2a1 1 0 00-1-1 1 1 0 010-2 1 1 0 001-1V5a1 1 0 00-1-1H3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9 4v12" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2" />
    </svg>
  );
}

export function PlusIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} width="16" height="16">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ClipboardCheckIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} width="16" height="16">
      <rect x="4" y="3.5" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 3.5h5v1.5h-5z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 10.5l1.8 1.8L13 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FolderIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} width="16" height="16">
      <path
        d="M3 6a1 1 0 011-1h4l1.5 2H16a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1V6z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UsersIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} width="16" height="16">
      <circle cx="7.5" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 16c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="14" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M12.8 12.2c1.9.3 3.7 1.4 3.7 3.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} width="15" height="15">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M17 17l-3.8-3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function DotsHorizontalIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={`${base} ${className}`} width="16" height="16">
      <circle cx="4" cy="10" r="1.4" />
      <circle cx="10" cy="10" r="1.4" />
      <circle cx="16" cy="10" r="1.4" />
    </svg>
  );
}

export function XIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} width="16" height="16">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ProgressIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} width="16" height="16">
      <path d="M3.5 10.5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 13.5h5.5M13 9.5h3.5M14.5 5.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
