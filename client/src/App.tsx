import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "./store";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalSocketManager from "./components/GlobalSocketManager";
import ToastViewport from "./components/ToastViewport";
import SkipLink from "./components/SkipLink";
import AccessibilityBar from "./components/AccessibilityBar";
import { initNetworkMonitoring } from "./utils/networkService";
import { logout } from "./store/authSlice";
import { disconnectSocket } from "./hooks/useSocket";
import { a11yAuditor } from "./utils/accessibilityAuditor";
import { useI18n } from "./i18n";

import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import CommandCenter from "./screens/CommandCenter";
import SoldierDashboard from "./screens/SoldierDashboard";
import AlertsHistoryScreen from "./screens/AlertsHistoryScreen";
import TeamScreen from "./screens/TeamScreen";
import ResponsesScreen from "./screens/ResponsesScreen";
import ProfileScreen from "./screens/ProfileScreen";
import NotFoundScreen from "./screens/NotFoundScreen";
import InvestorDemoScreen from "./screens/InvestorDemoScreen";
import SplitDemoScreen from "./screens/SplitDemoScreen";
import logoUrl from "./assets/mainlogo.webp";
import { clientEnv } from "./config/env";

type PageName =
  | "login"
  | "register"
  | "investor-demo"
  | "soldier"
  | "commander"
  | "team"
  | "alerts"
  | "responses"
  | "profile"
  | "demo-split"
  | "not-found";

const getDefaultUnauthedPage = (): PageName => (clientEnv.isTestMode ? "investor-demo" : "login");

