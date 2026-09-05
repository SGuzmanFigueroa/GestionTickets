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
