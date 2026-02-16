import { z } from "zod";
import {
  deviceTokenSchema,
  normalizedAreaSchema,
  normalizedNameSchema,
  optionalPhoneSchema,
} from "./common.zod";

export const registerDeviceSchema = {
  body: z
    .object({
      areaId: normalizedAreaSchema,
      deviceToken: deviceTokenSchema,
      name: normalizedNameSchema.optional(),
    })
    .strict(),
};

export const updateProfileSchema = {
  body: z
    .object({
      name: normalizedNameSchema.optional(),
      phone: optionalPhoneSchema,
    })
    .strict()
    .refine((data) => Boolean(data.name || data.phone), {
      message: "No profile fields provided",
    }),
};
