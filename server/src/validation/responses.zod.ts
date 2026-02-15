import { z } from "zod";
import { eventIdSchema, optionalSafeTextSchema } from "./common.zod";

export const submitResponseSchema = {
  body: z
    .object({
      eventId: eventIdSchema,
      status: z.enum(["OK", "HELP"]),
      notes: optionalSafeTextSchema(500),
    })
    .strict(),
};
