import { z } from "zod";

export const registerDeviceSchema = {
  body: z.object({
    areaId: z.string().min(1),
    deviceToken: z.string().min(1),
    name: z.string().min(1).optional(),
  }),
};
