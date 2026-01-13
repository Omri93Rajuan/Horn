import { Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import * as dashboardService from "../services/dashboard.service";

export async function getEventStatus(req: Request, res: Response) {
  try {
    const result = await dashboardService.getEventStatus(req.params.eventId);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}
