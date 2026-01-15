import { prisma } from "../db/prisma";
import { comparePassword, hashPassword } from "../helpers/bcrypt";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../helpers/jwt";
import { User } from "../types/domain";

type RegisterInput = {
  email: string;
  password: string;
  name: string;
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

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const err: any = new Error("Email already in use");
    err.status = 400;
    throw err;
  }

  const passwordHash = await hashPassword(input.password);
  const userDoc: UserDoc = {
    email: input.email,
    passwordHash,
    name: input.name,
    areaId: input.areaId || "",
    deviceToken: "",
    createdAt: new Date(),
  };

  const user = await prisma.user.create({ data: userDoc });

  const accessToken = signAccessToken({ userId: user.id, email: input.email });
  const refreshToken = signRefreshToken({ userId: user.id, email: input.email });
  const refreshHash = await hashPassword(refreshToken);

  await prisma.authRefreshToken.create({
    data: { userId: user.id, refreshTokenHash: refreshHash },
  });

  return {
    user: toPublicUser(user.id, userDoc),
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
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

  const accessToken = signAccessToken({ userId: user.id, email: input.email });
  const refreshToken = signRefreshToken({ userId: user.id, email: input.email });
  const refreshHash = await hashPassword(refreshToken);

  await prisma.authRefreshToken.upsert({
    where: { userId: user.id },
    update: { refreshTokenHash: refreshHash },
    create: { userId: user.id, refreshTokenHash: refreshHash },
  });

  return {
    user: toPublicUser(user.id, user),
    accessToken,
    refreshToken,
  };
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

  const refreshRow = await prisma.authRefreshToken.findUnique({ where: { userId: payload.userId } });
  if (!refreshRow) {
    const err: any = new Error("Refresh token revoked");
    err.status = 401;
    throw err;
  }

  const match = await comparePassword(input.refreshToken, refreshRow.refreshTokenHash);
  if (!match) {
    const err: any = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken({ userId: payload.userId, email: payload.email });
  return { accessToken };
}

export async function logout(input: LogoutInput) {
  await prisma.authRefreshToken.delete({ where: { userId: input.userId } }).catch(() => null);
  return { loggedOut: true };
}

export async function getMe(input: MeInput) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }

  return { user: toPublicUser(user.id, user) };
}
