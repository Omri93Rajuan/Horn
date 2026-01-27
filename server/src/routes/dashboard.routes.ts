import { Router } from "express";
import { getEventStatus } from "../controllers/dashboard.controller";
import { getCommanderActiveHandler, getCommanderOverviewHandler } from "../controllers/commander.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { getEventStatusSchema } from "../validation/dashboard.zod";

const router = Router();

router.get("/events/:eventId", requireAuth, validate(getEventStatusSchema), getEventStatus);
router.get("/commander/overview", requireAuth, getCommanderOverviewHandler);
router.get("/commander/active", requireAuth, getCommanderActiveHandler);

export default router;
