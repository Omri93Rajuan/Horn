import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authService } from "../services/authService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/authSlice";
import notificationService from "../utils/notificationService";
import { disconnectSocket } from "../hooks/useSocket";
import { formatAreaName } from "../utils/dateUtils";
import { toastError } from "../utils/toast";
import { useI18n } from "../i18n";

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { t } = useI18n();
  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted",
  );

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      disconnectSocket();
      dispatch(logout());
      navigate({ to: "/login", search: { redirect: undefined } });
    },
  });

  const handleEnableNotifications = async () => {
    const granted = await notificationService.configure();
    setNotificationEnabled(granted);
    if (!granted) {
      toastError(t("error.enable_notifications"));
    }
  };

  const handleTestNotification = () => {
    notificationService.localNotification("Horn", "זו התראת בדיקה מהמערכת");
  };

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-text dark:text-text-dark">{t("profile.title")}</h2>
        <p className="text-sm text-text-muted dark:text-text-dark-muted">
          {t("profile.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-text dark:text-text-dark">{t("profile.user_details")}</h3>
          <div className="grid gap-3 text-sm text-text-muted dark:text-text-dark-muted">
            <div className="flex items-center justify-between rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 px-4 py-3">
              <span>{t("profile.name")}</span>
              <span className="text-text dark:text-text-dark">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 px-4 py-3">
              <span>{t("profile.email")}</span>
              <span className="text-text dark:text-text-dark">{user?.email || t("profile.not_available")}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 px-4 py-3">
              <span>{t("profile.phone")}</span>
              <span className="text-text dark:text-text-dark">{user?.phone || t("profile.not_set")}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 px-4 py-3">
              <span>{t("profile.area")}</span>
              <span className="text-text dark:text-text-dark">
                {formatAreaName(user?.areaId || "")}
              </span>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-text dark:text-text-dark">{t("profile.notifications")}</h3>
          <p className="text-sm text-text-muted dark:text-text-dark-muted">
            {t("profile.notifications_hint")}
          </p>
          <div className="flex flex-col gap-3">
            <button type="button" onClick={handleEnableNotifications} className="action-btn primary">
              {notificationEnabled ? t("profile.notifications_enabled") : t("profile.notifications_enable")}
            </button>
            <button
              type="button"
              className="action-btn ghost"
              onClick={handleTestNotification}
              disabled={!notificationEnabled}
            >
              {t("profile.notifications_test")}
            </button>
          </div>
        </div>
      </div>

      <div className="card flex flex-col items-start gap-3">
        <h3 className="text-lg font-semibold text-text dark:text-text-dark">{t("profile.actions")}</h3>
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          className="action-btn danger"
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? t("profile.logging_out") : t("profile.logout")}
        </button>
      </div>
    </section>
  );
};

export default ProfileScreen;

