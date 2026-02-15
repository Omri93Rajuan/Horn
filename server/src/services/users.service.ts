import { prisma } from "../db/prisma";
import { User } from "../types/domain";
import { mapPrismaError } from "../utils/prismaErrors";

type RegisterDeviceInput = {
  userId: string;
  areaId: string;
  deviceToken: string;
  name?: string;
};

type UserDoc = {
  name: string;
  phone?: string;
  areaId: string;
  role: "USER" | "COMMANDER";
  commanderAreas: string[];
  deviceToken: string;
  createdAt: Date;
};

function toPublicUser(id: string, doc: UserDoc): User {
  return {
    id,
    name: doc.name,
    phone: doc.phone,
    areaId: doc.areaId,
    role: doc.role,
    commanderAreas: doc.commanderAreas,
    deviceToken: doc.deviceToken,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function registerDevice(input: RegisterDeviceInput) {
  try {
    const existing = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!existing) {
      const err: any = new Error("User not found");
      err.status = 404;
      throw err;
    }

    const updated: UserDoc = {
      name: input.name || existing.name,
      phone: existing.phone ?? undefined,
      areaId: input.areaId,
      role: existing.role as "USER" | "COMMANDER",
      commanderAreas: existing.commanderAreas,
      deviceToken: input.deviceToken,
      createdAt: existing.createdAt,
    };

    await prisma.user.update({
      where: { id: input.userId },
      data: {
        name: updated.name,
        areaId: updated.areaId,
        deviceToken: updated.deviceToken,
      },
    });

    return { user: toPublicUser(input.userId, updated) };
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}

export async function getTeamMembers(commanderId: string) {
  try {
    const commander = await prisma.user.findUnique({ 
      where: { id: commanderId },
      select: { commanderAreas: true, role: true }
    });
    
    if (!commander || commander.role !== 'COMMANDER') {
      const err: any = new Error("Unauthorized");
      err.status = 403;
      throw err;
    }

    const users = await prisma.user.findMany({
      where: {
        areaId: { in: commander.commanderAreas }
      },
      select: {
        id: true,
        name: true,
        email: true,
        areaId: true,
        role: true,
        createdAt: true,
        responses: {
          select: {
            status: true,
            respondedAt: true,
            event: {
              select: {
                triggeredAt: true
              }
            }
          }
        }
      }
    });

    return users.map(user => {
      const responses = user.responses;
      const totalResponses = responses.length;
      const okResponses = responses.filter(r => r.status === 'OK').length;
      const helpResponses = responses.filter(r => r.status === 'HELP').length;
      
      let totalResponseTime = 0;
      let validResponses = 0;
      responses.forEach(r => {
        if (r.respondedAt && r.event?.triggeredAt) {
          const responseTime = new Date(r.respondedAt).getTime() - new Date(r.event.triggeredAt).getTime();
          if (responseTime > 0) {
            totalResponseTime += responseTime;
            validResponses++;
          }
        }
      });
      
      const avgResponseTime = validResponses > 0 ? totalResponseTime / validResponses / 1000 : 0;
      const lastResponseDate = responses.length > 0 
        ? responses.sort((a, b) => 
            new Date(b.respondedAt!).getTime() - new Date(a.respondedAt!).getTime()
          )[0]?.respondedAt
        : null;

      return {
        id: user.id,
        username: user.name,
        email: user.email,
        areaId: user.areaId,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        responseStats: {
          totalResponses,
          okResponses,
          helpResponses,
          averageResponseTime: Math.round(avgResponseTime),
          lastResponseDate: lastResponseDate ? new Date(lastResponseDate).toISOString() : null,
        }
      };
    });
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}
