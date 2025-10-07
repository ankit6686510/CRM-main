import { Router } from "express";
import { trackEmailOpen, trackEmailClick, viewEmailOnline, handleFeedback } from "../controllers/tracking.controller.js";

const router = Router();

// Email tracking routes (no authentication needed)
router.route("/open/:messageId").get(trackEmailOpen);
router.route("/click/:messageId").get(trackEmailClick);

// Additional tracking routes to counter image blocking
router.route("/email-view/:messageId").get(viewEmailOnline);
router.route("/feedback/:feedback/:messageId").get(handleFeedback);

export default router;
