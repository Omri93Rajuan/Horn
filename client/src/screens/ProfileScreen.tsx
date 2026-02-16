import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout, setCredentials } from "../store/authSlice";
import notificationService from "../utils/notificationService";
import { disconnectSocket } from "../hooks/useSocket";
import { formatAreaName } from "../utils/dateUtils";
import { toastError, toastSuccess } from "../utils/toast";
import { useI18n } from "../i18n";

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const user = auth.user;
  const { t } = useI18n();
  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted",
  );
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const canSendTestNotification = user?.role === "COMMANDER";
  const hasChanges =
    name.trim() !== (user?.name ?? "") || (phone.trim() || "") !== (user?.phone ?? "");

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
  }, [user?.name, user?.phone]);

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      disconnectSocket();
      dispatch(logout());
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      authService.updateProfile({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    onSuccess: (data) => {
      if (auth.token && user) {
        dispatch(
          setCredentials({
            user: { ...user, ...data.user },
            token: auth.token,
          }),
        );
      }
      toastSuccess(t("profile.updated"));
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || t("profile.update_failed"));
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-text dark:text-text-dark">{t("profile.user_details")}</h3>
              <p className="text-xs text-text-muted dark:text-text-dark-muted">
                {t("profile.edit_hint")}
              </p>
            </div>
            <button
              type="button"
              className="action-btn primary"
              onClick={() => updateProfileMutation.mutate()}
              disabled={!hasChanges || updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? t("profile.saving") : t("profile.save")}
            </button>
          </div>
          <div className="grid gap-3 text-sm text-text-muted dark:text-text-dark-muted">
            <label className="space-y-2">
              <span>{t("profile.name")}</span>
              <input
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("profile.name_placeholder")}
              />
            </label>
            <label className="space-y-2">
              <span>{t("profile.email")}</span>
              <input
                className="input"
                value={user?.email || t("profile.not_available")}
                disabled
              />
            </label>
            <label className="space-y-2">
              <span>{t("profile.phone")}</span>
              <input
                className="input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={t("profile.phone_placeholder")}
              />
            </label>
            <label className="space-y-2">
              <span>{t("profile.area")}</span>
              <input
                className="input"
                value={formatAreaName(user?.areaId || "")}
                disabled
              />
            </label>
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
            {canSendTestNotification && (
              <button
                type="button"
                className="action-btn ghost"
                onClick={handleTestNotification}
                disabled={!notificationEnabled}
              >
                {t("profile.notifications_test")}
              </button>
            )}
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

