import { db } from "../db/firestore";
import { AlertEvent, ResponseStatus, User } from "../types/domain";

const eventsCol = db.collection("alert_events");
const usersCol = db.collection("users");
const responsesCol = db.collection("responses");

type EventStatusItem = {
  user: User;
  responseStatus: ResponseStatus | "PENDING";
  respondedAt?: string;
};

type EventStatusResult = {
  event: AlertEvent;
  counts: { ok: number; help: number; pending: number };
  list: EventStatusItem[];
};

type UserDoc = {
  name: string;
  areaId: string;
  deviceToken: string;
  createdAt: string;
};

export async function getEventStatus(eventId: string): Promise<EventStatusResult> {
  const eventSnap = await eventsCol.doc(eventId).get();
  if (!eventSnap.exists) {
    const err: any = new Error("Event not found");
    err.status = 404;
    throw err;
  }

  const eventData = eventSnap.data() as { areaId: string; triggeredAt: string };
  const event: AlertEvent = {
    id: eventSnap.id,
    areaId: eventData.areaId,
    triggeredAt: eventData.triggeredAt,
  };

  const usersSnap = await usersCol.where("areaId", "==", event.areaId).get();
  const responsesSnap = await responsesCol.where("eventId", "==", eventId).get();

  const responseMap = new Map<string, { status: ResponseStatus; respondedAt: string }>();
  responsesSnap.forEach((doc) => {
    const data = doc.data() as { userId: string; status: ResponseStatus; respondedAt: string };
    responseMap.set(data.userId, { status: data.status, respondedAt: data.respondedAt });
  });

  const list: EventStatusItem[] = [];
  let ok = 0;
  let help = 0;
  let pending = 0;

  usersSnap.forEach((doc) => {
    const data = doc.data() as UserDoc;
    const user: User = {
      id: doc.id,
      name: data.name,
      areaId: data.areaId,
      deviceToken: data.deviceToken,
      createdAt: data.createdAt,
    };

    const response = responseMap.get(doc.id);
    if (response) {
      if (response.status === "OK") {
        ok += 1;
      } else {
        help += 1;
      }
      list.push({ user, responseStatus: response.status, respondedAt: response.respondedAt });
    } else {
      pending += 1;
      list.push({ user, responseStatus: "PENDING" });
    }
  });

  return {
    event,
    counts: { ok, help, pending },
    list,
  };
}
