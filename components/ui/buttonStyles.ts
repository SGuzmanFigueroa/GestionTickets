export const BUTTON_VARIANT_STYLES = {
  primary: "bg-nexa-blue text-white shadow-sm shadow-nexa-blue/30 hover:bg-nexa-navy",
  dark: "bg-nexa-navy text-white hover:bg-slate-900",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
  "danger-ghost": "text-red-500 hover:underline dark:text-red-400",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT_STYLES;

export const BUTTON_BASE_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70";
