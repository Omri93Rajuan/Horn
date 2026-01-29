import { Router } from "express";
import { registerDevice, getTeamMembers } from "../controllers/users.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { registerDeviceSchema } from "../validation/users.zod";

const router = Router();

router.post("/register-device", requireAuth, validate(registerDeviceSchema), registerDevice);
router.get("/team", requireAuth, getTeamMembers);

export default router;
