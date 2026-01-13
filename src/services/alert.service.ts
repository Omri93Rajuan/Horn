import { db } from "../db/firestore";
import { AlertEvent } from "../types/domain";
import { sendPushToArea } from "./push.service";

const alertsCol = db.collection("alert_events");

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

  const now = new Date().toISOString();
  const eventRef = alertsCol.doc();
  await eventRef.set({ areaId, triggeredAt: now, triggeredByUserId: triggeredByUserId || null });

  const push = await sendPushToArea(areaId, eventRef.id);

  return {
    event: { id: eventRef.id, areaId, triggeredAt: now },
    push,
  };
}
