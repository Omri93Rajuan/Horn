import { prisma } from "../db/prisma";
import { comparePassword, hashPassword } from "../helpers/bcrypt";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../helpers/jwt";
import { User } from "../types/domain";
import { mapPrismaError } from "../utils/prismaErrors";

type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  areaId?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type RefreshInput = {
  refreshToken: string;
};

type LogoutInput = {
  userId: string;
};

type MeInput = {
  userId: string;
};

type UserDoc = {
  email: string;
  passwordHash: string;
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

export async function register(input: RegisterInput) {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      const err: any = new Error("Email already in use");
      err.status = 400;
      throw err;
    }

    const passwordHash = await hashPassword(input.password);
    const userDoc: UserDoc = {
      email: input.email,
      phone: input.phone,
      passwordHash,
      name: input.name,
      areaId: input.areaId || "",
      role: "USER",
      commanderAreas: [],
      deviceToken: "",
      createdAt: new Date(),
    };

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: userDoc });
      const accessToken = signAccessToken({
        userId: user.id,
        email: input.email,
      });
      const refreshToken = signRefreshToken({
        userId: user.id,
        email: input.email,
      });
      const refreshHash = await hashPassword(refreshToken);

      await tx.authRefreshToken.create({
        data: { userId: user.id, refreshTokenHash: refreshHash },
      });

      return { user, accessToken, refreshToken };
    });

    return {
      user: toPublicUser(result.user.id, userDoc),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  } catch (err) {
    const mapped = mapPrismaError(err, "Server error");
    if (mapped.message === "Duplicate entry") {
      mapped.message = "Email already in use";
    }
    throw mapped;
  }
}

export async function login(input: LoginInput) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      const err: any = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    const isValid = await comparePassword(input.password, user.passwordHash);
    if (!isValid) {
      const err: any = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }

    const accessToken = signAccessToken({
      userId: user.id,
      email: input.email,
    });
    const refreshToken = signRefreshToken({
      userId: user.id,
      email: input.email,
    });
    const refreshHash = await hashPassword(refreshToken);

    await prisma.authRefreshToken.upsert({
      where: { userId: user.id },
      update: { refreshTokenHash: refreshHash },
      create: { userId: user.id, refreshTokenHash: refreshHash },
    });

    return {
      user: toPublicUser(user.id, {
        ...user,
        phone: user.phone ?? undefined,
        role: user.role as "USER" | "COMMANDER",
        commanderAreas: user.commanderAreas,
      }),
      accessToken,
      refreshToken,
    };
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}

export async function refresh(input: RefreshInput) {
  let payload: { userId: string; email: string };
  try {
    payload = verifyRefreshToken(input.refreshToken);
  } catch (err) {
    const error: any = new Error("Invalid refresh token");
    error.status = 401;
    throw error;
  }

  try {
    const refreshRow = await prisma.authRefreshToken.findUnique({
      where: { userId: payload.userId },
    });
    if (!refreshRow) {
      const err: any = new Error("Refresh token revoked");
      err.status = 401;
      throw err;
    }

    const match = await comparePassword(
      input.refreshToken,
      refreshRow.refreshTokenHash,
    );
    if (!match) {
      const err: any = new Error("Invalid refresh token");
      err.status = 401;
      throw err;
    }

    const accessToken = signAccessToken({
      userId: payload.userId,
      email: payload.email,
    });
    return { accessToken };
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}

export async function logout(input: LogoutInput) {
  try {
    await prisma.authRefreshToken
      .delete({ where: { userId: input.userId } })
      .catch(() => null);
    return { loggedOut: true };
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}

export async function getMe(input: MeInput) {
  try {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      const err: any = new Error("User not found");
      err.status = 404;
      throw err;
    }

    return {
      user: toPublicUser(user.id, {
        ...user,
        phone: user.phone ?? undefined,
        role: user.role as "USER" | "COMMANDER",
        commanderAreas: user.commanderAreas,
      }),
    };
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}
