import { Router } from "express";
import { 
  getQueueStats, 
  getQueueDetails, 
  submitTestJob, 
  getRedisHealth, 
  publishTestEvent, 
  getSystemStatus 
} from "../controllers/queue.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public health check endpoint (no auth required)
router.route("/health").get(getRedisHealth);

// Protected endpoints (require authentication)
router.use(authenticate); // Apply authentication middleware to all routes below

// Queue monitoring routes
router.route("/stats").get(getQueueStats);
router.route("/system-status").get(getSystemStatus);
router.route("/:queueName/details").get(getQueueDetails);

// Testing routes (for development and debugging)
router.route("/test/job").post(submitTestJob);
router.route("/test/event").post(publishTestEvent);

export default router;
