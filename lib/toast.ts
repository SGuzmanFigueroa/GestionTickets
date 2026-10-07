// Toasts globales. Desde un componente cliente: toast("Ticket actualizado").
// Las server actions siguen redirigiendo con ?success= / ?error=; el <Toaster>
// convierte esos parámetros en toasts y los quita de la URL.

export type ToastKind = "success" | "error";
export interface ToastDetail {
  message: string;
  kind: ToastKind;
}

export const TOAST_EVENT = "nexa:toast";

export function toast(message: string, kind: ToastKind = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { message, kind } }));
}
