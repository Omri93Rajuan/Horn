import { prisma } from "../db/prisma";
import { AlertEvent } from "../types/domain";
import { sendPushToArea } from "./push.service";

type TriggerResult = {
  event: AlertEvent;
  push: { sent: number; failed: number };
};

export async function triggerAlert(areaId: string, triggeredByUserId?: string): Promise<TriggerResult> {
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

  return {
    event: { id: event.id, areaId, triggeredAt: now.toISOString() },
    push,
  };
}
