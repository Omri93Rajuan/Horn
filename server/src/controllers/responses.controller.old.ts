import { Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import * as responsesService from "../services/responses.service";

export async function submitResponse(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || "";
    const result = await responsesService.submitResponse({ userId, ...req.body });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}
