import { z } from "zod";

export const triggerAlertSchema = {
  body: z.object({
    areaId: z.string().min(1),
  }),
};

export const closeAlertSchema = {
  body: z.object({
    eventId: z.string().min(1),
    reason: z.string().optional(),
  }),
};
