import { prisma } from "../db/prisma";
import { Response, ResponseStatus } from "../types/domain";
import { mapPrismaError } from "../utils/prismaErrors";
import { ACTIVE_EVENT_WINDOW_MINUTES } from "../config/events";

type SubmitResponseInput = {
  userId: string;
  eventId: string;
  status: ResponseStatus;
  notes?: string;
};

export async function submitResponse(
  input: SubmitResponseInput,
): Promise<Response> {
  try {
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.alertEvent.findUnique({
        where: { id: input.eventId },
      });
      if (!event) {
        const err: any = new Error("Event not found");
        err.status = 404;
        throw err;
      }
      const windowMs = ACTIVE_EVENT_WINDOW_MINUTES * 60 * 1000;
      if (now.getTime() - event.triggeredAt.getTime() > windowMs) {
        const err: any = new Error("חלון הזמן לאישור האירוע נסגר");
        err.status = 403;
        throw err;
      }

      return tx.response.upsert({
        where: {
          userId_eventId: { userId: input.userId, eventId: input.eventId },
        },
        update: { status: input.status, notes: input.notes, respondedAt: now },
        create: {
          userId: input.userId,
          eventId: input.eventId,
          status: input.status,
          notes: input.notes,
          respondedAt: now,
        },
      });
    });

    return {
      id: result.id,
      userId: result.userId,
      eventId: result.eventId,
      status: result.status as ResponseStatus,
      notes: result.notes || undefined,
      respondedAt: result.respondedAt.toISOString(),
    };
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}
