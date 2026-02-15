import fs from "fs";
import path from "path";
import dotenv from "dotenv";

type AppEnv = "development" | "production" | "test";

let envLoaded = false;

function normalizeEnv(value?: string): AppEnv {
  if (value === "production" || value === "test") {
    return value;
  }
  return "development";
}

export function loadEnv(): void {
  if (envLoaded) return;

  const appEnv = normalizeEnv(process.env.NODE_ENV);
  const cwd = process.cwd();
  const candidates =
    appEnv === "test"
      ? [".env.test.local", ".env.test", ".env"]
      : [`.env.${appEnv}.local`, ".env.local", `.env.${appEnv}`, ".env"];

  for (const fileName of candidates) {
    const filePath = path.join(cwd, fileName);
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  }

  envLoaded = true;
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseList(value: string | undefined): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

loadEnv();

const appEnv = normalizeEnv(process.env.NODE_ENV);
const isProduction = appEnv === "production";

const defaultCorsOrigins = isProduction
  ? []
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

export const env = {
  appEnv,
  isProduction,
  port: parseNumber(process.env.PORT, 3005),
  corsOrigins: parseList(process.env.CORS_ORIGINS).length
    ? parseList(process.env.CORS_ORIGINS)
    : defaultCorsOrigins,
  generalRateLimitWindowMs: parseNumber(
    process.env.RATE_LIMIT_WINDOW_MS,
    60_000,
  ),
  generalRateLimitMax: parseNumber(
    process.env.RATE_LIMIT_MAX,
    isProduction ? 300 : 1000,
  ),
  authRateLimitWindowMs: parseNumber(
    process.env.AUTH_RATE_LIMIT_WINDOW_MS,
    15 * 60_000,
  ),
  authRateLimitMax: parseNumber(
    process.env.AUTH_RATE_LIMIT_MAX,
    isProduction ? 15 : 100,
  ),
  seedOnStartup:
    (process.env.SEED_ON_STARTUP ?? (isProduction ? "false" : "true"))
      .toLowerCase() === "true",
};
