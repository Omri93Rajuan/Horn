import { admin } from "../db/firebase";
import { prisma } from "../db/prisma";

export async function sendPushToArea(areaId: string, eventId: string): Promise<{ sent: number; failed: number }> {
  const users = await prisma.user.findMany({ where: { areaId } });
  const tokens = users.map((user) => user.deviceToken).filter((token) => Boolean(token));

  if (tokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const message = {
    tokens,
    data: {
      type: "ALERT_EVENT",
      eventId,
      areaId,
    },
    notification: {
      title: "Emergency Roll-Call",
      body: "Please confirm your status immediately.",
    },
  };

  try {
    const result = await admin.messaging().sendEachForMulticast(message);
    return { sent: result.successCount, failed: result.failureCount };
  } catch (err) {
    return { sent: 0, failed: tokens.length };
  }
}
