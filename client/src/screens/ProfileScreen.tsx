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
      navigate({ to: "/login" });
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
    <section className="page">
      <header className="page-header">
        <div>
          <h2>פרופיל</h2>
          <p>ניהול פרטים אישיים, התראות ויציאה מהמערכת.</p>
        </div>
      </header>

      <div className="grid two">
        <div className="card">
          <h3>פרטי משתמש</h3>
          <div className="list">
            <div>
              <strong>שם:</strong> {user?.name}
            </div>
            <div>
              <strong>אימייל:</strong> {user?.email}
            </div>
            <div>
              <strong>טלפון:</strong> {user?.phone || "לא הוגדר"}
            </div>
            <div>
              <strong>אזור:</strong> {user?.areaId}
            </div>
          </div>
        </div>
        <div className="card">
          <h3>התראות</h3>
          <p>שליטה בהתראות דפדפן לצורך חווית פיקוד מהירה.</p>
          <div className="command-actions">
            <button type="button" onClick={handleEnableNotifications}>
              {notificationEnabled ? "התראות פעילות" : "אפשר התראות"}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={handleTestNotification}
              disabled={!notificationEnabled}
            >
              שלח התראת בדיקה
            </button>
          </div>
        </div>
      </div>

      <div className="card lift">
        <h3>פעולות</h3>
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          className="danger"
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "מתנתק..." : "התנתק"}
        </button>
      </div>
    </section>
  );
};

export default ProfileScreen;
