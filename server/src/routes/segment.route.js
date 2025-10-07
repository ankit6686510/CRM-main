import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createSegment,
  deleteSegment,
  getSegmentById,
  getSegments,
  updateSegment,
  createCampaign,
  getCampaigns,
  getCampaignById,
} from "../controllers/segment.controller.js";

const router = Router();

router.route("/create-segment").post(authenticate, createSegment);

router.route("/get-segment").get(authenticate, getSegments);

router.route("/get-segment/:id").get(authenticate, getSegmentById);

router.route("/update-segment/:id").put(authenticate, updateSegment);

router.route("/delete-segment/:id").delete(authenticate, deleteSegment);

// Campaign routes
router.route("/:segmentId/campaigns").post(authenticate, createCampaign);
router.route("/campaigns").get(authenticate, getCampaigns);
router.route("/campaigns/:id").get(authenticate, getCampaignById);

export default router;
