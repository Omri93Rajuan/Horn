type AppEnv = "development" | "production";

function parseBooleanFlag(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return fallback;
}

const appEnv: AppEnv =
  import.meta.env.VITE_APP_ENV === "production" || import.meta.env.PROD
    ? "production"
    : "development";

const defaultApiBaseUrl =
  appEnv === "production" ? `${window.location.origin}/api` : "http://localhost:3005/api";

export const clientEnv = {
  appEnv,
  isProduction: appEnv === "production",
  isTestMode: parseBooleanFlag(import.meta.env.VITE_TEST_MODE, appEnv !== "production"),
  apiBaseUrl: import.meta.env.VITE_API_URL ?? defaultApiBaseUrl,
  socketUrl:
    import.meta.env.VITE_SOCKET_URL ??
    (import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
      : appEnv === "production"
        ? window.location.origin
        : "http://localhost:3005"),
};
