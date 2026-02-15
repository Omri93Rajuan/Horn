import { Router } from "express";
import { triggerAlert, getAlerts, getAllAlerts, closeAlert, runDemoScenario } from "../controllers/alerts.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { triggerAlertSchema, closeAlertSchema, runDemoScenarioSchema } from "../validation/alerts.zod";

const router = Router();

router.post(
  "/trigger",
  requireAuth,
  validate(triggerAlertSchema),
  triggerAlert,
);
router.get("/", requireAuth, getAlerts);
router.get("/all", requireAuth, getAllAlerts);
router.post(
  "/close",
  requireAuth,
  validate(closeAlertSchema),
  closeAlert,
);
router.post(
  "/demo/run",
  requireAuth,
  validate(runDemoScenarioSchema),
  runDemoScenario,
);

export default router;
