import { z } from "zod";
import {
  normalizedAreaSchema,
  normalizedEmailSchema,
  normalizedNameSchema,
  optionalPhoneSchema,
  strongPasswordSchema,
} from "./common.zod";

export const registerSchema = {
  body: z
    .object({
      email: normalizedEmailSchema,
      password: strongPasswordSchema,
      name: normalizedNameSchema,
      phone: optionalPhoneSchema,
      areaId: normalizedAreaSchema.optional(),
    })
    .strict(),
};

export const loginSchema = {
  body: z
    .object({
      email: normalizedEmailSchema,
      password: z.string().min(1, "Password is required").max(72, "Password is too long"),
    })
    .strict(),
};

export const refreshSchema = {
  body: z
    .object({
      refreshToken: z.string().trim().min(1, "Refresh token is required").max(4096, "Invalid refresh token"),
    })
    .strict(),
};

export const logoutSchema = {
  body: z.object({}).strict(),
};

export const meSchema = {
  query: z.object({}).strict(),
};

export const demoLoginSchema = {
  body: z.object({}).strict(),
};
