import { Router } from "express";
import { registerUser, loginUser, refreshToken, logoutUser, getMe, demoLoginUser } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/requireAuth";
import { registerSchema, loginSchema, refreshSchema, logoutSchema, meSchema, demoLoginSchema } from "../validation/auth.zod";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", validate(refreshSchema), refreshToken);
router.post("/demo-login", validate(demoLoginSchema), demoLoginUser);
router.post("/logout", requireAuth, validate(logoutSchema), logoutUser);
router.get("/me", requireAuth, validate(meSchema), getMe);

export default router;
