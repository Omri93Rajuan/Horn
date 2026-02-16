import React from "react";

/**
 * AlertLive Component
 * 
 * WCAG 2.1 AA Compliance: 4.1.3 Status Messages & 1.3.1 Info and Relationships
 * Announces dynamic updates to screen readers using ARIA live regions.
 * 
 * Usage:
 * <AlertLive type="alert" message="An important event requires attention" />
 * <AlertLive type="status" message="Data saved successfully" />
 */

type AlertType = "alert" | "status" | "polite";

interface AlertLiveProps {
  /**
   * Type of alert region
   * - "alert": Used for urgent alerts (role="alert", aria-live="assertive")
   * - "status": Used for status messages (aria-live="polite")
   * - "polite": Used for general announcements (aria-live="polite")
   */
  type?: AlertType;
  message: string;
  /**
   * Time in ms to keep the message visible (default: 6000ms)
   */
  duration?: number;
  visible?: boolean;
  onDismiss?: () => void;
}

export const AlertLive: React.FC<AlertLiveProps> = ({
  type = "polite",
  message,
  duration = 6000,
  visible = true,
  onDismiss,
}) => {
  const [show, setShow] = React.useState(visible);

  React.useEffect(() => {
    setShow(visible);
  }, [visible]);

  React.useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      setShow(false);
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [show, duration, onDismiss]);

  if (!show) return null;

  const ariaLiveValue = type === "alert" ? "assertive" : "polite";
  const roleValue = type === "alert" ? "alert" : undefined;

  return (
    <div
      role={roleValue}
      aria-live={ariaLiveValue}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

/**
 * Utility hook for managing live region announcements
 */
export const useAlertLive = () => {
  const [alerts, setAlerts] = React.useState<
    Array<{ id: string; message: string; type: AlertType }>
  >([]);

  const announce = React.useCallback(
    (message: string, type: AlertType = "polite") => {
      const id = Date.now().toString();
      setAlerts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }, 6000);

      return id;
    },
    []
  );

  const dismiss = React.useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { alerts, announce, dismiss };
};

export default AlertLive;
