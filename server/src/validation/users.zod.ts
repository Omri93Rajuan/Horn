import { z } from "zod";
import {
  deviceTokenSchema,
  normalizedAreaSchema,
  normalizedNameSchema,
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
