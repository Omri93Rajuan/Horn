import { z } from "zod";

export const registerSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    phone: z.string().optional(),
    areaId: z.string().optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1),
  }),
};

export const logoutSchema = {
  body: z.object({}).strict(),
};

export const meSchema = {
  query: z.object({}).strict(),
};
