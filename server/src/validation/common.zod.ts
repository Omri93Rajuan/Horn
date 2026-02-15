import { z } from "zod";

const namePattern = /^[\p{L}\p{M}][\p{L}\p{M}\s'-]{1,59}$/u;
const areaPattern = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{1,119}$/u;
const tokenPattern = /^[A-Za-z0-9:_\-.]+$/;

export const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .email("Invalid email");

export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/\d/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character")
  .refine((value) => !/\s/.test(value), "Password must not include spaces");

export const normalizedNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name is too long")
  .regex(namePattern, "Invalid name format");

export const normalizedPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^\d]/g, ""))
  .refine((value) => /^0\d{8,9}$/.test(value), "Invalid Israeli phone number");

export const optionalPhoneSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, normalizedPhoneSchema.optional());

export const normalizedAreaSchema = z
  .string()
  .trim()
  .min(2, "Area is required")
  .max(120, "Area is too long")
  .regex(areaPattern, "Invalid area format");

export const eventIdSchema = z.string().trim().min(1, "Event ID is required").max(64, "Invalid event ID");

export const deviceTokenSchema = z
  .string()
  .trim()
  .min(20, "Device token is too short")
  .max(4096, "Device token is too long")
  .regex(tokenPattern, "Invalid device token format");

export const safeTextSchema = (maxLength: number, fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} is too long`);

export const optionalSafeTextSchema = (maxLength: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().max(maxLength, "Text is too long").optional());
