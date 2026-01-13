import { db } from "../db/firestore";
import { Response, ResponseStatus } from "../types/domain";

const eventsCol = db.collection("alert_events");
const responsesCol = db.collection("responses");

type SubmitResponseInput = {
  userId: string;
  eventId: string;
  status: ResponseStatus;
};

export async function submitResponse(input: SubmitResponseInput): Promise<Response> {
  const eventSnap = await eventsCol.doc(input.eventId).get();
  if (!eventSnap.exists) {
    const err: any = new Error("Event not found");
    err.status = 404;
    throw err;
  }

  const now = new Date().toISOString();
  const existing = await responsesCol
    .where("userId", "==", input.userId)
    .where("eventId", "==", input.eventId)
    .limit(1)
    .get();

  if (!existing.empty) {
    const doc = existing.docs[0];
    await doc.ref.update({ status: input.status, respondedAt: now });
    return {
      id: doc.id,
      userId: input.userId,
      eventId: input.eventId,
      status: input.status,
      respondedAt: now,
    };
  }

  const ref = responsesCol.doc();
  await ref.set({
    userId: input.userId,
    eventId: input.eventId,
    status: input.status,
    respondedAt: now,
  });

  return {
    id: ref.id,
    userId: input.userId,
    eventId: input.eventId,
    status: input.status,
    respondedAt: now,
  };
}
