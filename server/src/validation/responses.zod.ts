import { z } from "zod";

export const submitResponseSchema = {
  body: z.object({
    eventId: z.string().min(1),
    status: z.enum(["OK", "HELP"]),
    notes: z.string().optional(),
  }),
};
