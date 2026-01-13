import { Router } from "express";
import { submitResponse } from "../controllers/responses.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { submitResponseSchema } from "../validation/responses.zod";

const router = Router();

router.post("/", requireAuth, validate(submitResponseSchema), submitResponse);

export default router;
