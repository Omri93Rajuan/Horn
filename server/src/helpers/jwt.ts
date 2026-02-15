import jwt, { type SignOptions } from "jsonwebtoken";

type JwtPayload = {
  userId: string;
  email: string;
  role: string;
};

function getAccessSecret(): string {
  const value = process.env.JWT_ACCESS_SECRET || "";
  if (!value) {
    throw new Error("JWT_ACCESS_SECRET is missing");
  }
  return value;
}

function getRefreshSecret(): string {
  const value = process.env.JWT_REFRESH_SECRET || "";
  if (!value) {
    throw new Error("JWT_REFRESH_SECRET is missing");
  }
  return value;
}

function getAccessTtl(): SignOptions["expiresIn"] {
  return (process.env.JWT_ACCESS_TTL ?? "15m") as SignOptions["expiresIn"];
}

function getRefreshTtl(): SignOptions["expiresIn"] {
  return (process.env.JWT_REFRESH_TTL ?? "30d") as SignOptions["expiresIn"];
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: getAccessTtl() });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: getRefreshTtl() });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getAccessSecret()) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, getRefreshSecret()) as JwtPayload;
}
