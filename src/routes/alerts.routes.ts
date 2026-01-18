import { Router } from "express";
import { triggerAlert } from "../controllers/alerts.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { triggerAlertSchema } from "../validation/alerts.zod";

const router = Router();

router.post(
  "/trigger",
  requireAuth,
  validate(triggerAlertSchema),
  triggerAlert
);

export default router;
