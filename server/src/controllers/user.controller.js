import { Campaign } from "../models/campaign.model.js";
import { Segment } from "../models/segment.model.js";
import { CommunicationLog } from "../models/comunicationLog.model.js";
import { Customer } from "../models/customer.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
// Import the new email service that works with Render (no SMTP port blocking)
import { sendEmail, sendBulkEmails, createEmailTemplate, isValidEmail } from "../utils/emailServiceV2.js";
// Keep the old one as fallback for local development
// import { sendEmail, sendBulkEmails, createEmailTemplate, isValidEmail } from "../utils/emailService.js";

// Helper to build MongoDB query from rules
const buildSegmentQuery = (rules) => {
  // Handle both direct rules object and segment document format
  const segmentRules = rules.rules ? rules : rules.rules;

  const query = {};
  const getFieldPath = (field) => {
    const fieldMap = {
      total_spent: "stats.total_spent",
      order_count: "stats.order_count",
      last_purchase: "stats.last_purchase",
      city: "address.city",
      is_active: "is_active",
    };
    return fieldMap[field] || field;
  };

  const conditions = segmentRules.rules.map((rule) => {
    const fieldPath = getFieldPath(rule.field);
    let value = rule.value;

    // Special handling for last_purchase (convert days to date)
    if (rule.field === "last_purchase") {
      const daysAgo = parseInt(value);
      if (!isNaN(daysAgo)) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        value = date;
      }
    }

    // Special handling for boolean fields
    if (rule.field === "is_active") {
      value = value === "true" || value === true;
    }

    switch (rule.operator) {
      case ">":
        return { [fieldPath]: { $gt: value } };
      case "<":
        return { [fieldPath]: { $lt: value } };
      case ">=":
        return { [fieldPath]: { $gte: value } };
      case "<=":
        return { [fieldPath]: { $lte: value } };
      case "==":
        return { [fieldPath]: { $eq: value } };
      case "!=":
        return { [fieldPath]: { $ne: value } };
      case "contains":
        return { [fieldPath]: { $regex: value, $options: "i" } };
      default:
        return {};
    }
  });

  if (segmentRules.combinator === "and" || segmentRules.condition === "AND") {
    query.$and = conditions;
  } else {
    query.$or = conditions;
  }

  return query;
};

// Create segment
const createSegment = asyncHandler(async (req, res) => {
  const { name, description, rules } = req.body;

  // 1. Validate input
  if (!name || !rules?.rules || rules.rules.length === 0) {
    throw new ApiError(400, "Name and at least one rule are required");
  }

  // 2. Build query and estimate count
  const query = buildSegmentQuery(rules);
  const estimatedCount = await Customer.countDocuments(query);

  // 3. Create segment linked to authenticated user
  const segment = await Segment.create({
    name,
    description,
    rules,
    estimated_count: estimatedCount,
    created_by: req.user._id,
    is_dynamic: true,
  });

  res
    .status(201)
    .json(new ApiResponse(201, segment, "Segment created successfully"));
});

// Get segments for current user
const getUserSegments = asyncHandler(async (req, res) => {
  const segments = await Segment.find({ created_by: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  // Transform the rules for better frontend display
  const transformedSegments = segments.map(segment => ({
    ...segment,
    rules: {
      condition: segment.rules.condition,
      rules: segment.rules.rules.map((rule) => ({
        field: rule.field,
        operator: rule.operator,
        value: rule.value,
        value_type: rule.value_type,
      })),
    },
  }));

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        transformedSegments,
        "Segments fetched successfully"
      )
    );
});

// Estimate segment size
const estimateSegment = asyncHandler(async (req, res) => {
  const { rules } = req.body;

  if (!rules?.rules || rules.rules.length === 0) {
    throw new ApiError(400, "At least one rule is required");
  }

  const query = buildSegmentQuery(rules);

  const count = await Customer.countDocuments(query);

  res
    .status(200)
    .json(new ApiResponse(200, { count }, "Segment estimated successfully"));
});

