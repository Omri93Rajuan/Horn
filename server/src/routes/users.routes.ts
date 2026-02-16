import { Router } from "express";
import { registerDevice, getTeamMembers, updateProfile } from "../controllers/users.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { registerDeviceSchema, updateProfileSchema } from "../validation/users.zod";

const router = Router();

router.post("/register-device", requireAuth, validate(registerDeviceSchema), registerDevice);
router.get("/team", requireAuth, getTeamMembers);
router.patch("/me", requireAuth, validate(updateProfileSchema), updateProfile);

export default router;
