import { CommunicationLog } from "../models/comunicationLog.model.js";
import { Campaign } from "../models/campaign.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Test endpoint to manually trigger email open (for testing)
const testEmailOpen = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  // Get the first communication log for this campaign
  const log = await CommunicationLog.findOne({ campaign_id: campaignId }).sort({ sent_at: -1 });
  
  if (!log) {
    return res.status(404).json(new ApiResponse(404, null, "No communication log found for this campaign"));
  }

  // Simulate email open
  if (!log.opened_at) {
    await CommunicationLog.findByIdAndUpdate(log._id, {
      opened_at: new Date(),
      status: 'opened'
    });
    
    console.log(`🧪 TEST: Simulated email open for message: ${log.message_id}`);
  }

  // Recalculate campaign stats
  const campaign = await Campaign.findById(campaignId);
  
  const sentCount = await CommunicationLog.countDocuments({ 
    campaign_id: campaignId, 
    status: { $in: ['sent', 'delivered', 'opened', 'clicked'] }
  });
  
  const deliveredCount = await CommunicationLog.countDocuments({ 
    campaign_id: campaignId, 
    $or: [
      { delivered_at: { $exists: true } },
      { status: { $in: ['delivered', 'opened', 'clicked'] } }
    ]
  });
  
  const openedCount = await CommunicationLog.countDocuments({ 
    campaign_id: campaignId, 
    $or: [
      { opened_at: { $exists: true } },
      { status: { $in: ['opened', 'clicked'] } }
    ]
  });
  
  const clickedCount = await CommunicationLog.countDocuments({ 
    campaign_id: campaignId, 
    $or: [
      { clicked_at: { $exists: true } },
      { status: 'clicked' }
    ]
  });

  // Update campaign stats
  campaign.stats.sent = sentCount;
  campaign.stats.delivered = deliveredCount;
  campaign.stats.opened = openedCount;
  campaign.stats.clicked = clickedCount;
  campaign.stats.delivery_rate = campaign.stats.total_recipients > 0 ? (deliveredCount / campaign.stats.total_recipients) * 100 : 0;
  campaign.stats.open_rate = deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0;
  campaign.stats.click_rate = openedCount > 0 ? (clickedCount / openedCount) * 100 : 0;
  
  await campaign.save();

  console.log(`📊 Updated campaign stats: ${sentCount} sent, ${openedCount} opened, ${clickedCount} clicked`);

  res.status(200).json(new ApiResponse(200, {
    message: "Email open simulated successfully",
    stats: {
      sent: sentCount,
      delivered: deliveredCount,
      opened: openedCount,
      clicked: clickedCount,
      openRate: campaign.stats.open_rate,
      clickRate: campaign.stats.click_rate
    }
  }, "Test completed successfully"));
});

// Get tracking pixel URL for a campaign (for testing)
const getTrackingUrl = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  // Get the first communication log for this campaign
  const log = await CommunicationLog.findOne({ campaign_id: campaignId }).sort({ sent_at: -1 });
  
  if (!log) {
    return res.status(404).json(new ApiResponse(404, null, "No communication log found for this campaign"));
  }

  const trackingUrls = {
    openTrackingUrl: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/track/open/${log.message_id}`,
    clickTrackingUrl: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/track/click/${log.message_id}?url=https://google.com`,
    messageId: log.message_id,
    customerEmail: log.customer_id,
    status: log.status,
    sentAt: log.sent_at,
    openedAt: log.opened_at,
    clickedAt: log.clicked_at
  };

  res.status(200).json(new ApiResponse(200, trackingUrls, "Tracking URLs fetched successfully"));
});

export { testEmailOpen, getTrackingUrl };
