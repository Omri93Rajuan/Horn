type AppEnv = "development" | "production";

const appEnv: AppEnv =
  import.meta.env.VITE_APP_ENV === "production" || import.meta.env.PROD
    ? "production"
    : "development";

const defaultApiBaseUrl =
  appEnv === "production" ? `${window.location.origin}/api` : "http://localhost:3005/api";

export const clientEnv = {
  appEnv,
  isProduction: appEnv === "production",
  apiBaseUrl: import.meta.env.VITE_API_URL ?? defaultApiBaseUrl,
  socketUrl:
    import.meta.env.VITE_SOCKET_URL ??
    (import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
      : appEnv === "production"
        ? window.location.origin
        : "http://localhost:3005"),
};
