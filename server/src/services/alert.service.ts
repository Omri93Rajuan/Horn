import { prisma } from "../db/prisma";
import { AlertEvent } from "../types/domain";
import { sendPushToArea } from "./push.service";
import { mapPrismaError } from "../utils/prismaErrors";
import { io } from "../index";

type TriggerResult = {
  event: AlertEvent;
  push: { sent: number; failed: number };
};

export async function triggerAlert(areaId: string, triggeredByUserId?: string): Promise<TriggerResult> {
  try {
    if (!areaId) {
      const err: any = new Error("areaId is required");
      err.status = 400;
      throw err;
    }

    const now = new Date();
    const event = await prisma.alertEvent.create({
      data: {
        areaId,
        triggeredAt: now,
        triggeredByUserId: triggeredByUserId || null,
      },
    });

    const push = await sendPushToArea(areaId, event.id);

    // Emit real-time update to commanders
    io.to("commanders").emit("new-alert", {
      eventId: event.id,
      areaId,
      triggeredAt: now.toISOString(),
    });

    // Emit real-time update to soldiers in this area
    io.to(`area-${areaId}`).emit("new-alert", {
      eventId: event.id,
      areaId,
      triggeredAt: now.toISOString(),
    });

    console.log(`📡 WebSocket: Alert sent to commanders and area-${areaId}`);

    return {
      event: { id: event.id, areaId, triggeredAt: now.toISOString() },
      push,
    };
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}
