import { Router } from "express";
import {
  submitResponse,
  getMyResponses,
} from "../controllers/responses.controller";
import { requireAuth } from "../middlewares/requireAuth";
import { validate } from "../middlewares/validate";
import { submitResponseSchema } from "../validation/responses.zod";

const router = Router();

router.post("/", requireAuth, validate(submitResponseSchema), submitResponse);
router.get("/my", requireAuth, getMyResponses);

export default router;
