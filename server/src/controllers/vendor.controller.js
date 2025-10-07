import { CommunicationLog } from '../models/comunicationLog.model.js';
import fetch from 'node-fetch';

// Simulated vendor API that mimics real-world email delivery services
class VendorAPIService {
  constructor() {
    this.deliveryStats = {
      totalSent: 0,
      successful: 0,
      failed: 0,
      successRate: 0
    };
  }

  // Simulate email delivery with 90% success rate
  async sendEmail(emailData) {
    const { messageId, to, subject, htmlContent, from, campaignId, customerId } = emailData;
    
    try {
      // Simulate network delay (50-200ms)
      await this.simulateDelay(50, 200);
      
      // Simulate 90% success, 10% failure
      const isSuccess = Math.random() < 0.9;
      
      const deliveryResult = {
        messageId,
        vendorMessageId: this.generateVendorMessageId(),
        to,
        status: isSuccess ? 'SENT' : 'FAILED',
        timestamp: new Date().toISOString(),
        failureReason: isSuccess ? null : this.getRandomFailureReason()
      };

      // Update internal stats
      this.updateStats(isSuccess);

      // Simulate async callback to delivery receipt API (after 100-500ms)
      setTimeout(async () => {
        await this.callDeliveryReceiptAPI(deliveryResult, campaignId, customerId);
      }, this.getRandomDelay(100, 500));

      console.log(`📧 Vendor API: Email to ${to} - ${deliveryResult.status} (${deliveryResult.vendorMessageId})`);
      
      return {
        success: true,
        vendorMessageId: deliveryResult.vendorMessageId,
        status: deliveryResult.status,
        estimatedDelivery: isSuccess ? '1-3 minutes' : 'Failed'
      };

    } catch (error) {
      console.error('❌ Vendor API Error:', error);
      
      // Even vendor API errors should trigger callback
      setTimeout(async () => {
        await this.callDeliveryReceiptAPI({
          messageId,
          vendorMessageId: null,
          to,
          status: 'FAILED',
          timestamp: new Date().toISOString(),
          failureReason: 'Vendor API Error: ' + error.message
        }, campaignId, customerId);
      }, 100);

      return {
        success: false,
        error: error.message,
        status: 'FAILED'
      };
    }
  }

  // Simulate batch email sending (for campaign delivery)
  async sendBulkEmails(emailBatch) {
    const results = {
      sent: 0,
      failed: 0,
      total: emailBatch.length,
      details: []
    };

    console.log(`📦 Vendor API: Processing bulk batch of ${emailBatch.length} emails`);

    // Process emails with staggered sending (realistic behavior)
    for (let i = 0; i < emailBatch.length; i++) {
      const email = emailBatch[i];
      
      try {
        const result = await this.sendEmail(email);
        
        if (result.success && result.status === 'SENT') {
          results.sent++;
        } else {
          results.failed++;
        }

        results.details.push({
          to: email.to,
          messageId: email.messageId,
          vendorMessageId: result.vendorMessageId,
          status: result.status
        });

        // Stagger requests to avoid overwhelming (10-50ms between emails)
        if (i < emailBatch.length - 1) {
          await this.simulateDelay(10, 50);
        }

      } catch (error) {
        results.failed++;
        results.details.push({
          to: email.to,
          messageId: email.messageId,
          status: 'FAILED',
          error: error.message
        });
      }
    }

    console.log(`📊 Vendor API Batch Complete: ${results.sent} sent, ${results.failed} failed`);
    return results;
  }

  // Call back to our delivery receipt API (simulating webhook)
  async callDeliveryReceiptAPI(deliveryResult, campaignId, customerId) {
    try {
      const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
      const receiptData = {
        vendorMessageId: deliveryResult.vendorMessageId,
        messageId: deliveryResult.messageId,
        status: deliveryResult.status,
        deliveredAt: deliveryResult.timestamp,
        failureReason: deliveryResult.failureReason,
        recipient: deliveryResult.to,
        campaignId,
        customerId
      };

      // Simulate vendor webhook call
      const response = await fetch(`${serverUrl}/api/vendor/delivery-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VendorAPI-Webhook/1.0',
          'X-Vendor-Signature': this.generateWebhookSignature(receiptData)
        },
        body: JSON.stringify(receiptData)
      });

      if (response.ok) {
        console.log(`📬 Delivery receipt sent for ${deliveryResult.messageId}: ${deliveryResult.status}`);
      } else {
        console.error(`❌ Failed to send delivery receipt: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Error calling delivery receipt API:', error.message);
    }
  }

  // Generate realistic vendor message ID
  generateVendorMessageId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    return `vendor_${timestamp}_${random}`;
  }

