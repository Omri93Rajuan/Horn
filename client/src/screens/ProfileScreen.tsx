import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authService } from "../services/authService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/authSlice";
import notificationService from "../utils/notificationService";

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted",
  );

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      dispatch(logout());
      navigate({ to: "/login", search: { redirect: undefined } });
    },
  });

  const handleEnableNotifications = async () => {
    const granted = await notificationService.configure();
    setNotificationEnabled(granted);
    if (!granted) {
      alert("לא ניתן לאפשר התראות בדפדפן זה.");
    }
  };

  const handleTestNotification = () => {
    notificationService.localNotification(
      "Horn",
      "זו התראת בדיקה מהמערכת",
    );
  };

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-text dark:text-text-dark">פרופיל</h2>
        <p className="text-sm text-text-muted dark:text-text-dark-muted">ניהול פרטים, התראות ויציאה מהמערכת.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-text dark:text-text-dark">פרטי משתמש</h3>
          <div className="grid gap-3 text-sm text-text-muted dark:text-text-dark-muted">
            <div className="flex items-center justify-between rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 px-4 py-3">
              <span>שם</span>
              <span className="text-text dark:text-text-dark">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 px-4 py-3">
              <span>אימייל</span>
              <span className="text-text dark:text-text-dark">{user?.email || "לא זמין"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 px-4 py-3">
              <span>טלפון</span>
              <span className="text-text dark:text-text-dark">{user?.phone || "לא הוגדר"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 px-4 py-3">
              <span>אזור</span>
              <span className="text-text dark:text-text-dark">{user?.areaId}</span>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-text dark:text-text-dark">התראות</h3>
          <p className="text-sm text-text-muted dark:text-text-dark-muted">אפשר התראות כדי לקבל עדכון מיידי בזמן אירוע.</p>
          <div className="flex flex-col gap-3">
            <button type="button" onClick={handleEnableNotifications} className="action-btn primary">
              {notificationEnabled ? "התראות פעילות" : "אפשר התראות"}
            </button>
            <button
              type="button"
              className="action-btn ghost"
              onClick={handleTestNotification}
              disabled={!notificationEnabled}
            >
              שלח התראת בדיקה
            </button>
          </div>
        </div>
      </div>

      <div className="card flex flex-col items-start gap-3">
        <h3 className="text-lg font-semibold text-text dark:text-text-dark">פעולות</h3>
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          className="action-btn danger"
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "מתנתק..." : "התנתק"}
        </button>
      </div>
    </section>
  );
};

export default ProfileScreen;
