import { z } from "zod";

export const triggerAlertSchema = {
  body: z.object({
    areaId: z.string().min(1),
  }),
};