// Create campaign
const createCampaign = asyncHandler(async (req, res) => {
  const { name, segmentId, template } = req.body;

  // 1. Validate input
  if (!name || !segmentId || !template?.subject || !template?.body) {
    throw new ApiError(400, "Name, segment ID, and template are required");
  }

  // 2. Check if user has configured email settings
  const user = await User.findById(req.user._id);
  if (!user.emailConfig || !user.emailConfig.isConfigured) {
    throw new ApiError(400, "Email configuration required. Please configure your email settings before creating campaigns.");
  }

  // 2. Verify segment belongs to user and has rules
  const segment = await Segment.findOne({
    _id: segmentId,
    created_by: req.user._id,
  });

  if (!segment) {
    throw new ApiError(404, "Segment not found or access denied");
  }

  if (!segment.rules || segment.rules.rules.length === 0) {
    throw new ApiError(400, "Segment has no rules defined");
  }

  // 3. Verify the segment actually matches customers
  const query = buildSegmentQuery(segment.rules);
  const customerCount = await Customer.countDocuments(query);

  if (customerCount === 0) {
    throw new ApiError(
      400,
      "Segment matches 0 customers - cannot create campaign"
    );
  }

  // 4. Create campaign with accurate initial count
  const campaign = await Campaign.create({
    name,
    segment_id: segmentId,
    template,
    created_by: req.user._id,
    status: "draft",
    stats: {
      total_recipients: customerCount, // Use actual count from query
    },
  });

  // 5. Start background processing (non-blocking) - Fast response like before
  processCampaignInBackground(campaign._id).catch(error => {
    console.error("❌ Background campaign processing failed:", error);
    Campaign.findByIdAndUpdate(campaign._id, {
      status: "failed",
      "stats.failure_reason": error.message,
    }).catch(err => console.error("Failed to update campaign status:", err));
  });

  res
    .status(201)
    .json(new ApiResponse(201, campaign, "Campaign created successfully"));
});

// Get user's campaigns
const getUserCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find({ created_by: req.user._id })
    .populate("segment_id", "name estimated_count")
    .sort("-created_at");

  res
    .status(200)
    .json(new ApiResponse(200, campaigns, "Campaigns fetched successfully"));
});

// Delivery Receipt API
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { message_id, status, timestamp } = req.body;

  if (!message_id || !status) {
    throw new ApiError(400, "Message ID and status are required");
  }

  const log = await CommunicationLog.findOne({ message_id });
  if (!log) {
    throw new ApiError(404, "Communication log not found");
  }

  // Update status and relevant timestamp
  const update = { status };
  switch (status) {
    case "delivered":
      update.delivered_at = timestamp || new Date();
      break;
    case "opened":
      update.opened_at = timestamp || new Date();
      break;
    case "clicked":
      update.clicked_at = timestamp || new Date();
      break;
  }

  await CommunicationLog.findByIdAndUpdate(log._id, update);

  res.status(200).json(new ApiResponse(200, null, "Delivery status updated successfully"));
});

