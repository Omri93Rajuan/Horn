import { Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import * as alertService from "../services/alert.service";

export async function triggerAlert(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const result = await alertService.triggerAlert(req.body.areaId, userId);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}
