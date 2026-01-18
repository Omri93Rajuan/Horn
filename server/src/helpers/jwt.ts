import jwt, { type SignOptions } from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET || "";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "";
const accessTtl = (process.env.JWT_ACCESS_TTL ?? "15m") as SignOptions["expiresIn"];
const refreshTtl = (process.env.JWT_REFRESH_TTL ?? "30d") as SignOptions["expiresIn"];

type JwtPayload = {
  userId: string;
  email: string;
};

export function signAccessToken(payload: JwtPayload): string {
  if (!accessSecret) {
    throw new Error("JWT_ACCESS_SECRET is missing");
  }
  return jwt.sign(payload, accessSecret, { expiresIn: accessTtl });
}

export function signRefreshToken(payload: JwtPayload): string {
  if (!refreshSecret) {
    throw new Error("JWT_REFRESH_SECRET is missing");
  }
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshTtl });
}

export function verifyAccessToken(token: string): JwtPayload {
  if (!accessSecret) {
    throw new Error("JWT_ACCESS_SECRET is missing");
  }
  return jwt.verify(token, accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  if (!refreshSecret) {
    throw new Error("JWT_REFRESH_SECRET is missing");
  }
  return jwt.verify(token, refreshSecret) as JwtPayload;
}