  // Get random failure reason (realistic email delivery failures)
  getRandomFailureReason() {
    const reasons = [
      'Recipient mailbox full',
      'Invalid email address',
      'Spam filter rejection',
      'Temporary server error',
      'Recipient domain not found',
      'Message too large',
      'Bounce - user unknown',
      'Rate limit exceeded',
      'Content policy violation',
      'Temporary network error'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  // Simulate realistic network delays
  simulateDelay(minMs = 50, maxMs = 200) {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Update delivery statistics
  updateStats(isSuccess) {
    this.deliveryStats.totalSent++;
    if (isSuccess) {
      this.deliveryStats.successful++;
    } else {
      this.deliveryStats.failed++;
    }
    this.deliveryStats.successRate = (this.deliveryStats.successful / this.deliveryStats.totalSent * 100).toFixed(2);
  }

  // Generate webhook signature (simulating vendor security)
  generateWebhookSignature(data) {
    const payload = JSON.stringify(data);
    return `sha256=${Buffer.from(payload).toString('base64').substr(0, 20)}`;
  }

  // Get vendor API statistics
  getStats() {
    return {
      ...this.deliveryStats,
      uptime: '99.9%',
      averageDeliveryTime: '45 seconds',
      lastUpdated: new Date().toISOString()
    };
  }

  // Reset statistics (for testing)
  resetStats() {
    this.deliveryStats = {
      totalSent: 0,
      successful: 0,
      failed: 0,
      successRate: 0
    };
  }
}

// Create singleton instance
const vendorAPI = new VendorAPIService();

// Export controller functions
export const sendEmailViaVendor = async (req, res) => {
  try {
    const emailData = req.body;
    
    // Validate required fields
    const required = ['messageId', 'to', 'subject', 'htmlContent', 'campaignId', 'customerId'];
    const missing = required.filter(field => !emailData[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    const result = await vendorAPI.sendEmail(emailData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Email submitted to vendor API'
    });

  } catch (error) {
    console.error('Vendor API Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Vendor API error',
      error: error.message
    });
  }
};

export const sendBulkEmailsViaVendor = async (req, res) => {
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email batch is required and must be a non-empty array'
      });
    }

    const result = await vendorAPI.sendBulkEmails(emails);
    
    res.status(200).json({
      success: true,
      data: result,
      message: `Bulk email batch processed: ${result.sent} sent, ${result.failed} failed`
    });

  } catch (error) {
    console.error('Vendor Bulk API Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Vendor bulk API error',
      error: error.message
    });
  }
};

// Delivery receipt webhook endpoint (simulating vendor callback)
export const handleDeliveryReceipt = async (req, res) => {
  try {
    const receiptData = req.body;
    const { messageId, status, deliveredAt, failureReason, vendorMessageId } = receiptData;

    // Validate required fields
    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'messageId is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required'
      });
    }

    // Update communication log
    const updateData = {
      status: status.toLowerCase(),
      delivered_at: status === 'SENT' ? new Date(deliveredAt) : null,
      failure_reason: failureReason,
      metadata: {
        vendor_message_id: vendorMessageId,
        receipt_received_at: new Date().toISOString(),
        vendor_webhook: true
      }
    };

    const communicationLog = await CommunicationLog.findOneAndUpdate(
      { message_id: messageId },
      updateData,
      { new: true }
    );

    if (!communicationLog) {
      console.warn(`⚠️ Communication log not found for message: ${messageId}`);
      return res.status(404).json({
        success: false,
        message: 'Communication log not found'
      });
    }

    console.log(`📬 Delivery receipt processed: ${messageId} -> ${status}`);

    res.status(200).json({
      success: true,
      message: 'Delivery receipt processed successfully'
    });

  } catch (error) {
    console.error('Delivery Receipt Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process delivery receipt',
      error: error.message
    });
  }
};

export const getVendorStats = async (req, res) => {
  try {
    const stats = vendorAPI.getStats();
    
    res.status(200).json({
      success: true,
      data: stats,
      message: 'Vendor API statistics'
    });

  } catch (error) {
    console.error('Vendor Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vendor statistics',
      error: error.message
    });
  }
};

// Export the vendor service for use in other modules
export { vendorAPI };
