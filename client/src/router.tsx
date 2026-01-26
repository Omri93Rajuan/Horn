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
import AlertsScreen from "./screens/AlertsScreen";
import ResponsesScreen from "./screens/ResponsesScreen";
import ProfileScreen from "./screens/ProfileScreen";
import type { RootState } from "./store";
import { useAppSelector } from "./store/hooks";

type RouterContext = {
  auth: RootState["auth"];
};

const RootLayout = () => {
  const auth = useAppSelector((state) => state.auth);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">Horn</span>
          <span className="brand-sub">מערכת התראות אזורית</span>
        </div>
        <div className="header-meta">
          <span className={`status-pill ${isOnline ? "online" : "offline"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
          {auth.token ? (
            <nav className="nav-links">
              <Link to="/dashboard">דשבורד</Link>
              <Link to="/alerts">התראות</Link>
              <Link to="/responses">תגובות</Link>
              <Link to="/profile">פרופיל</Link>
            </nav>
          ) : null}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginScreen,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
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

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  protectedRoute.addChildren([
    indexRoute,
    dashboardRoute,
    alertsRoute,
    responsesRoute,
    profileRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  context: {} as RouterContext,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
