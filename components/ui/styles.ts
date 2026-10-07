// Clases base del design system de Nexa Tracker. Usarlas en vez de repetir
// cadenas de Tailwind en cada pantalla, para que todo se vea igual.

/** Input / select / textarea estándar (alto 36px). */
export const INPUT =
  "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 hover:border-slate-400 focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:disabled:bg-slate-800/60";

/** Select compacto para barras de filtros. */
export const FILTER_SELECT =
  "h-8 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none transition-colors hover:border-slate-400 focus:border-nexa-blue focus:ring-2 focus:ring-nexa-blue/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";

/** Etiqueta de campo de formulario. */
export const LABEL = "mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300";

/** Ayuda bajo un campo. */
export const HINT = "mt-1 text-xs text-slate-400 dark:text-slate-500";

/** Superficie con borde (tablas, paneles). Sin sombra pesada. */
export const SURFACE = "rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800";

/** Título de sección dentro de una página (ej. "Descripción", "Actividad"). */
export const SECTION_TITLE = "text-sm font-semibold text-nexa-navy dark:text-white";

/** Etiqueta pequeña en mayúsculas (cabeceras de tabla, metadatos). */
export const EYEBROW = "text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

/** Píldora de filtro (activa/inactiva). */
export function chipClass(active: boolean) {
  return `inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-blue/40 ${
    active
      ? "border-nexa-blue bg-nexa-blue text-white"
      : "border-slate-200 bg-white text-slate-600 hover:border-nexa-blue hover:text-nexa-blue dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
  }`;
}

/** Cabecera de tabla (thead). */
export const TABLE_HEAD =
  "border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400";

/** Celda de cabecera y celda normal. */
export const TH = "whitespace-nowrap px-3 py-2 font-semibold";
export const TD = "px-3 py-2";

/** Fila de tabla con hover sutil. */
export const TABLE_ROW = "transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40";

/** Barra superior de una tabla (búsqueda + conteo). */
export const TABLE_TOOLBAR = "flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700";
