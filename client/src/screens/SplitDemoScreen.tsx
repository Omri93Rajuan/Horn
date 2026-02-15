import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import CommandCenter from "./CommandCenter";
import SoldierDashboard from "./SoldierDashboard";
import { useSocket } from "../hooks/useSocket";
import { useAppSelector } from "../store/hooks";
import { useI18n } from "../i18n";

type LayoutMode = "stacked" | "side-by-side";

const LAYOUT_STORAGE_KEY = "horn-demo-layout";

function getInitialLayout(): LayoutMode {
  const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
  return saved === "side-by-side" ? "side-by-side" : "stacked";
}

const SplitDemoScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const user = useAppSelector((state) => state.auth.user);
  const [layout, setLayout] = React.useState<LayoutMode>(getInitialLayout);
  const [isLive, setIsLive] = React.useState(false);
  const { t } = useI18n();

  const soldierAreaId =
    user?.areaId || (user?.commanderAreas && user.commanderAreas.length > 0 ? user.commanderAreas[0] : "");

  React.useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
  }, [layout]);

  React.useEffect(() => {
    if (!socket || !soldierAreaId) return;

    const onConnect = () => {
      setIsLive(true);
      socket.emit("join-area-room", soldierAreaId);
    };

    const onDisconnect = () => {
      setIsLive(false);
    };

    const onNewAlert = () => {
      queryClient.invalidateQueries({ queryKey: ["soldier-events", soldierAreaId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    };

    const onResponseUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["soldier-events", soldierAreaId] });
      queryClient.invalidateQueries({ queryKey: ["my-responses"] });
      queryClient.invalidateQueries({ queryKey: ["responses"] });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new-alert", onNewAlert);
    socket.on("response-update", onResponseUpdate);

    if (socket.connected) onConnect();
    else setIsLive(false);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new-alert", onNewAlert);
      socket.off("response-update", onResponseUpdate);
      socket.emit("leave-area-room", soldierAreaId);
    };
  }, [queryClient, socket, soldierAreaId]);

  return (
    <section className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text dark:text-text-dark">{t("demo.live_split_title")}</h2>
            <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">{t("demo.live_split_subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isLive ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
              }`}
            >
              {isLive ? t("demo.socket_live") : t("demo.socket_reconnecting")}
            </span>
            <button
              type="button"
              onClick={() => setLayout("stacked")}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                layout === "stacked"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-text-muted dark:border-border-dark dark:text-text-dark-muted"
              }`}
            >
              {t("demo.layout_stacked")}
            </button>
            <button
              type="button"
              onClick={() => setLayout("side-by-side")}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                layout === "side-by-side"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-text-muted dark:border-border-dark dark:text-text-dark-muted"
              }`}
            >
              {t("demo.layout_side_by_side")}
            </button>
          </div>
        </div>
      </div>

      <div className={layout === "side-by-side" ? "grid gap-4 xl:grid-cols-2" : "space-y-4"}>
        <div className="overflow-hidden rounded-2xl border border-border dark:border-border-dark">
          <div className="border-b border-border bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-text-muted dark:border-border-dark dark:bg-surface-2-dark dark:text-text-dark-muted">
            {t("demo.commander_panel")}
          </div>
          <div className={layout === "side-by-side" ? "h-[78vh] overflow-auto" : "max-h-[46vh] overflow-auto"}>
            <CommandCenter />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border dark:border-border-dark">
          <div className="border-b border-border bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-text-muted dark:border-border-dark dark:bg-surface-2-dark dark:text-text-dark-muted">
            {t("demo.soldier_panel")}
          </div>
          <div className={layout === "side-by-side" ? "h-[78vh] overflow-auto" : "max-h-[46vh] overflow-auto"}>
            <SoldierDashboard />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SplitDemoScreen;

