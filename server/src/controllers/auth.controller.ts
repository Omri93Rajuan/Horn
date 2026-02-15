import { Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import * as authService from "../services/auth.service";

export async function registerUser(req: Request, res: Response) {
  try {
    const result = await authService.register(req.body);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const result = await authService.login(req.body);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const result = await authService.refresh(req.body);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function logoutUser(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || "";
    const result = await authService.logout({ userId });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || "";
    const result = await authService.getMe({ userId });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function demoLoginUser(_req: Request, res: Response) {
  try {
    const result = await authService.demoLogin();
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}
