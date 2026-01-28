import { prisma } from "../db/prisma";
import { Response, ResponseStatus } from "../types/domain";
import { mapPrismaError } from "../utils/prismaErrors";
import { ACTIVE_EVENT_WINDOW_MINUTES } from "../config/events";
import { io } from "../index";

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

      // Check if response already exists
      const existing = await tx.response.findUnique({
        where: {
          userId_eventId: { userId: input.userId, eventId: input.eventId },
        },
      });

      if (existing) {
        const err: any = new Error("כבר דיווחת על אירוע זה");
        err.status = 400;
        throw err;
      }

      return tx.response.create({
        data: {
          userId: input.userId,
          eventId: input.eventId,
          status: input.status,
          notes: input.notes,
          respondedAt: now,
        },
      });
    });

    console.log(`📡 WebSocket: Emitting response-update to commanders room`);
    console.log(`   EventID: ${result.eventId}`);
    console.log(`   UserID: ${result.userId}`);
    console.log(`   Status: ${result.status}`);

    // Emit real-time update to commanders
    const updateData = {
      eventId: result.eventId,
      userId: result.userId,
      status: result.status,
      timestamp: result.respondedAt.toISOString(),
    };
    
    console.log(`   Emitting data:`, updateData);
    io.to("commanders").emit("response-update", updateData);
    console.log(`✅ Response-update emitted successfully`);

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
