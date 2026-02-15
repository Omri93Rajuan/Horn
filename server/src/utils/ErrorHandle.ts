import { Response } from "express";
import { logger } from "./logger";

export function handleError(
  res: Response,
  status: number,
  message: string,
  extra?: Record<string, unknown>,
) {
  const error = { message, status, ...(extra || {}) };
  res.locals.errorMessage = message;

  if (status >= 500) {
    logger.error("http.error.response", {
      status,
      message,
      reqId: res.req?.requestId,
    });
  }

  return res.status(status).json({ success: false, error });
}
