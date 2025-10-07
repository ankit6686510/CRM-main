import { Router } from "express";
import { debugCampaignLogs } from "../controllers/debug.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/campaign-logs/:campaignId").get(authenticate, debugCampaignLogs);

export default router;
