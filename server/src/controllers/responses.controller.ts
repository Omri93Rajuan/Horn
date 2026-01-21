import { Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import * as responsesService from "../services/responses.service";
import { prisma } from "../db/prisma";

export async function submitResponse(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || "";
    const result = await responsesService.submitResponse({
      userId,
      ...req.body,
    });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function getMyResponses(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return handleError(res, 401, "Unauthorized");
    }

    const responses = await prisma.response.findMany({
      where: { userId },
      orderBy: { respondedAt: "desc" },
      take: 50,
      include: {
        event: {
          select: {
            id: true,
            areaId: true,
            triggeredAt: true,
          },
        },
      },
    });

    const result = responses.map((response) => ({
      id: response.id,
      eventId: response.eventId,
      status: response.status,
      notes: response.notes || undefined,
      respondedAt: response.respondedAt.toISOString(),
      event: {
        id: response.event.id,
        areaId: response.event.areaId,
        triggeredAt: response.event.triggeredAt.toISOString(),
      },
    }));

    return res.json({ success: true, responses: result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}
