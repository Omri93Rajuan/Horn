import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import type { RootState } from "./store";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalSocketManager from "./components/GlobalSocketManager";
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
      if (currentPage !== "login" && currentPage !== "register" && currentPage !== "investor-demo" && currentPage !== "demo-split") {
        setCurrentPage(getDefaultUnauthedPage());
      }
      return;
    }

    const role = auth.user?.role;

    if (currentPage === "login" || currentPage === "register") {
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
      if (currentPage === "commander" || currentPage === "team" || currentPage === "alerts") {
        setCurrentPage("soldier");
      }
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
            onNavigateDemo={() => setCurrentPage("investor-demo")}
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
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            {/* Brand */}
            <button
              type="button"
              onClick={goHome}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0"
              aria-label={t("nav.logo_home")}
            >
              <img src={logoUrl} alt="" className="h-16 sm:h-20 w-auto app-brand-logo" aria-hidden="true" />
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-text dark:text-text-dark">Horn</span>
                <span className="text-xs text-text-muted dark:text-text-dark-muted">Emergency Network</span>
              </div>
            </button>

            {/* Center Navigation - Desktop */}
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
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
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
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
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
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                        currentPage === "team"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark"
                      }`}
                      onClick={() => setCurrentPage("team")}
                      aria-current={currentPage === "team" ? "page" : undefined}
                    >
                      {t("nav.team")}
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                        currentPage === "demo-split"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark"
                      }`}
                      onClick={() => setCurrentPage("demo-split")}
                      aria-current={currentPage === "demo-split" ? "page" : undefined}
                    >
                      {t("demo.nav")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
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
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
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
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage("investor-demo");
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-primary text-primary-contrast hover:bg-primary-hover transition"
                aria-current={currentPage === "investor-demo" ? "page" : undefined}
              >
                {t("demo.nav")}
              </button>

              {/* Mobile Menu Toggle */}
              {auth.token && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden p-2 rounded-lg transition hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                  aria-label={mobileMenuOpen ? t("nav.close_menu") || "סגור תפריט" : t("nav.open_menu") || "פתח תפריט"}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <svg className="w-5 h-5 text-text dark:text-text-dark" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2.5 rounded-lg transition hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                aria-label={theme === "dark" ? t("theme.light") : t("theme.dark")}
                aria-pressed={theme === "dark"}
                title={theme === "dark" ? t("theme.light") : t("theme.dark")}
              >
                {theme === "dark" ? (
                  <svg className="w-6 h-6 text-text dark:text-text-dark transition-transform hover:rotate-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-text dark:text-text-dark transition-transform hover:rotate-12" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              {!auth.token && (
                <div className="hidden sm:flex items-center gap-1 border-r border-text/10 pr-3 dark:border-text-dark/10">
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
              )}

              {/* Logout Button - Desktop Only */}
              {auth.token && (
                <button
                  type="button"
                  onClick={() => {
                    disconnectSocket();
                    dispatch(logout());
                    setCurrentPage(getDefaultUnauthedPage());
                  }}
                  className="hidden sm:inline-flex px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 dark:hover:bg-error/20 rounded-lg transition"
                  aria-label={t("auth.logout")}
                >
                  {t("auth.logout")}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {auth.token && mobileMenuOpen && (
            <nav
              id="mobile-menu"
              className="sm:hidden border-t border-text/10 dark:border-text-dark/10 bg-surface-1 dark:bg-surface-1-dark overflow-y-auto max-h-[70vh]"
              role="navigation"
            >
              <div className="px-4 py-3 space-y-2">
                {auth.user?.role === "COMMANDER" ? (
                  <>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-3 text-sm rounded-lg transition ${
                        currentPage === "commander"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text dark:text-text-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                      }`}
                      onClick={() => {
                        setCurrentPage("commander");
                        setMobileMenuOpen(false);
                      }}
                      aria-current={currentPage === "commander" ? "page" : undefined}
                    >
                      {t("nav.command_center")}
                    </button>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-3 text-sm rounded-lg transition ${
                        currentPage === "alerts"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text dark:text-text-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                      }`}
                      onClick={() => {
                        setCurrentPage("alerts");
                        setMobileMenuOpen(false);
                      }}
                      aria-current={currentPage === "alerts" ? "page" : undefined}
                    >
                      {t("nav.alerts_history")}
                    </button>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-3 text-sm rounded-lg transition ${
                        currentPage === "team"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text dark:text-text-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                      }`}
                      onClick={() => {
                        setCurrentPage("team");
                        setMobileMenuOpen(false);
                      }}
                      aria-current={currentPage === "team" ? "page" : undefined}
                    >
                      {t("nav.team")}
                    </button>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-3 text-sm rounded-lg transition ${
                        currentPage === "demo-split"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text dark:text-text-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                      }`}
                      onClick={() => {
                        setCurrentPage("demo-split");
                        setMobileMenuOpen(false);
                      }}
                      aria-current={currentPage === "demo-split" ? "page" : undefined}
                    >
                      {t("demo.nav")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-3 text-sm rounded-lg transition ${
                        currentPage === "soldier"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text dark:text-text-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                      }`}
                      onClick={() => {
                        setCurrentPage("soldier");
                        setMobileMenuOpen(false);
                      }}
                      aria-current={currentPage === "soldier" ? "page" : undefined}
                    >
                      {t("nav.my_dashboard")}
                    </button>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-3 text-sm rounded-lg transition ${
                        currentPage === "responses"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-text dark:text-text-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                      }`}
                      onClick={() => {
                        setCurrentPage("responses");
                        setMobileMenuOpen(false);
                      }}
                      aria-current={currentPage === "responses" ? "page" : undefined}
                    >
                      {t("nav.my_responses")}
                    </button>
                  </>
                )}

                {/* Mobile divider */}
                <div className="my-2 h-px bg-text/10 dark:bg-text-dark/10" />

                {/* Profile button */}
                <button
                  type="button"
                  className={`w-full text-left px-3 py-3 text-sm rounded-lg transition ${
                    currentPage === "profile"
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-text dark:text-text-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark"
                  }`}
                  onClick={() => {
                    setCurrentPage("profile");
                    setMobileMenuOpen(false);
                  }}
                  aria-current={currentPage === "profile" ? "page" : undefined}
                >
                  {t("nav.profile")}
                </button>

                {/* Language Switcher */}
                <div className="space-y-2 mt-2">
                  <div className="text-xs font-semibold text-text-muted dark:text-text-dark-muted px-3 py-2">
                    {t("nav.language") || "שפה"}
                  </div>
                  <div className="flex gap-2 px-3">
                    <button
                      type="button"
                      onClick={() => {
                        setLocale("en");
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 px-2 py-2 text-xs font-semibold rounded transition ${
                        locale === "en"
                          ? "bg-primary text-primary-contrast"
                          : "bg-surface-2 dark:bg-surface-2-dark text-text dark:text-text-dark hover:bg-surface-3 dark:hover:bg-surface-3-dark"
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLocale("he");
                        setMobileMenuOpen(false);
                      }}
                      className={`flex-1 px-2 py-2 text-xs font-semibold rounded transition ${
                        locale === "he"
                          ? "bg-primary text-primary-contrast"
                          : "bg-surface-2 dark:bg-surface-2-dark text-text dark:text-text-dark hover:bg-surface-3 dark:hover:bg-surface-3-dark"
                      }`}
                    >
                      עברית
                    </button>
                  </div>
                </div>

                {/* Logout Button - Mobile */}
                <button
                  type="button"
                  onClick={() => {
                    disconnectSocket();
                    dispatch(logout());
                    setCurrentPage(getDefaultUnauthedPage());
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-3 text-sm font-semibold text-error hover:bg-error/10 rounded-lg transition mt-2"
                  aria-label={t("auth.logout")}
                >
                  {t("auth.logout")}
                </button>
              </div>
            </nav>
          )}
        </header>

        <main id="main-content" className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10" role="main">
          {renderContent}
        </main>

        {auth.token && <GlobalSocketManager />}
        <AccessibilityBar />
        <ToastContainer
          position="bottom-left"
          autoClose={3800}
          newestOnTop
          rtl
          theme={theme === "dark" ? "dark" : "light"}
          closeOnClick
          pauseOnHover
        />
      </div>
    </ErrorBoundary>
  );
};
