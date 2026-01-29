import { Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import { getCommanderActiveSummary, getCommanderOverview } from "../services/dashboard.service";
import { prisma } from "../db/prisma";

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

export async function getAreaSoldiersHandler(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    const { areaId } = req.params;
    
    if (!userId) {
      return handleError(res, 401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "COMMANDER") {
      return handleError(res, 403, "Commander role required");
    }

    const allowedAreas = user.commanderAreas.length
      ? user.commanderAreas
      : [user.areaId].filter(Boolean);
    
    if (!allowedAreas.includes(areaId)) {
      return handleError(res, 403, "Area not allowed");
    }

    const soldiers = await prisma.user.findMany({
      where: { areaId },
      select: {
        id: true,
        name: true,
        email: true,
        areaId: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return res.json({ 
      success: true, 
      soldiers,
      count: soldiers.length 
    });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}
