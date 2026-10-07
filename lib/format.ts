// Nexa's team is based in Lima. Formatting dates without an explicit
// timeZone uses the server's local time (UTC on Netlify), which showed the
// wrong hour to everyone — always pin it to America/Lima instead.
const LIMA_TIME_ZONE = "America/Lima";

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-PE", { timeZone: LIMA_TIME_ZONE });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", { timeZone: LIMA_TIME_ZONE });
}

/** Días completos transcurridos desde una fecha ISO hasta hoy. */
export function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000)));
}

/** "hace 5 min", "hace 2 h", "hace 3 d"; para fechas más viejas, la fecha. */
export function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return formatDate(iso);
}
