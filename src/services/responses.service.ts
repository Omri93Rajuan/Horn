import { prisma } from "../db/prisma";
import { Response, ResponseStatus } from "../types/domain";

type SubmitResponseInput = {
  userId: string;
  eventId: string;
  status: ResponseStatus;
};

export async function submitResponse(input: SubmitResponseInput): Promise<Response> {
  const event = await prisma.alertEvent.findUnique({ where: { id: input.eventId } });
  if (!event) {
    const err: any = new Error("Event not found");
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const existing = await prisma.response.findUnique({
    where: { userId_eventId: { userId: input.userId, eventId: input.eventId } },
  });

  if (existing) {
    const updated = await prisma.response.update({
      where: { id: existing.id },
      data: { status: input.status, respondedAt: now },
    });
    return {
      id: updated.id,
      userId: updated.userId,
      eventId: updated.eventId,
      status: updated.status as ResponseStatus,
      respondedAt: updated.respondedAt.toISOString(),
    };
  }

  const created = await prisma.response.create({
    data: {
      userId: input.userId,
      eventId: input.eventId,
      status: input.status,
      respondedAt: now,
    },
  });

  return {
    id: created.id,
    userId: created.userId,
    eventId: created.eventId,
    status: created.status as ResponseStatus,
    respondedAt: created.respondedAt.toISOString(),
  };
}
