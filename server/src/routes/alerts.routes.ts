import { Router } from "express";
import { triggerAlert, getAlerts } from "../controllers/alerts.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { triggerAlertSchema } from "../validation/alerts.zod";

const router = Router();

router.post(
  "/trigger",
  requireAuth,
  validate(triggerAlertSchema),
  triggerAlert,
);
router.get("/", requireAuth, getAlerts);

export default router;
