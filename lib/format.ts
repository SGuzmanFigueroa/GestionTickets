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
