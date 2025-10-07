import redisService from '../config/redis.js';

// Get queue statistics
export const getQueueStats = async (req, res) => {
  try {
    const queueNames = ['customer.jobs', 'order.jobs', 'campaign.jobs'];
    const stats = {};

    for (const queueName of queueNames) {
      stats[queueName] = await redisService.getQueueStats(queueName);
    }

    // Get Redis health status
    const healthStatus = await redisService.healthCheck();

    res.status(200).json({
      success: true,
      data: {
        queues: stats,
        redis: healthStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queue statistics',
      error: error.message
    });
  }
};

// Get specific queue details
export const getQueueDetails = async (req, res) => {
  try {
    const { queueName } = req.params;
    
    if (!queueName) {
      return res.status(400).json({
        success: false,
        message: 'Queue name is required'
      });
    }

    const stats = await redisService.getQueueStats(queueName);
    
    res.status(200).json({
      success: true,
      data: {
        queueName,
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Failed to get details for queue ${req.params.queueName}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to retrieve details for queue ${req.params.queueName}`,
      error: error.message
    });
  }
};

// Manual job submission (for testing)
export const submitTestJob = async (req, res) => {
  try {
    const { queueName, jobType, jobData } = req.body;

    if (!queueName || !jobType) {
      return res.status(400).json({
        success: false,
        message: 'Queue name and job type are required'
      });
    }

    await redisService.addToQueue(queueName, {
      type: jobType,
      data: jobData || {},
      submittedBy: req.user?._id || 'manual',
      submittedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: `Test job submitted to ${queueName}`,
      data: {
        queueName,
        jobType,
        submittedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to submit test job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit test job',
      error: error.message
    });
  }
};

// Get Redis health status
export const getRedisHealth = async (req, res) => {
  try {
    const health = await redisService.healthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Publish test event (for testing pub-sub)
export const publishTestEvent = async (req, res) => {
  try {
    const { channel, eventType, eventData } = req.body;

    if (!channel || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'Channel and event type are required'
      });
    }

    await redisService.publish(channel, {
      type: eventType,
      data: eventData || {},
      publishedBy: req.user?._id || 'manual',
      publishedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: `Event published to ${channel}`,
      data: {
        channel,
        eventType,
        publishedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to publish test event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish test event',
      error: error.message
    });
  }
};

// Get overall system status
export const getSystemStatus = async (req, res) => {
  try {
    // Get Redis health
    const redisHealth = await redisService.healthCheck();
    
    // Get queue stats
    const queueNames = ['customer.jobs', 'order.jobs', 'campaign.jobs'];
    const queueStats = {};
    
    for (const queueName of queueNames) {
      queueStats[queueName] = await redisService.getQueueStats(queueName);
    }
    
    // Calculate totals
    const totalPending = Object.values(queueStats).reduce((sum, stats) => sum + stats.pending, 0);
    const totalFailed = Object.values(queueStats).reduce((sum, stats) => sum + stats.failed, 0);
    const totalJobs = Object.values(queueStats).reduce((sum, stats) => sum + stats.total, 0);
    
    const systemStatus = {
      redis: redisHealth,
      queues: {
        total: queueNames.length,
        stats: queueStats,
        summary: {
          totalJobs,
          totalPending,
          totalFailed,
          successRate: totalJobs > 0 ? ((totalJobs - totalFailed) / totalJobs * 100).toFixed(2) + '%' : '100%'
        }
      },
      consumers: {
        customer: 'running', // This could be dynamic based on actual consumer status
        // Add other consumers as they're implemented
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: systemStatus
    });
  } catch (error) {
    console.error('Failed to get system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system status',
      error: error.message
    });
  }
};
