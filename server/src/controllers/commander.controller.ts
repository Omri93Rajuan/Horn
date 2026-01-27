import { Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import { getCommanderActiveSummary, getCommanderOverview } from "../services/dashboard.service";

export async function getCommanderOverviewHandler(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return handleError(res, 401, "Unauthorized");
    }

    const result = await getCommanderOverview(userId);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function getCommanderActiveHandler(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return handleError(res, 401, "Unauthorized");
    }

    const result = await getCommanderActiveSummary(userId);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}
