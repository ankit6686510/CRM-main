import { Router } from "express";
import { testEmailOpen, getTrackingUrl } from "../controllers/test.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/email-open/:campaignId").post(authenticate, testEmailOpen);
router.route("/tracking-url/:campaignId").get(authenticate, getTrackingUrl);

export default router;
