import { Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import * as usersService from "../services/users.service";

export async function registerDevice(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || "";
    const result = await usersService.registerDevice({ userId, ...req.body });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}
