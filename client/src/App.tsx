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
  const [settingsOpen, setSettingsOpen] = React.useState(false);
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
          className="sticky top-0 z-20 border-b border-border/70 bg-surface-1/95 backdrop-blur-xl dark:border-border-dark dark:bg-surface-1-dark/95"
          role="banner"
          aria-label={t("nav.main_navigation")}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt={t("nav.logo_home")} className="h-16 w-auto" />
              <div>
                <h1 className="font-display text-lg text-text dark:text-text-dark">{t("app.title")}</h1>
              </div>
            </div>

            {auth.token ? (
              <nav
                className="flex items-center gap-4 text-sm font-medium text-text-muted dark:text-text-dark-muted"
                role="navigation"
                aria-label={t("nav.main_navigation")}
              >
                {auth.user?.role === "COMMANDER" ? (
                  <>
                    <button
                      type="button"
                      className="hover:text-primary"
                      onClick={() => setCurrentPage("commander")}
                      title={t("nav.command_center")}
                      aria-current={currentPage === "commander" ? "page" : undefined}
                    >
                      {t("nav.command_center")}
                    </button>
                    <button
                      type="button"
                      className="hover:text-primary"
                      onClick={() => setCurrentPage("alerts")}
                      title={t("nav.alerts_history")}
                      aria-current={currentPage === "alerts" ? "page" : undefined}
                    >
                      {t("nav.alerts_history")}
                    </button>
                    <button
                      type="button"
                      className="hover:text-primary"
                      onClick={() => setCurrentPage("team")}
                      title={t("nav.team")}
                      aria-current={currentPage === "team" ? "page" : undefined}
                    >
                      {t("nav.team")}
                    </button>
                    {clientEnv.isTestMode ? (
                      <button
                        type="button"
                        className="hover:text-primary"
                        onClick={() => setCurrentPage("demo-split")}
                        title={t("demo.nav")}
                        aria-current={currentPage === "demo-split" ? "page" : undefined}
                      >
                        {t("demo.nav")}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="hover:text-primary"
                      onClick={() => setCurrentPage("soldier")}
                      title={t("nav.my_dashboard")}
                      aria-current={currentPage === "soldier" ? "page" : undefined}
                    >
                      {t("nav.my_dashboard")}
                    </button>
                    <button
                      type="button"
                      className="hover:text-primary"
                      onClick={() => setCurrentPage("responses")}
                      title={t("nav.my_responses")}
                      aria-current={currentPage === "responses" ? "page" : undefined}
                    >
                      {t("nav.my_responses")}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="hover:text-primary"
                  onClick={() => setCurrentPage("profile")}
                  title={t("nav.profile")}
                  aria-current={currentPage === "profile" ? "page" : undefined}
                >
                  {t("nav.profile")}
                </button>
              </nav>
            ) : null}

            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-border/70 bg-surface-1/90 px-3 py-2 text-xs font-semibold text-text-muted shadow-[0_10px_30px_-18px_rgba(15,23,42,0.5)] transition hover:text-text dark:border-border-dark/70 dark:bg-surface-1-dark/90 dark:text-text-dark-muted"
                aria-expanded={settingsOpen}
                aria-controls="app-settings-menu"
                aria-label={t("nav.settings")}
              >
                <span aria-hidden="true">⚙️</span>
                <span>{t("nav.settings")}</span>
              </button>

              {settingsOpen ? (
                <div
                  id="app-settings-menu"
                  role="menu"
                  className="absolute right-0 mt-2 w-48 rounded-2xl border border-border/70 bg-surface-1/95 p-3 shadow-xl backdrop-blur-sm dark:border-border-dark/70 dark:bg-surface-1-dark/95"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setTheme(theme === "dark" ? "light" : "dark");
                      setSettingsOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-text hover:bg-surface-2 dark:text-text-dark dark:hover:bg-surface-2-dark"
                  >
                    <span>{theme === "dark" ? t("theme.light") : t("theme.dark")}</span>
                    <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
                  </button>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setLocale("he");
                        setSettingsOpen(false);
                      }}
                      className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                        locale === "he"
                          ? "border-primary/90 bg-primary text-primary-contrast"
                          : "border-border/70 bg-transparent text-text-muted hover:border-border hover:text-text dark:border-border-dark/70 dark:text-text-dark-muted dark:hover:border-border-dark dark:hover:text-text-dark"
                      }`}
                    >
                      {t("lang.he")}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setLocale("en");
                        setSettingsOpen(false);
                      }}
                      className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                        locale === "en"
                          ? "border-primary/90 bg-primary text-primary-contrast"
                          : "border-border/70 bg-transparent text-text-muted hover:border-border hover:text-text dark:border-border-dark/70 dark:text-text-dark-muted dark:hover:border-border-dark dark:hover:text-text-dark"
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {auth.token ? (
              <button
                type="button"
                onClick={() => {
                  disconnectSocket();
                  dispatch(logout());
                  setCurrentPage(getDefaultUnauthedPage());
                }}
                className="text-xs font-semibold tracking-[0.12em] uppercase text-error"
                aria-label={t("auth.logout")}
              >
                {t("auth.logout")}
              </button>
            ) : null}
          </div>
        </header>

        <main id="main-content" className="mx-auto max-w-6xl px-6 py-10" role="main">
          {renderContent}
        </main>

        {auth.token && <GlobalSocketManager />}
        <AccessibilityBar />
        <ToastViewport />
      </div>
    </ErrorBoundary>
  );
};