// Immediate campaign processing (like before deployment) - Simple and Fast
const processCampaignImmediately = async (campaignId) => {
  try {
    console.log(`📧 Processing campaign immediately: ${campaignId}`);
    
    const campaign = await Campaign.findById(campaignId)
      .populate("segment_id")
      .populate("created_by");

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // 1. Get customers matching segment
    const query = buildSegmentQuery(campaign.segment_id.rules);
    const customers = await Customer.find(query).lean();
    console.log(`👥 Found ${customers.length} customers for campaign`);

    // 2. Prepare email data
    const emailList = customers
      .filter(customer => isValidEmail(customer.email))
      .map(customer => ({
        email: customer.email,
        name: customer.name,
        total_spent: customer.stats?.total_spent || 0,
        orders_count: customer.stats?.order_count || 0,
        city: customer.address?.city || '',
        phone: customer.phone || ''
      }));

    console.log(`📧 Sending to ${emailList.length} valid emails`);

    // 3. Send emails using bulk method (like before)
    let personalizedHtml = campaign.template.body;
    let personalizedText = campaign.template.body;

    const emailResults = await sendBulkEmails(
      emailList,
      campaign.template.subject,
      personalizedHtml,
      personalizedText,
      campaign.created_by.emailConfig.smtpUser,
      campaign.created_by.emailConfig.fromName,
      campaign.created_by.emailConfig
    );

    // 4. Create communication logs for all emails
    const logPromises = customers.map((customer) => {
      const message_id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${customer._id}`;
      const isValidEmailAddr = isValidEmail(customer.email);
      const wasSuccessful = isValidEmailAddr && emailResults.sent > 0;
      
      return CommunicationLog.create({
        campaign_id: campaign._id,
        customer_id: customer._id,
        status: wasSuccessful ? "delivered" : "failed",
        message_id,
        sent_at: new Date(),
        delivered_at: wasSuccessful ? new Date() : null,
        failure_reason: !isValidEmailAddr ? `Invalid email: ${customer.email}` : 
                       !wasSuccessful ? "Email sending failed" : null
      });
    });

    await Promise.allSettled(logPromises);

    // 5. Update campaign to completed status immediately
    await Campaign.findByIdAndUpdate(campaignId, {
      status: "completed",
      "stats.sent": emailResults.sent,
      "stats.failed": emailResults.failed + (customers.length - emailList.length),
      "stats.delivered": emailResults.sent,
      "stats.total_recipients": customers.length,
      "stats.delivery_rate": customers.length > 0 ? (emailResults.sent / customers.length) * 100 : 0,
      "stats.open_rate": 0,
      "stats.click_rate": 0
    });

    console.log(`✅ Campaign completed immediately: ${emailResults.sent} sent, ${emailResults.failed} failed`);

  } catch (error) {
    console.error("❌ Immediate campaign processing failed:", error);
    throw error;
  }
};

// Simple and Fast Background Processing (like before deployment)
const processCampaignInBackground = async (campaignId) => {
  try {
    console.log(`📧 Processing campaign: ${campaignId}`);
    
    const campaign = await Campaign.findById(campaignId)
      .populate("segment_id")
      .populate("created_by");

    if (!campaign) {
      console.error(`❌ Campaign not found: ${campaignId}`);
      return;
    }

    // 1. Get customers matching segment
    const query = buildSegmentQuery(campaign.segment_id.rules);
    const customers = await Customer.find(query).lean();
    console.log(`👥 Found ${customers.length} customers`);

    // 2. Prepare email data
    const emailList = customers
      .filter(customer => isValidEmail(customer.email))
      .map(customer => ({
        email: customer.email,
        name: customer.name,
        total_spent: customer.stats?.total_spent || 0,
        orders_count: customer.stats?.order_count || 0,
        city: customer.address?.city || '',
        phone: customer.phone || ''
      }));

    console.log(`📧 Sending to ${emailList.length} valid emails`);

    // 3. Update campaign to processing
    await Campaign.findByIdAndUpdate(campaignId, {
      status: "processing",
      "stats.total_recipients": customers.length
    });

    // 4. Send emails using bulk method (fast like before)
    const emailResults = await sendBulkEmails(
      emailList,
      campaign.template.subject,
      campaign.template.body,
      campaign.template.body,
      campaign.created_by.emailConfig.smtpUser,
      campaign.created_by.emailConfig.fromName,
      campaign.created_by.emailConfig
    );

    // 5. Create communication logs
    const logPromises = customers.map((customer) => {
      const message_id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${customer._id}`;
      const isValidEmailAddr = isValidEmail(customer.email);
      const wasSuccessful = isValidEmailAddr && emailResults.sent > 0;
      
      return CommunicationLog.create({
        campaign_id: campaign._id,
        customer_id: customer._id,
        status: wasSuccessful ? "delivered" : "failed",
        message_id,
        sent_at: new Date(),
        delivered_at: wasSuccessful ? new Date() : null,
        failure_reason: !isValidEmailAddr ? `Invalid email: ${customer.email}` : 
                       !wasSuccessful ? "Email sending failed" : null
      });
    });

    await Promise.allSettled(logPromises);

    // 6. Update campaign to completed (fast like before)
    await Campaign.findByIdAndUpdate(campaignId, {
      status: "completed",
      "stats.sent": emailResults.sent,
      "stats.failed": emailResults.failed + (customers.length - emailList.length),
      "stats.delivered": emailResults.sent,
      "stats.total_recipients": customers.length,
      "stats.delivery_rate": customers.length > 0 ? (emailResults.sent / customers.length) * 100 : 0,
      "stats.open_rate": 0,
      "stats.click_rate": 0
    });

    console.log(`✅ Campaign completed: ${emailResults.sent} sent, ${emailResults.failed} failed`);

  } catch (error) {
    console.error("❌ Campaign processing failed:", error);
    await Campaign.findByIdAndUpdate(campaignId, {
      status: "failed",
      "stats.failure_reason": error.message,
    }).catch(err => console.error("Failed to update campaign:", err));
  }
};

const getCommuniactionLog = asyncHandler(async (req, res) => {
  const { campaignId } = req.query;

  if (!campaignId) {
    throw new ApiError(400, "Campaign ID is required");
  }

  const logs = await CommunicationLog.find({ campaign_id: campaignId })
    .populate({
      path: "customer_id",
      select: "name email phone address",
      model: Customer,
    })
    .sort({ sent_at: -1 });

  // Transform the data to flatten customer info
  const transformedLogs = logs.map((log) => {
    const logObj = log.toObject();
    return {
      ...logObj,
      customer: logObj.customer_id,
      customer_id: undefined, // Remove the nested customer_id
    };
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        transformedLogs,
        "Communication logs fetched successfully"
      )
    );
});

