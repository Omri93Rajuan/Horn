import { z } from "zod";
import {
  eventIdSchema,
  normalizedAreaSchema,
  optionalSafeTextSchema,
} from "./common.zod";

export const triggerAlertSchema = {
  body: z
    .object({
      areaId: normalizedAreaSchema,
    })
    .strict(),
};

export const closeAlertSchema = {
  body: z
    .object({
      eventId: eventIdSchema,
      reason: optionalSafeTextSchema(280),
    })
    .strict(),
};

export const runDemoScenarioSchema = {
  body: z
    .object({
      areaId: normalizedAreaSchema.optional(),
    })
    .strict(),
};
