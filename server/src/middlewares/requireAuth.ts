import { NextFunction, Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import { verifyAccessToken } from "../helpers/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return handleError(res, 401, "Unauthorized");
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    return handleError(res, 401, "Unauthorized");
  }
}