// Get detailed segment preview
const getSegmentPreview = asyncHandler(async (req, res) => {
  const { rules } = req.body;

  if (!rules?.rules || rules.rules.length === 0) {
    throw new ApiError(400, "At least one rule is required");
  }

  const query = buildSegmentQuery(rules);

  // Get total count
  const totalCount = await Customer.countDocuments(query);

  // Get sample customers (up to 5)
  const sampleCustomers = await Customer.find(query)
    .select('name email stats demographics address')
    .limit(5)
    .lean();

  // Get gender distribution
  const genderDistribution = await Customer.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$demographics.gender",
        count: { $sum: 1 }
      }
    }
  ]);

  // Get age group distribution
  const ageGroups = await Customer.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $lt: ["$demographics.age", 18] }, then: "Under 18" },
              { case: { $lt: ["$demographics.age", 25] }, then: "18-24" },
              { case: { $lt: ["$demographics.age", 35] }, then: "25-34" },
              { case: { $lt: ["$demographics.age", 45] }, then: "35-44" },
              { case: { $lt: ["$demographics.age", 55] }, then: "45-54" },
              { case: { $lt: ["$demographics.age", 65] }, then: "55-64" }
            ],
            default: "65+"
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get occupation distribution
  const occupationDistribution = await Customer.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$demographics.occupation",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  // Get city distribution
  const cityDistribution = await Customer.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$address.city",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  // Get spending statistics
  const spendingStats = await Customer.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgSpent: { $avg: "$stats.total_spent" },
        maxSpent: { $max: "$stats.total_spent" },
        minSpent: { $min: "$stats.total_spent" },
        totalSpent: { $sum: "$stats.total_spent" }
      }
    }
  ]);

  // Get activity statistics
  const activityStats = await Customer.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgOrders: { $avg: "$stats.order_count" },
        activeCustomers: {
          $sum: { $cond: [{ $eq: ["$is_active", true] }, 1, 0] }
        }
      }
    }
  ]);

  // Get purchase frequency distribution
  const purchaseFrequency = await Customer.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $eq: ["$stats.order_count", 0] }, then: "No Orders" },
              { case: { $lte: ["$stats.order_count", 1] }, then: "1 Order" },
              { case: { $lte: ["$stats.order_count", 3] }, then: "2-3 Orders" },
              { case: { $lte: ["$stats.order_count", 5] }, then: "4-5 Orders" }
            ],
            default: "5+ Orders"
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      totalCount,
      sampleCustomers,
      demographics: {
        gender: genderDistribution.map(d => ({ gender: d._id || 'Unknown', count: d.count })),
        ageGroups: ageGroups.map(a => ({ ageGroup: a._id, count: a.count })),
        occupation: occupationDistribution.map(o => ({ occupation: o._id || 'Unknown', count: o.count }))
      },
      cityDistribution: cityDistribution.map(c => ({ city: c._id || 'Unknown', count: c.count })),
      spendingStats: spendingStats[0] || {
        avgSpent: 0,
        maxSpent: 0,
        minSpent: 0,
        totalSpent: 0
      },
      activityStats: activityStats[0] || {
        avgOrders: 0,
        activeCustomers: 0
      },
      purchaseFrequency: purchaseFrequency.map(p => ({ frequency: p._id, count: p.count }))
    }, "Segment preview generated successfully")
  );
});

// Delete campaign
const deleteCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  if (!campaignId) {
    throw new ApiError(400, "Campaign ID is required");
  }

  // Find campaign and verify ownership
  const campaign = await Campaign.findOne({
    _id: campaignId,
    created_by: req.user._id
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found or access denied");
  }

  // Delete associated communication logs
  await CommunicationLog.deleteMany({ campaign_id: campaignId });

  // Delete the campaign
  await Campaign.findByIdAndDelete(campaignId);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Campaign deleted successfully"));
});

// Get user's email settings (updated for new email service format)
const getEmailSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('emailConfig');
  
  // Return new email service configuration format
  const emailConfig = user.emailConfig ? {
    // Legacy SMTP fields (for backward compatibility)
    smtpHost: user.emailConfig.smtpHost,
    smtpPort: user.emailConfig.smtpPort,
    smtpUser: user.emailConfig.smtpUser,
    fromName: user.emailConfig.fromName,
    
    // New email service fields
    emailService: user.emailConfig.emailService || "gmail",
    googleAccessToken: user.emailConfig.googleAccessToken || "",
    sendgridApiKey: user.emailConfig.sendgridApiKey || "",
    resendApiKey: user.emailConfig.resendApiKey || "",
    brevoApiKey: user.emailConfig.brevoApiKey || "",
    preferredService: user.emailConfig.preferredService || "gmail",
    
    isConfigured: user.emailConfig.isConfigured || false
  } : {
    // Default values for new users
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    fromName: "",
    emailService: "gmail",
    googleAccessToken: "",
    sendgridApiKey: "",
    resendApiKey: "",
    brevoApiKey: "",
    preferredService: "gmail",
    isConfigured: false
  };

  res
    .status(200)
    .json(new ApiResponse(200, emailConfig, "Email settings fetched successfully"));
});

