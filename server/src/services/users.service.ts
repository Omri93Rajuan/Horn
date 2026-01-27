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
