import { Router } from "express";
import { getEventStatus } from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { getEventStatusSchema } from "../validation/dashboard.zod";

const router = Router();

router.get("/events/:eventId", requireAuth, validate(getEventStatusSchema), getEventStatus);

export default router;