export const App: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const { t, locale, setLocale } = useI18n();
  const [currentPage, setCurrentPage] = React.useState<PageName>(() => getDefaultUnauthedPage());
  const [theme, setTheme] = React.useState<"dark" | "light">(() => {
    const stored = localStorage.getItem("horn-theme");
    return stored === "light" ? "light" : "dark";
  });

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

  const routePage = React.useCallback(() => {
    if (auth.token && isTokenExpired(auth.token)) {
      disconnectSocket();
      dispatch(logout());
      sessionStorage.setItem("horn_auth_expired", "1");
      setCurrentPage(getDefaultUnauthedPage());
      return;
    }

    if (!auth.token) {
      if (currentPage !== "login" && currentPage !== "register" && currentPage !== "investor-demo") {
        setCurrentPage(getDefaultUnauthedPage());
      }
      return;
    }

    const role = auth.user?.role;

    if (currentPage === "login" || currentPage === "register" || currentPage === "investor-demo") {
      if (role === "COMMANDER") {
        setCurrentPage("commander");
      } else {
        setCurrentPage("soldier");
      }
      return;
    }

    if (role === "COMMANDER") {
      if (currentPage === "soldier" || currentPage === "responses") {
        setCurrentPage("commander");
      }
    } else {
      if (currentPage === "commander" || currentPage === "team" || currentPage === "alerts" || currentPage === "demo-split") {
        setCurrentPage("soldier");
      }
    }

    if (!clientEnv.isTestMode && currentPage === "demo-split") {
      setCurrentPage(role === "COMMANDER" ? "commander" : "soldier");
    }
  }, [auth, currentPage, dispatch, isTokenExpired]);

  React.useEffect(() => {
    initNetworkMonitoring();

    if (import.meta.env.DEV) {
      const issues = a11yAuditor.audit();
      if (issues.length > 0) {
        a11yAuditor.printResults(issues);
      }
    }
  }, []);

  React.useEffect(() => {
    routePage();
  }, [auth.token, auth.user?.role, currentPage, routePage]);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("horn-theme", theme);
  }, [theme]);

  const goHome = React.useCallback(() => {
    if (auth.user?.role === "COMMANDER") {
      setCurrentPage("commander");
    } else {
      setCurrentPage("soldier");
    }
  }, [auth.user?.role]);

  const renderContent = useMemo(() => {
    switch (currentPage) {
      case "login":
        return (
          <LoginScreen
            onNavigateRegister={() => setCurrentPage("register")}
            onNavigateDemo={clientEnv.isTestMode ? () => setCurrentPage("investor-demo") : undefined}
          />
        );
      case "register":
        return <RegisterScreen onNavigateLogin={() => setCurrentPage("login")} />;
      case "investor-demo":
        return <InvestorDemoScreen onStartDemo={() => setCurrentPage("demo-split")} />;
      case "soldier":
        return <SoldierDashboard />;
      case "commander":
        return <CommandCenter />;
      case "team":
        return <TeamScreen />;
      case "alerts":
        return <AlertsHistoryScreen />;
      case "responses":
        return <ResponsesScreen />;
      case "profile":
        return <ProfileScreen />;
      case "demo-split":
        return <SplitDemoScreen />;
      default:
        return (
          <NotFoundScreen
            onNavigate={(page) => setCurrentPage(page)}
            onNavigateHome={goHome}
          />
        );
    }
  }, [currentPage, goHome]);

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen overflow-hidden">
        <SkipLink targetId="main-content" />
        <header
          className="sticky top-0 z-20 border-b border-text/10 bg-surface-1/98 backdrop-blur-sm dark:border-text-dark/10 dark:bg-surface-1-dark/98"
          role="banner"
          aria-label={t("nav.main_navigation")}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
            {/* Logo */}
            <button
              type="button"
              onClick={goHome}
              className="flex items-center hover:opacity-75 transition-opacity"
              aria-label={t("nav.logo_home")}
            >
              <img src={logoUrl} alt="" className="h-10 w-auto sm:h-12" aria-hidden="true" />
            </button>

            {/* Center Navigation */}
            {auth.token && (
              <nav
                className="hidden sm:flex items-center gap-1"
                role="navigation"
                aria-label={t("nav.main_navigation")}
              >
                {auth.user?.role === "COMMANDER" ? (
                  <>
                    <button
                      type="button"
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        currentPage === "commander"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark"
                      }`}
                      onClick={() => setCurrentPage("commander")}
                      aria-current={currentPage === "commander" ? "page" : undefined}
                    >
                      {t("nav.command_center")}
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        currentPage === "alerts"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark"
                      }`}
                      onClick={() => setCurrentPage("alerts")}
                      aria-current={currentPage === "alerts" ? "page" : undefined}
                    >
                      {t("nav.alerts_history")}
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        currentPage === "team"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark"
                      }`}
                      onClick={() => setCurrentPage("team")}
                      aria-current={currentPage === "team" ? "page" : undefined}
                    >
                      {t("nav.team")}
                    </button>
                    {clientEnv.isTestMode && (
                      <button
                        type="button"
                        className={`px-3 py-2 text-sm rounded-lg transition ${
                          currentPage === "demo-split"
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark"
                        }`}
                        onClick={() => setCurrentPage("demo-split")}
                        aria-current={currentPage === "demo-split" ? "page" : undefined}
                      >
                        {t("demo.nav")}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        currentPage === "soldier"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark"
                      }`}
                      onClick={() => setCurrentPage("soldier")}
                      aria-current={currentPage === "soldier" ? "page" : undefined}
                    >
                      {t("nav.my_dashboard")}
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        currentPage === "responses"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark"
                      }`}
                      onClick={() => setCurrentPage("responses")}
                      aria-current={currentPage === "responses" ? "page" : undefined}
                    >
                      {t("nav.my_responses")}
                    </button>
                  </>
                )}
              </nav>
            )}

            {/* Right Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              {auth.token && (
                <button
                  type="button"
                  className="hidden sm:inline-flex px-3 py-2 text-sm text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark rounded-lg transition"
                  onClick={() => setCurrentPage("profile")}
                  aria-current={currentPage === "profile" ? "page" : undefined}
                >
                  {t("nav.profile")}
                </button>
              )}

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg transition hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                aria-label={theme === "dark" ? t("theme.light") : t("theme.dark")}
                aria-pressed={theme === "dark"}
              >
                {theme === "dark" ? (
                  <svg className="w-5 h-5 text-text dark:text-text-dark" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-text dark:text-text-dark" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm5.657-9.193a1 1 0 00-1.414 0l-.707.707A1 1 0 005.05 6.464l.707-.707a1 1 0 011.414 0zM5 17a1 1 0 100-2H4a1 1 0 100 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Language - Vertical Divider + Switcher */}
              <div className="flex items-center gap-1 border-l border-text/10 pl-3 dark:border-text-dark/10">
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  className={`px-2 py-1 text-xs font-semibold rounded transition ${
                    locale === "en"
                      ? "bg-primary text-primary-contrast"
                      : "text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("he")}
                  className={`px-2 py-1 text-xs font-semibold rounded transition ${
                    locale === "he"
                      ? "bg-primary text-primary-contrast"
                      : "text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark"
                  }`}
                >
                  עברית
                </button>
              </div>

              {/* Logout Button */}
              {auth.token && (
                <button
                  type="button"
                  onClick={() => {
                    disconnectSocket();
                    dispatch(logout());
                    setCurrentPage(getDefaultUnauthedPage());
                  }}
                  className="px-3 py-2 text-xs sm:text-sm font-semibold text-error hover:bg-error/10 rounded-lg transition"
                  aria-label={t("auth.logout")}
                >
                  {t("auth.logout")}
                </button>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10" role="main">
          {renderContent}
        </main>

        {auth.token && <GlobalSocketManager />}
        <AccessibilityBar />
        <ToastViewport />
      </div>
    </ErrorBoundary>
  );
};
