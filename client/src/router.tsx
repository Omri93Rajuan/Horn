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
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import DashboardScreen from "./screens/DashboardScreen";
import CommanderDashboard from "./screens/CommanderDashboard";
import AlertsScreen from "./screens/AlertsScreen";
import ResponsesScreen from "./screens/ResponsesScreen";
import ProfileScreen from "./screens/ProfileScreen";
import NotFoundScreen from "./screens/NotFoundScreen";
import type { RootState } from "./store";
import { useAppSelector } from "./store/hooks";
import logoUrl from "./assets/mainlogo.webp";

type RouterContext = {
  auth: RootState["auth"];
};

const RootLayout = () => {
  const auth = useAppSelector((state) => state.auth);
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
      <header className="sticky top-0 z-20 border-b border-border/70 bg-surface-1/95 backdrop-blur-xl dark:border-border-dark dark:bg-surface-1-dark/95">
        <div className="relative mx-auto flex max-w-6xl items-center justify-center px-6 py-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <img src={logoUrl} alt="Horn" className="h-20 w-auto" />
            <div>
              <p className="text-[11px] tracking-[0.45em] text-text-muted dark:text-text-dark-muted">הורן</p>
              <h1 className="font-display text-2xl text-text dark:text-text-dark">מרכז שליטה</h1>
            </div>
          </div>
        </div>
        {auth.token ? (
          <div className="border-t border-border/60 dark:border-border-dark/60">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="action-btn ghost px-4 py-2 text-xs"
                >
                  אחורה
                </button>
                <button
                  type="button"
                  onClick={() => window.history.forward()}
                  className="action-btn ghost px-4 py-2 text-xs"
                >
                  קדימה
                </button>
              </div>
              <nav className="flex items-center gap-4 text-sm font-medium text-text-muted dark:text-text-dark-muted">
                <Link className="hover:text-primary" to="/dashboard">דשבורד</Link>
                {auth.user?.role === "COMMANDER" ? (
                  <Link className="hover:text-primary" to="/commander">קומנדור</Link>
                ) : null}
                <Link className="hover:text-primary" to="/alerts">התראות</Link>
                <Link className="hover:text-primary" to="/responses">תגובות</Link>
                <Link className="hover:text-primary" to="/profile">פרופיל</Link>
              </nav>
            </div>
          </div>
        ) : null}
      </header>

      <button
        type="button"
        aria-label={theme === "dark" ? "מצב בהיר" : "מצב כהה"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="fixed right-6 top-32 z-30 flex items-center gap-2 rounded-full border border-border bg-surface-1 px-2 py-2 shadow-hud transition hover:border-primary/40 dark:border-border-dark dark:bg-surface-1-dark"
      >
        <span className="relative flex h-7 w-12 items-center rounded-full border border-border bg-surface-2 px-1 dark:border-border-dark dark:bg-surface-2-dark">
          <span
            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-primary transition-transform ${
              theme === "dark" ? "translate-x-0" : "translate-x-5"
            }`}
          />
          <span className="flex w-full items-center justify-between px-1 text-[10px] text-text-muted dark:text-text-dark-muted">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3.5V2M12 22v-1.5M4.2 4.2l1.06 1.06M18.74 18.74l1.06 1.06M2 12h1.5M20.5 12H22M4.2 19.8l1.06-1.06M18.74 5.26l1.06-1.06M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </button>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  beforeLoad: ({ context, location }) => {
    // If accessing root and not logged in, redirect to login
    if (location.pathname === "/" && !context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: ({ context }) => {
    // If already logged in, redirect to dashboard
    if (context.auth.token) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginScreen,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  beforeLoad: ({ context }) => {
    // If already logged in, redirect to dashboard
    if (context.auth.token) {
      throw redirect({ to: "/dashboard" });
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
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/dashboard",
  component: DashboardScreen,
});

const commanderRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/commander",
  component: CommanderDashboard,
});

const alertsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/alerts",
  component: AlertsScreen,
});

const responsesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/responses",
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
  loginRoute,
  registerRoute,
  protectedRoute.addChildren([
    indexRoute,
    dashboardRoute,
    commanderRoute,
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
