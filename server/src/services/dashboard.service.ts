import { prisma } from "../db/prisma";
import { AlertEvent, ResponseStatus, User } from "../types/domain";
import { mapPrismaError } from "../utils/prismaErrors";

type EventStatusItem = {
  user: User;
  responseStatus: ResponseStatus | "PENDING";
  notes?: string;
  respondedAt?: string;
};

type EventStatusResult = {
  event: AlertEvent;
  counts: { ok: number; help: number; pending: number };
  list: EventStatusItem[];
};

type UserDoc = {
  name: string;
  phone?: string;
  areaId: string;
  deviceToken: string;
  createdAt: Date;
};

export async function getEventStatus(
  eventId: string,
): Promise<EventStatusResult> {
  try {
    const eventRow = await prisma.alertEvent.findUnique({
      where: { id: eventId },
    });
    if (!eventRow) {
      const err: any = new Error("Event not found");
      err.status = 404;
      throw err;
    }

    const event: AlertEvent = {
      id: eventRow.id,
      areaId: eventRow.areaId,
      triggeredAt: eventRow.triggeredAt.toISOString(),
    };

    const [users, responses] = await Promise.all([
      prisma.user.findMany({ where: { areaId: event.areaId } }),
      prisma.response.findMany({ where: { eventId } }),
    ]);

    const responseMap = new Map<
      string,
      { status: ResponseStatus; notes?: string; respondedAt: string }
    >();
    responses.forEach((row) => {
      responseMap.set(row.userId, {
        status: row.status as ResponseStatus,
        notes: row.notes || undefined,
        respondedAt: row.respondedAt.toISOString(),
      });
    });

    const list: EventStatusItem[] = [];
    let ok = 0;
    let help = 0;
    let pending = 0;

    users.forEach((row) => {
      const user: User = {
        id: row.id,
        name: row.name,
        phone: row.phone ?? undefined,
        areaId: row.areaId,
        deviceToken: row.deviceToken,
        createdAt: row.createdAt.toISOString(),
      };

      const response = responseMap.get(row.id);
      if (response) {
        if (response.status === "OK") {
          ok += 1;
        } else {
          help += 1;
        }
        list.push({
          user,
          responseStatus: response.status,
          notes: response.notes,
          respondedAt: response.respondedAt,
        });
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
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}
