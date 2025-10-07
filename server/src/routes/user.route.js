import { Router } from "express";
import { 
  createCampaign, 
  getUserCampaigns, 
  deleteCampaign,
  createSegment, 
  getUserSegments, 
  estimateSegment,
  getCommuniactionLog,
  getSegmentPreview,
  updateDeliveryStatus,
  getEmailSettings,
  updateEmailSettings,
  refreshCampaignStats
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/create-segment").post(authenticate, createSegment);
router.route("/get-segment").get(authenticate, getUserSegments);
router.route("/estimate-segment").post(authenticate, estimateSegment);
router.route("/preview-segment").post(authenticate, getSegmentPreview);

router.route("/create-campaign").post(authenticate, createCampaign);
router.route("/get-campaign").get(authenticate, getUserCampaigns);
router.route("/delete-campaign/:campaignId").delete(authenticate, deleteCampaign);
router.route("/refresh-campaign-stats/:campaignId").post(authenticate, refreshCampaignStats);

router.route("/get-log").get(authenticate, getCommuniactionLog);

router.route("/delivery-receipt").post(updateDeliveryStatus);

// Email Settings Routes (SaaS Feature)
router.route("/email-settings").get(authenticate, getEmailSettings);
router.route("/email-settings").put(authenticate, updateEmailSettings);

export default router;
