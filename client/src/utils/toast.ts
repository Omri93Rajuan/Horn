import { tStatic } from "../i18n";

export type ToastVariant = "success" | "error" | "info" | "warning";

export type ToastPayload = {
  id?: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

const TOAST_EVENT = "horn:toast";

function emitToast(payload: ToastPayload) {
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
}

export function showToast(payload: ToastPayload) {
  emitToast(payload);
}

export function toastSuccess(message: string, title = tStatic("toast.success")) {
  emitToast({ message, title, variant: "success" });
}

export function toastError(message: string, title = tStatic("toast.error")) {
  emitToast({ message, title, variant: "error" });
}

export function toastInfo(message: string, title = tStatic("toast.info")) {
  emitToast({ message, title, variant: "info" });
}

export function toastWarning(message: string, title = tStatic("toast.warning")) {
  emitToast({ message, title, variant: "warning" });
}

export { TOAST_EVENT };
