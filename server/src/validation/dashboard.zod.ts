import { z } from "zod";

export const getEventStatusSchema = {
  params: z.object({
    eventId: z.string().min(1),
  }),
};
