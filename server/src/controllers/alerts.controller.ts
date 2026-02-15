import { Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import * as alertService from "../services/alert.service";
import * as demoService from "../services/demo.service";
import { prisma } from "../db/prisma";
import { Prisma } from "@prisma/client";

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

    // Get user counts per area in a single query for comparison
    const userCounts = await prisma.user.groupBy({
      by: ['areaId'],
      where: { areaId: { in: allowedAreas } },
      _count: { _all: true },
    });
    const userCountByArea: Record<string, number> = {};
    for (const item of userCounts) {
      userCountByArea[item.areaId] = item._count._all;
    }

    // Filter to only active (incomplete) events at database level using raw query
    // This is more efficient than fetching all events and filtering in memory
    const activeEvents = await prisma.$queryRaw<Array<{
      id: string;
      areaId: string;
      triggeredAt: Date;
      triggeredByUserId: string | null;
      triggeredByName: string | null;
      responseCount: bigint;
    }>>`
      SELECT 
        ae.id,
        ae.areaId,
        ae.triggeredAt,
        ae.triggeredByUserId,
        u.name as triggeredByName,
        COUNT(r.id) as responseCount
      FROM "AlertEvent" ae
      LEFT JOIN "User" u ON ae.triggeredByUserId = u.id
      LEFT JOIN "Response" r ON ae.id = r.eventId
      WHERE ae.areaId IN (${Prisma.join(allowedAreas)})
        AND ae.completedAt IS NULL
      GROUP BY ae.id, ae.areaId, ae.triggeredAt, ae.triggeredByUserId, u.name
      ORDER BY ae.triggeredAt DESC
      LIMIT 100
    `;

    // Filter events where response count < total users in area
    const result = activeEvents
      .filter(event => {
        const totalUsers = userCountByArea[event.areaId] ?? 0;
        const responsesCount = Number(event.responseCount);
        return responsesCount < totalUsers;
      })
      .map(event => ({
        id: event.id,
        areaId: event.areaId,
        triggeredAt: event.triggeredAt.toISOString(),
        triggeredBy: event.triggeredByUserId
          ? { id: event.triggeredByUserId, name: event.triggeredByName }
          : null,
      }));

    return res.json({ success: true, events: result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function getAllAlerts(req: Request, res: Response) {
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

    // Get ALL events (including completed) for history
    const allEvents = await prisma.alertEvent.findMany({
      where: { areaId: { in: allowedAreas } },
      orderBy: { triggeredAt: "desc" },
      take: 500, // Limit to prevent too much data
      include: {
        triggeredByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const result = allEvents.map(event => ({
      id: event.id,
      areaId: event.areaId,
      triggeredAt: event.triggeredAt.toISOString(),
      triggeredByUserId: event.triggeredByUserId,
      completedAt: event.completedAt?.toISOString() || null,
      completedByUserId: event.completedByUserId || null,
      completionReason: event.completionReason || null,
      triggeredBy: event.triggeredByUserId && event.triggeredByUser
        ? { id: event.triggeredByUser.id, name: event.triggeredByUser.name }
        : null,
    }));

    return res.json({ success: true, events: result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function closeAlert(req: Request, res: Response) {
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

    const { eventId, reason } = req.body;
    if (!eventId) {
      return handleError(res, 400, "Event ID required");
    }

    // Verify the event exists and belongs to an allowed area
    const event = await prisma.alertEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return handleError(res, 404, "Event not found");
    }

    const allowedAreas = user.commanderAreas.length
      ? user.commanderAreas
      : [user.areaId].filter(Boolean);

    if (!allowedAreas.includes(event.areaId)) {
      return handleError(res, 403, "Area not allowed");
    }

    if (event.completedAt) {
      return handleError(res, 400, "Event already closed");
    }

    // Close the event
    const updatedEvent = await prisma.alertEvent.update({
      where: { id: eventId },
      data: {
        completedAt: new Date(),
        completedByUserId: userId,
        completionReason: reason || null,
      },
    });

    return res.json({ 
      success: true, 
      event: {
        id: updatedEvent.id,
        completedAt: updatedEvent.completedAt,
        completionReason: updatedEvent.completionReason,
      }
    });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function runDemoScenario(req: Request, res: Response) {
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

    const result = await demoService.startDemoScenario({
      commanderId: userId,
      allowedAreas,
      areaId: req.body?.areaId,
    });

    return res.status(202).json({
      success: true,
      message: "Demo scenario started",
      result,
    });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

