type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const levelRank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel = (process.env.LOG_LEVEL ?? "info").toLowerCase();
const minLevel: LogLevel =
  envLevel === "error" || envLevel === "warn" || envLevel === "info" || envLevel === "debug"
    ? (envLevel as LogLevel)
    : "debug";

function shouldLog(level: LogLevel): boolean {
  return levelRank[level] >= levelRank[minLevel];
}

const ANSI = {
  reset: "\u001b[0m",
  dim: "\u001b[2m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
  cyan: "\u001b[36m",
};

function withColor(value: string, color: string): string {
  return `${color}${value}${ANSI.reset}`;
}

function padRight(value: string, width: number): string {
  if (value.length >= width) return value;
  return value + " ".repeat(width - value.length);
}

function toSafeString(value: unknown): string {
  if (value === undefined || value === null) return "-";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function toDevMessage(level: LogLevel, message: string, fields: LogFields): string {
  const reqId = toSafeString(fields.reqId);
  const method = toSafeString(fields.method);
  const path = toSafeString(fields.path);
  const status = toSafeString(fields.status);
  const durationMs = fields.durationMs !== undefined ? `${toSafeString(fields.durationMs)}ms` : "-";
  const userId = toSafeString(fields.userId);
  const ip = toSafeString(fields.ip);
  const error = toSafeString(fields.error);

  const plainLevel = padRight(level.toUpperCase(), 5);
  const plainStatus = padRight(status, 3);
  const plainDuration = padRight(durationMs, 9);
  const plainPath = padRight(path, 34);

  const levelColored =
    level === "error"
      ? withColor(plainLevel, ANSI.red)
      : level === "warn"
        ? withColor(plainLevel, ANSI.yellow)
        : level === "info"
          ? withColor(plainLevel, ANSI.green)
          : withColor(plainLevel, ANSI.cyan);

  const statusColored =
    status !== "-"
      ? Number(status) >= 500
        ? withColor(plainStatus, ANSI.red)
        : Number(status) >= 400
          ? withColor(plainStatus, ANSI.yellow)
          : withColor(plainStatus, ANSI.green)
      : plainStatus;

  const base =
    `${levelColored} ` +
    `${statusColored} ` +
    `${padRight(method, 6)} ` +
    `${withColor(plainDuration, ANSI.dim)} ` +
    `${plainPath} ` +
    `req=${reqId} ip=${ip} user=${userId}`;

  if (message.startsWith("http.")) {
    return base + (error !== "-" ? ` error=${error}` : "");
  }

  const context = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${toSafeString(value)}`)
    .join(" ");

  return `${padRight(level.toUpperCase(), 5)} ${message}${context ? ` ${context}` : ""}`;
}

function toMessage(level: LogLevel, message: string, fields: LogFields): string {
  const now = new Date().toISOString();
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify({
      ts: now,
      level,
      msg: message,
      ...fields,
    });
  }

  return `[${now}] ${toDevMessage(level, message, fields)}`;
}

function write(level: LogLevel, message: string, fields: LogFields = {}): void {
  if (!shouldLog(level)) {
    return;
  }

  const line = toMessage(level, message, fields);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  debug: (message: string, fields?: LogFields) => write("debug", message, fields),
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
