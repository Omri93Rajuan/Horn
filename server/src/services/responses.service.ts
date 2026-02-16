import { prisma } from "../db/prisma";
import { Response, ResponseStatus } from "../types/domain";
import { mapPrismaError } from "../utils/prismaErrors";
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

      // IMPORTANT: Check duplicate first to avoid race condition
      // This prevents counting responses before the duplicate check
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

      const response = await tx.response.create({
        data: {
          userId: input.userId,
          eventId: input.eventId,
          status: input.status,
          notes: input.notes,
          respondedAt: now,
        },
      });

      // Check completion status after creating response (prevents race condition)
      const totalUsersInArea = await tx.user.count({
        where: { 
          areaId: event.areaId,
          role: "USER" // Only count soldiers, not commanders
        },
      });
      
      const responsesCount = await tx.response.count({
        where: { eventId: input.eventId },
      });

      // Auto-close event if all users responded and event is not already closed
      if (responsesCount >= totalUsersInArea && !event.completedAt) {
        await tx.alertEvent.update({
          where: { id: input.eventId },
          data: {
            completedAt: now,
            completedByUserId: null, // null = auto-closed
            completionReason: "כל החיילים דיווחו - נסגר אוטומטית",
          },
        });
        console.log(`✅ Event ${input.eventId} auto-closed - all users responded (${responsesCount}/${totalUsersInArea})`);
      }

      return response;
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