// Update user's email settings (updated for new email service format)
const updateEmailSettings = asyncHandler(async (req, res) => {
  const { 
    // Common fields
    smtpUser, 
    fromName, 
    emailService,
    preferredService,
    
    // Legacy SMTP fields (for backward compatibility)
    smtpHost, 
    smtpPort, 
    smtpPassword,
    
    // New API service fields
    googleAccessToken,
    sendgridApiKey,
    resendApiKey,
    brevoApiKey,
    
    isConfigured
  } = req.body;

  // Validate required common fields
  if (!smtpUser || !fromName) {
    throw new ApiError(400, "Email and company name are required");
  }

  // Validate email format
  if (!isValidEmail(smtpUser)) {
    throw new ApiError(400, "Invalid email format");
  }

  // Validate that at least one service is configured
  const hasGmail = googleAccessToken || smtpPassword;
  const hasSendGrid = sendgridApiKey;
  const hasResend = resendApiKey;
  const hasBrevo = brevoApiKey;
  
  if (!hasGmail && !hasSendGrid && !hasResend && !hasBrevo) {
    throw new ApiError(400, "Please configure at least one email service");
  }

  // Build email configuration object
  const emailConfig = {
    // Common fields
    smtpUser,
    fromName,
    emailService: emailService || "gmail",
    preferredService: preferredService || emailService || "gmail",
    
    // Legacy SMTP fields (keep for backward compatibility)
    smtpHost: smtpHost || "smtp.gmail.com",
    smtpPort: smtpPort ? parseInt(smtpPort) : 587,
    smtpPassword: smtpPassword || "", // For SMTP fallback
    
    // New API service fields
    googleAccessToken: googleAccessToken || "",
    sendgridApiKey: sendgridApiKey || "",
    resendApiKey: resendApiKey || "",
    brevoApiKey: brevoApiKey || "",
    
    // Status
    isConfigured: isConfigured !== undefined ? isConfigured : true,
    lastTestedAt: new Date(),
    isWorking: true
  };

  // Update user's email configuration
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { emailConfig },
    { new: true }
  ).select('emailConfig');

  // Return config without sensitive data
  const responseConfig = {
    smtpUser: user.emailConfig.smtpUser,
    fromName: user.emailConfig.fromName,
    emailService: user.emailConfig.emailService,
    preferredService: user.emailConfig.preferredService,
    isConfigured: user.emailConfig.isConfigured,
    
    // Return boolean flags instead of actual keys for security
    hasGoogleToken: !!user.emailConfig.googleAccessToken,
    hasSendGridKey: !!user.emailConfig.sendgridApiKey,
    hasResendKey: !!user.emailConfig.resendApiKey,
    hasBrevoKey: !!user.emailConfig.brevoApiKey
  };

  res
    .status(200)
    .json(new ApiResponse(200, responseConfig, "Email settings updated successfully"));
});

// Refresh campaign stats from communication logs
const refreshCampaignStats = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  // Find campaign and verify ownership
  const campaign = await Campaign.findOne({
    _id: campaignId,
    created_by: req.user._id
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found or access denied");
  }

  // Calculate real stats from communication logs
  const sentCount = await CommunicationLog.countDocuments({ 
    campaign_id: campaign._id, 
    status: { $in: ['sent', 'delivered', 'opened', 'clicked'] }
  });
  
  const deliveredCount = await CommunicationLog.countDocuments({ 
    campaign_id: campaign._id, 
    $or: [
      { delivered_at: { $exists: true } },
      { status: { $in: ['delivered', 'opened', 'clicked'] } }
    ]
  });
  
  const openedCount = await CommunicationLog.countDocuments({ 
    campaign_id: campaign._id, 
    $or: [
      { opened_at: { $exists: true } },
      { status: { $in: ['opened', 'clicked'] } }
    ]
  });
  
  const clickedCount = await CommunicationLog.countDocuments({ 
    campaign_id: campaign._id, 
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

  console.log(`📊 Campaign stats refreshed: ${sentCount} sent, ${openedCount} opened, ${clickedCount} clicked`);

  res
    .status(200)
    .json(new ApiResponse(200, campaign, "Campaign stats refreshed successfully"));
});

export {
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
};
