import React from "react";
import { RouterProvider } from "@tanstack/react-router";
import { useDispatch, useSelector } from "react-redux";
import { router } from "./router";
import type { RootState } from "./store";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalSocketManager from "./components/GlobalSocketManager";
import ToastViewport from "./components/ToastViewport";
import { initNetworkMonitoring } from "./utils/networkService";
import { logout } from "./store/authSlice";
import { disconnectSocket } from "./hooks/useSocket";
import AccessibilityBar from "./components/AccessibilityBar";
import { a11yAuditor } from "./utils/accessibilityAuditor";

export const App: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const isTokenExpired = React.useCallback((token: string) => {
    try {
      const payloadBase64 = token.split(".")[1];
      if (!payloadBase64) return true;
      const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(payloadJson) as { exp?: number };
      if (!payload.exp) return true;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }, []);

  React.useEffect(() => {
    initNetworkMonitoring();
    
    // Initialize accessibility auditor in dev mode
    if (import.meta.env.DEV) {
      // Run initial audit on mount
      const issues = a11yAuditor.audit();
      if (issues.length > 0) {
        a11yAuditor.printResults(issues);
      }
    }
  }, []);

  React.useEffect(() => {
    if (!auth.token) return;

    if (isTokenExpired(auth.token)) {
      disconnectSocket();
      dispatch(logout());
      sessionStorage.setItem("horn_auth_expired", "1");

      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
  }, [auth.token, dispatch, isTokenExpired]);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} context={{ auth }} />
      {auth.token && <GlobalSocketManager />}
      <AccessibilityBar />
      <ToastViewport />
    </ErrorBoundary>
  );
};
