import { z } from "zod";
import { eventIdSchema } from "./common.zod";

export const getEventStatusSchema = {
  params: z
    .object({
      eventId: eventIdSchema,
    })
    .strict(),
};
