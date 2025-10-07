import { Router } from "express";
import { 
  sendEmailViaVendor, 
  sendBulkEmailsViaVendor, 
  handleDeliveryReceipt, 
  getVendorStats 
} from "../controllers/vendor.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public webhook endpoint (no auth required - vendors need to call this)
router.route("/delivery-receipt").post(handleDeliveryReceipt);

// Protected vendor API endpoints (require authentication)
router.use(authenticate); // Apply authentication middleware to routes below

// Vendor API simulation endpoints
router.route("/send-email").post(sendEmailViaVendor);
router.route("/send-bulk").post(sendBulkEmailsViaVendor);
router.route("/stats").get(getVendorStats);

export default router;
