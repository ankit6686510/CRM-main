import { Segment } from "../models/segment.model.js";
import { Customer } from "../models/customer.model.js";
import { Campaign } from "../models/campaign.model.js";
import { CommunicationLog } from "../models/comunicationLog.model.js";
import { vendorAPI } from "./vendor.controller.js";
import { addJob } from "../config/redis.js";

const createSegment = async (req, res) => {
  try {
    const { name, description, rules, tags } = req.body;

    // Create new segment
    const segment = await Segment.create({
      name,
      description,
      rules,
      tags,
      created_by: req.user._id,
    });

    // Calculate initial stats
    const stats = await calculateSegmentStats(segment);
    segment.stats = stats;
    await segment.save();

    return res.status(201).json({
      success: true,
      message: "Segment created successfully",
      data: segment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create segment",
      error: error.message,
    });
  }
};

const getSegments = async (req, res) => {
  try {
    const segments = await Segment.find({ created_by: req.user._id, is_active: true })
      .sort({ createdAt: -1 })
      .populate("created_by", "name email");

    return res.status(200).json({
      success: true,
      message: "Segments fetched successfully",
      data: segments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch segments",
      error: error.message,
    });
  }
};

const getSegmentById = async (req, res) => {
  try {
    const segment = await Segment.findOne({
      _id: req.params.id,
      created_by: req.user._id,
      is_active: true,
    }).populate("created_by", "name email");

    if (!segment) {
      return res.status(404).json({
        success: false,
        message: "Segment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Segment fetched successfully",
      data: segment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch segment",
      error: error.message,
    });
  }
};

const updateSegment = async (req, res) => {
  try {
    const { name, description, rules, tags } = req.body;

    const segment = await Segment.findOneAndUpdate(
      {
        _id: req.params.id,
        created_by: req.user._id,
        is_active: true,
      },
      {
        name,
        description,
        rules,
        tags,
      },
      { new: true }
    );

    if (!segment) {
      return res.status(404).json({
        success: false,
        message: "Segment not found",
      });
    }

    // Recalculate stats
    const stats = await calculateSegmentStats(segment);
    segment.stats = stats;
    await segment.save();

    return res.status(200).json({
      success: true,
      message: "Segment updated successfully",
      data: segment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update segment",
      error: error.message,
    });
  }
};

const deleteSegment = async (req, res) => {
  try {
    const segment = await Segment.findOneAndUpdate(
      {
        _id: req.params.id,
        created_by: req.user._id,
        is_active: true,
      },
      { is_active: false },
      { new: true }
    );

    if (!segment) {
      return res.status(404).json({
        success: false,
        message: "Segment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Segment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete segment",
      error: error.message,
    });
  }
};

const calculateSegmentStats = async (segment) => {
  try {
    // Build query based on segment rules
    const query = buildSegmentQuery(segment.rules);
    query.is_active = true;

    // Get total customers
    const totalCustomers = await Customer.countDocuments(query);

    // Get active customers (customers with activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeCustomers = await Customer.countDocuments({
      ...query,
      last_activity: { $gte: thirtyDaysAgo },
    });

    // Calculate average spend
    const customers = await Customer.find(query).select("total_spent");
    const totalSpend = customers.reduce((sum, customer) => sum + (customer.total_spent || 0), 0);
    const averageSpend = totalCustomers > 0 ? totalSpend / totalCustomers : 0;

    // Get last activity
    const lastActivity = await Customer.findOne(query)
      .sort({ last_activity: -1 })
      .select("last_activity");

    return {
      total_customers: totalCustomers,
      active_customers: activeCustomers,
      average_spend: averageSpend,
      last_activity: lastActivity?.last_activity || null,
    };
  } catch (error) {
    console.error("Error calculating segment stats:", error);
    return {
      total_customers: 0,
      active_customers: 0,
      average_spend: 0,
      last_activity: null,
    };
  }
};

const buildSegmentQuery = (rules) => {
  const query = {};

  rules.forEach((rule) => {
    try {
      const parsedRule = JSON.parse(rule);
      const { field, operator, value } = parsedRule;

      switch (operator) {
        case ">":
          query[field] = { $gt: value };
          break;
        case "<":
          query[field] = { $lt: value };
          break;
        case ">=":
          query[field] = { $gte: value };
          break;
        case "<=":
          query[field] = { $lte: value };
          break;
        case "==":
          query[field] = value;
          break;
        case "!=":
          query[field] = { $ne: value };
          break;
        case "contains":
          query[field] = { $regex: value, $options: "i" };
          break;
        case "not_contains":
          query[field] = { $not: { $regex: value, $options: "i" } };
          break;
        case "exists":
          query[field] = { $exists: true };
          break;
        case "not_exists":
          query[field] = { $exists: false };
          break;
      }
    } catch (error) {
      console.error("Error parsing rule:", error);
    }
  });

  return query;
};

