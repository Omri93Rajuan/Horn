import { tStatic } from "../i18n";
import { toast } from "react-toastify";

export type ToastVariant = "success" | "error" | "info" | "warning";

export type ToastPayload = {
  id?: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

function formatMessage(payload: ToastPayload) {
  if (!payload.title) {
    return payload.message;
  }

  return `${payload.title}: ${payload.message}`;
}

export function showToast(payload: ToastPayload) {
  toast(formatMessage(payload), {
    type: payload.variant ?? "info",
    toastId: payload.id,
    autoClose: payload.durationMs ?? 3800,
  });
}

export function toastSuccess(message: string, title = tStatic("toast.success")) {
  showToast({ message, title, variant: "success" });
}

export function toastError(message: string, title = tStatic("toast.error")) {
  showToast({ message, title, variant: "error" });
}

export function toastInfo(message: string, title = tStatic("toast.info")) {
  showToast({ message, title, variant: "info" });
}

export function toastWarning(message: string, title = tStatic("toast.warning")) {
  showToast({ message, title, variant: "warning" });
}
