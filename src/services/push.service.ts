import { admin, db } from "../db/firestore";

export async function sendPushToArea(areaId: string, eventId: string): Promise<{ sent: number; failed: number }> {
  const usersSnap = await db.collection("users").where("areaId", "==", areaId).get();
  const tokens: string[] = [];

  usersSnap.forEach((doc) => {
    const data = doc.data() as { deviceToken?: string };
    if (data.deviceToken) {
      tokens.push(data.deviceToken);
    }
  });

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
