import { useEffect, useState } from "react";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import SkipLink from "./components/SkipLink";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import CommandCenter from "./screens/CommandCenter";
import SoldierDashboard from "./screens/SoldierDashboard";
import AlertsHistoryScreen from "./screens/AlertsHistoryScreen";
import TeamScreen from "./screens/TeamScreen";
import ResponsesScreen from "./screens/ResponsesScreen";
import ProfileScreen from "./screens/ProfileScreen";
import NotFoundScreen from "./screens/NotFoundScreen";
import type { RootState } from "./store";
import { useAppSelector } from "./store/hooks";
import logoUrl from "./assets/mainlogo.webp";
import { useI18n } from "./i18n";
import { clientEnv } from "./config/env";
import InvestorDemoScreen from "./screens/InvestorDemoScreen";
import SplitDemoScreen from "./screens/SplitDemoScreen";

type RouterContext = {
  auth: RootState["auth"];
};

const RootLayout = () => {
  const auth = useAppSelector((state) => state.auth);
  const { locale, setLocale, t } = useI18n();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const stored = localStorage.getItem("horn-theme");
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("horn-theme", theme);
  }, [theme]);

  return (
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
                  <Link className="hover:text-primary" to="/commander" title={t("nav.command_center")}>{t("nav.command_center")}</Link>
                  <Link className="hover:text-primary" to="/alerts" title={t("nav.alerts_history")}>{t("nav.alerts_history")}</Link>
                  <Link className="hover:text-primary" to="/team" title={t("nav.team")}>{t("nav.team")}</Link>
                  {clientEnv.isTestMode ? (
                    <Link className="hover:text-primary" to="/demo-split" title={t("demo.nav")}>{t("demo.nav")}</Link>
                  ) : null}
                </>
              ) : (
                <>
                  <Link className="hover:text-primary" to="/soldier" title={t("nav.my_dashboard")}>{t("nav.my_dashboard")}</Link>
                  <Link className="hover:text-primary" to="/responses" title={t("nav.my_responses")}>{t("nav.my_responses")}</Link>
                </>
              )}
              <Link className="hover:text-primary" to="/profile" title={t("nav.profile")}>{t("nav.profile")}</Link>
            </nav>
          ) : null}

          <div 
            className="flex items-center gap-2 rounded-2xl border border-border/80 bg-surface-1/95 px-2 py-1.5 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.5)] backdrop-blur-sm dark:border-border-dark/80 dark:bg-surface-1-dark/95"
            role="group"
            aria-label={t("nav.settings")}
          >
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? t("theme.light") : t("theme.dark")}
              aria-pressed={theme === "dark"}
              title={theme === "dark" ? t("theme.light") : t("theme.dark")}
              className="group relative flex h-8 w-[62px] items-center rounded-full border border-border/80 bg-surface-2 px-1 transition-all duration-300 ease-out hover:shadow-[0_6px_16px_-10px_rgba(0,0,0,0.45)] active:scale-[0.98] dark:border-border-dark/80 dark:bg-surface-2-dark"
            >
              <span className="pointer-events-none absolute left-2 text-[10px] opacity-70" aria-hidden="true">☀</span>
              <span className="pointer-events-none absolute right-2 text-[10px] opacity-70" aria-hidden="true">🌙</span>
              <span
                className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-primary shadow-[0_4px_14px_rgba(0,0,0,0.28)] ring-1 ring-white/35 transition-all duration-300 ease-out group-hover:shadow-[0_6px_18px_rgba(0,0,0,0.32)] ${
                  theme === "dark" ? "translate-x-[30px]" : "translate-x-0"
                }`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => setLocale("he")}
              aria-pressed={locale === "he"}
              title={t("lang.he")}
              className={`h-9 min-w-[74px] rounded-xl border px-3 text-xs font-semibold tracking-[0.08em] leading-none transition ${
                locale === "he"
                  ? "border-primary/90 bg-primary text-primary-contrast shadow-[0_8px_18px_-14px_rgba(0,0,0,0.55)]"
                  : "border-border/70 bg-transparent text-text-muted hover:border-border hover:text-text dark:border-border-dark/70 dark:text-text-dark-muted dark:hover:border-border-dark dark:hover:text-text-dark"
              }`}
            >
              {t("lang.he")}
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
              title="English"
              className={`h-9 min-w-[62px] rounded-xl border px-3 text-xs font-semibold tracking-[0.08em] leading-none transition ${
                locale === "en"
                  ? "border-primary/90 bg-primary text-primary-contrast shadow-[0_8px_18px_-14px_rgba(0,0,0,0.55)]"
                  : "border-border/70 bg-transparent text-text-muted hover:border-border hover:text-text dark:border-border-dark/70 dark:text-text-dark-muted dark:hover:border-border-dark dark:hover:text-text-dark"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <main 
        id="main-content" 
        className="mx-auto max-w-6xl px-6 py-10"
        role="main"
      >
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  beforeLoad: ({ context, location }) => {
    if (location.pathname === "/" && !context.auth.token) {
      if (clientEnv.isTestMode) {
        throw redirect({ to: "/investor-demo" });
      }
      throw redirect({ to: "/login", search: { redirect: undefined } });
    }
  },
});

const investorDemoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/investor-demo",
  beforeLoad: ({ context }) => {
    if (context.auth.token) {
      if (context.auth.user?.role === "COMMANDER") {
        throw redirect({ to: "/demo-split" });
      }
      throw redirect({ to: "/soldier" });
    }
  },
  component: InvestorDemoScreen,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.auth.token) {
      throw redirect({ to: "/alerts" });
    }
  },
  component: LoginScreen,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  beforeLoad: ({ context }) => {
    if (context.auth.token) {
      throw redirect({ to: "/alerts" });
    }
  },
  component: RegisterScreen,
});

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  beforeLoad: ({ context, location }) => {
    if (!context.auth.token) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: Outlet,
});

const indexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/",
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role === "COMMANDER") {
      throw redirect({ to: "/commander" });
    }
    throw redirect({ to: "/soldier" });
  },
});

const soldierRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/soldier",
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role === "COMMANDER") {
      throw redirect({ to: "/commander" });
    }
  },
  component: SoldierDashboard,
});

const commanderRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/commander",
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role !== "COMMANDER") {
      throw redirect({ to: "/soldier" });
    }
  },
  component: CommandCenter,
});

const teamRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/team",
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role !== "COMMANDER") {
      throw redirect({ to: "/soldier" });
    }
  },
  component: TeamScreen,
});

const demoSplitRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/demo-split",
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role !== "COMMANDER") {
      throw redirect({ to: "/soldier" });
    }
  },
  component: SplitDemoScreen,
});

const alertsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/alerts",
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role !== "COMMANDER") {
      throw redirect({ to: "/soldier" });
    }
  },
  component: AlertsHistoryScreen,
});

const responsesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/responses",
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role === "COMMANDER") {
      throw redirect({ to: "/commander" });
    }
  },
  component: ResponsesScreen,
});

const profileRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/profile",
  component: ProfileScreen,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: NotFoundScreen,
});

const routeTree = rootRoute.addChildren([
  investorDemoRoute,
  loginRoute,
  registerRoute,
  protectedRoute.addChildren([
    indexRoute,
    soldierRoute,
    commanderRoute,
    teamRoute,
    demoSplitRoute,
    alertsRoute,
    responsesRoute,
    profileRoute,
  ]),
  notFoundRoute,
]);

export const router = createRouter({
  routeTree,
  context: {} as RouterContext,
  defaultNotFoundComponent: NotFoundScreen,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