// Create and launch campaign for a segment
const createCampaign = async (req, res) => {
  try {
    const { segmentId } = req.params;
    const { name, subject, message, fromName, fromEmail } = req.body;

    // Validate required fields
    if (!name || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Campaign name, subject, and message are required"
      });
    }

    // Find the segment
    const segment = await Segment.findOne({
      _id: segmentId,
      created_by: req.user._id,
      is_active: true,
    });

    if (!segment) {
      return res.status(404).json({
        success: false,
        message: "Segment not found"
      });
    }

    // Get customers for this segment
    const query = buildSegmentQuery(segment.rules);
    query.is_active = true;
    const customers = await Customer.find(query).select('_id name email');

    if (customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No customers found in this segment"
      });
    }

    // Create campaign
    const campaign = await Campaign.create({
      name,
      segment_id: segmentId,
      created_by: req.user._id,
      message_content: {
        subject,
        message,
        from_name: fromName || req.user.name,
        from_email: fromEmail || req.user.email
      },
      audience_size: customers.length,
      status: 'pending'
    });

    console.log(`📢 Campaign "${name}" created for segment "${segment.name}" with ${customers.length} recipients`);

    // Add campaign delivery job to queue (pub-sub architecture)
    await addJob('campaign.jobs', {
      type: 'DELIVER_CAMPAIGN',
      campaignId: campaign._id.toString(),
      segmentId: segmentId,
      customers: customers.map(c => ({
        id: c._id.toString(),
        name: c.name,
        email: c.email
      })),
      messageContent: campaign.message_content,
      userId: req.user._id.toString(),
      userEmail: req.user.email
    });

    console.log(`📋 Campaign delivery job queued: ${campaign._id}`);

    // Return immediate response (202 Accepted - async processing)
    return res.status(202).json({
      success: true,
      message: "Campaign created and queued for delivery",
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          audienceSize: campaign.audience_size,
          status: campaign.status,
          createdAt: campaign.createdAt
        },
        processing: "Campaign is being processed asynchronously",
        estimatedDelivery: `${Math.ceil(customers.length / 10)} minutes`
      }
    });

  } catch (error) {
    console.error('Campaign Creation Error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to create campaign",
      error: error.message,
    });
  }
};

// Get campaigns for user
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ created_by: req.user._id })
      .sort({ createdAt: -1 })
      .populate('segment_id', 'name')
      .populate('created_by', 'name email');

    // Calculate delivery stats for each campaign
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        const stats = await CommunicationLog.aggregate([
          { $match: { campaign_id: campaign._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const deliveryStats = {
          sent: 0,
          failed: 0,
          pending: 0,
          total: campaign.audience_size
        };

        stats.forEach(stat => {
          if (stat._id === 'sent') deliveryStats.sent = stat.count;
          if (stat._id === 'failed') deliveryStats.failed = stat.count;
          if (stat._id === 'pending') deliveryStats.pending = stat.count;
        });

        return {
          ...campaign.toObject(),
          deliveryStats
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Campaigns fetched successfully",
      data: campaignsWithStats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
      error: error.message,
    });
  }
};

// Get campaign by ID with detailed stats
const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      created_by: req.user._id
    })
      .populate('segment_id', 'name description')
      .populate('created_by', 'name email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    // Get detailed delivery logs
    const deliveryLogs = await CommunicationLog.find({ campaign_id: campaign._id })
      .populate('customer_id', 'name email')
      .sort({ createdAt: -1 });

    // Calculate detailed stats
    const stats = await CommunicationLog.aggregate([
      { $match: { campaign_id: campaign._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const deliveryStats = {
      sent: 0,
      failed: 0,
      pending: 0,
      total: campaign.audience_size
    };

    stats.forEach(stat => {
      if (stat._id === 'sent') deliveryStats.sent = stat.count;
      if (stat._id === 'failed') deliveryStats.failed = stat.count;
      if (stat._id === 'pending') deliveryStats.pending = stat.count;
    });

    return res.status(200).json({
      success: true,
      message: "Campaign details fetched successfully",
      data: {
        campaign: campaign.toObject(),
        deliveryStats,
        deliveryLogs
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch campaign details",
      error: error.message,
    });
  }
};

export {
  createSegment,
  getSegments,
  getSegmentById,
  updateSegment,
  deleteSegment,
  createCampaign,
  getCampaigns,
  getCampaignById,
};
