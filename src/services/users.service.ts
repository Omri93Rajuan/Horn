import { prisma } from "../db/prisma";
import { User } from "../types/domain";

type RegisterDeviceInput = {
  userId: string;
  areaId: string;
  deviceToken: string;
  name?: string;
};

type UserDoc = {
  name: string;
  areaId: string;
  deviceToken: string;
  createdAt: Date;
};

function toPublicUser(id: string, doc: UserDoc): User {
  return {
    id,
    name: doc.name,
    areaId: doc.areaId,
    deviceToken: doc.deviceToken,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function registerDevice(input: RegisterDeviceInput) {
  const existing = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!existing) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const updated: UserDoc = {
    name: input.name || existing.name,
    areaId: input.areaId,
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
}
