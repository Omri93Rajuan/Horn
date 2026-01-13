import { db } from "../db/firestore";
import { comparePassword, hashPassword } from "../helpers/bcrypt";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../helpers/jwt";
import { User } from "../types/domain";

const usersCol = db.collection("users");
const refreshCol = db.collection("auth_refresh_tokens");

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
  createdAt: string;
};

function toPublicUser(id: string, doc: UserDoc): User {
  return {
    id,
    name: doc.name,
    areaId: doc.areaId,
    deviceToken: doc.deviceToken,
    createdAt: doc.createdAt,
  };
}

export async function register(input: RegisterInput) {
  const existing = await usersCol.where("email", "==", input.email).limit(1).get();
  if (!existing.empty) {
    const err: any = new Error("Email already in use");
    err.status = 400;
    throw err;
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);
  const userDoc: UserDoc = {
    email: input.email,
    passwordHash,
    name: input.name,
    areaId: input.areaId || "",
    deviceToken: "",
    createdAt: now,
  };

  const userRef = usersCol.doc();
  await userRef.set(userDoc);

  const accessToken = signAccessToken({ userId: userRef.id, email: input.email });
  const refreshToken = signRefreshToken({ userId: userRef.id, email: input.email });
  const refreshHash = await hashPassword(refreshToken);

  await refreshCol.doc(userRef.id).set({ refreshTokenHash: refreshHash, updatedAt: now });

  return {
    user: toPublicUser(userRef.id, userDoc),
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput) {
  const snapshot = await usersCol.where("email", "==", input.email).limit(1).get();
  if (snapshot.empty) {
    const err: any = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const docSnap = snapshot.docs[0];
  const userDoc = docSnap.data() as UserDoc;
  const isValid = await comparePassword(input.password, userDoc.passwordHash);
  if (!isValid) {
    const err: any = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken({ userId: docSnap.id, email: input.email });
  const refreshToken = signRefreshToken({ userId: docSnap.id, email: input.email });
  const refreshHash = await hashPassword(refreshToken);
  const now = new Date().toISOString();

  await refreshCol.doc(docSnap.id).set({ refreshTokenHash: refreshHash, updatedAt: now });

  return {
    user: toPublicUser(docSnap.id, userDoc),
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

  const refreshSnap = await refreshCol.doc(payload.userId).get();
  if (!refreshSnap.exists) {
    const err: any = new Error("Refresh token revoked");
    err.status = 401;
    throw err;
  }

  const { refreshTokenHash } = refreshSnap.data() as { refreshTokenHash: string };
  const match = await comparePassword(input.refreshToken, refreshTokenHash);
  if (!match) {
    const err: any = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken({ userId: payload.userId, email: payload.email });
  return { accessToken };
}

export async function logout(input: LogoutInput) {
  await refreshCol.doc(input.userId).delete();
  return { loggedOut: true };
}

export async function getMe(input: MeInput) {
  const docSnap = await usersCol.doc(input.userId).get();
  if (!docSnap.exists) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const userDoc = docSnap.data() as UserDoc;
  return { user: toPublicUser(docSnap.id, userDoc) };
}
