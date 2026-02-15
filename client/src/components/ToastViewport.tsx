import React from "react";
import { TOAST_EVENT } from "../utils/toast";
import type { ToastPayload, ToastVariant } from "../utils/toast";

type ToastItem = Required<Pick<ToastPayload, "message">> &
  Omit<ToastPayload, "message"> & {
    id: string;
    variant: ToastVariant;
    createdAt: number;
  };

function getVariantClasses(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "border-success/40 bg-success/10 text-success";
    case "error":
      return "border-danger/40 bg-danger/10 text-danger";
    case "warning":
      return "border-warning/40 bg-warning/10 text-warning";
    default:
      return "border-info/40 bg-info/10 text-info";
  }
}

const ToastViewport: React.FC = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const onToast = (event: Event) => {
      const custom = event as CustomEvent<ToastPayload>;
      const detail = custom.detail;
      if (!detail?.message) {
        return;
      }

      const item: ToastItem = {
        id: detail.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message: detail.message,
        title: detail.title,
        variant: detail.variant ?? "info",
        durationMs: detail.durationMs ?? 3800,
        createdAt: Date.now(),
      };

      setToasts((prev) => [item, ...prev].slice(0, 4));

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== item.id));
      }, item.durationMs);
    };

    window.addEventListener(TOAST_EVENT, onToast as EventListener);
    return () => window.removeEventListener(TOAST_EVENT, onToast as EventListener);
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-6 z-[1200] flex w-[min(92vw,560px)] -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-hud backdrop-blur ${getVariantClasses(toast.variant)}`}
          role="status"
          aria-live="polite"
        >
          {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
          <p className="text-sm text-text dark:text-text-dark">{toast.message}</p>
        </div>
      ))}
    </div>
  );
};

export default ToastViewport;
