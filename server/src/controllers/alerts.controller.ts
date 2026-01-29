import { Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import * as alertService from "../services/alert.service";
import { prisma } from "../db/prisma";

export async function triggerAlert(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return handleError(res, 401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return handleError(res, 404, "User not found");
    }

    if (user.role !== "COMMANDER") {
      return handleError(res, 403, "Commander role required");
    }

    const allowedAreas = user.commanderAreas.length
      ? user.commanderAreas
      : [user.areaId].filter(Boolean);
    if (!allowedAreas.includes(req.body.areaId)) {
      return handleError(res, 403, "Area not allowed");
    }

    const result = await alertService.triggerAlert(req.body.areaId, userId);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function getAlerts(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return handleError(res, 401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return handleError(res, 404, "User not found");
    }

    const allowedAreas =
      user.role === "COMMANDER" && user.commanderAreas.length
        ? user.commanderAreas
        : [user.areaId].filter(Boolean);

    const events = await prisma.alertEvent.findMany({
      where: { areaId: { in: allowedAreas } },
      orderBy: { triggeredAt: "desc" },
      take: 50,
      include: {
        triggeredByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const result = events.map((event) => ({
      id: event.id,
      areaId: event.areaId,
      triggeredAt: event.triggeredAt.toISOString(),
      triggeredBy: event.triggeredByUser
        ? { id: event.triggeredByUser.id, name: event.triggeredByUser.name }
        : null,
    }));

    return res.json({ success: true, events: result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}
