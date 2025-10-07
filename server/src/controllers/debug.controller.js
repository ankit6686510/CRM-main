import { CommunicationLog } from "../models/comunicationLog.model.js";
import { Campaign } from "../models/campaign.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Debug endpoint to check communication logs and message IDs
const debugCampaignLogs = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  // Get campaign
  const campaign = await Campaign.findById(campaignId);
  
  // Get all communication logs for this campaign
  const logs = await CommunicationLog.find({ campaign_id: campaignId })
    .populate('customer_id', 'name email')
    .sort({ sent_at: -1 });

  // Debug info
  const debugInfo = {
    campaign: {
      id: campaign._id,
      name: campaign.name,
      status: campaign.status,
      stats: campaign.stats
    },
    totalLogs: logs.length,
    logs: logs.map(log => ({
      id: log._id,
      message_id: log.message_id,
      customer: log.customer_id,
      status: log.status,
      sent_at: log.sent_at,
      opened_at: log.opened_at,
      clicked_at: log.clicked_at,
      trackingUrls: {
        open: `https://insightcrm.onrender.com/api/track/open/${log.message_id}`,
        click: `https://insightcrm.onrender.com/api/track/click/${log.message_id}?url=https://example.com`
      }
    }))
  };

  res.status(200).json(new ApiResponse(200, debugInfo, "Debug info fetched successfully"));
});

export { debugCampaignLogs };
