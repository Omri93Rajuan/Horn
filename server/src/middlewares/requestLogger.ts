import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger";

function getClientIp(req: Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0];
  }
  if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function summarizeBody(req: Request): string | undefined {
  if (!req.body || typeof req.body !== "object") {
    return undefined;
  }
  const keys = Object.keys(req.body);
  if (keys.length === 0) {
    return undefined;
  }
  return keys.slice(0, 12).join(",");
}

function sanitizePath(path: string): string {
  return path.replace(/([?&](token|refreshToken|password)=)[^&]*/gi, "$1***");
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const reqId = req.headers["x-request-id"]?.toString() || randomUUID();
  const startedAt = process.hrtime.bigint();
  const ip = getClientIp(req);

  req.requestId = reqId;
  res.setHeader("x-request-id", reqId);

  const bodyKeys = summarizeBody(req);

  logger.debug("http.request.start", {
    reqId,
    method: req.method,
    path: sanitizePath(req.originalUrl || req.url),
    ip,
    bodyKeys,
  });

  res.on("finish", () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    const outcome = statusCode >= 400 ? "failed" : "ok";
    const userId = req.user?.userId;
    const contentLength = res.getHeader("content-length");
    const errorMessage = res.locals.errorMessage as string | undefined;
    const userAgent = req.headers["user-agent"]?.toString().slice(0, 120);

    logger[level]("http.request.finish", {
      reqId,
      method: req.method,
      path: sanitizePath(req.originalUrl || req.url),
      status: statusCode,
      durationMs: Number(elapsedMs.toFixed(2)),
      outcome,
      ip,
      userId,
      bytes: contentLength ? Number(contentLength) : undefined,
      error: errorMessage,
      ua: userAgent,
    });
  });

  next();
}
