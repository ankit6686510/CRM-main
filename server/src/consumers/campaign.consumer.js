import { processJobs } from '../config/redis.js';
import { Campaign } from '../models/campaign.model.js';
import { CommunicationLog } from '../models/comunicationLog.model.js';
import { vendorAPI } from '../controllers/vendor.controller.js';

class CampaignConsumer {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      console.log(' Campaign Consumer already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Campaign Consumer Service...');

    try {
      // Start processing campaign jobs (non-blocking)
      processJobs('campaign.jobs', this.processCampaignJob.bind(this))
        .catch(error => {
          console.error(' Campaign Consumer Error:', error);
          this.isRunning = false;
        });
      
      console.log(' Subscribed to campaign.events');
      console.log(' Started processing queue: campaign.jobs');
      console.log(' Campaign Consumer Service started successfully');
    } catch (error) {
      console.error(' Campaign Consumer Error:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async processCampaignJob(job) {
    const { type, campaignId, customers, messageContent } = job;

    console.log(` Processing campaign job: ${type} for campaign ${campaignId}`);

    try {
      switch (type) {
        case 'DELIVER_CAMPAIGN':
          await this.deliverCampaign(job);
          break;
        default:
          console.log(` Unknown campaign job type: ${type}`);
      }
    } catch (error) {
      console.error(` Failed to process campaign job ${campaignId}:`, error);
      throw error;
    }
  }

  async deliverCampaign(job) {
    const { campaignId, customers, messageContent, userId, userEmail } = job;

    try {
      // Update campaign status to 'processing'
      await Campaign.findByIdAndUpdate(campaignId, { 
        status: 'processing',
        started_at: new Date()
      });

      console.log(` Starting campaign delivery: ${campaignId} to ${customers.length} customers`);

      let sentCount = 0;
      let failedCount = 0;

      // Process customers in batches (batch processing brownie point!)
      const batchSize = 10; // Process 10 emails at a time
      const batches = this.createBatches(customers, batchSize);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        console.log(` Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);

        // Create communication logs for this batch
        const communicationLogs = await this.createCommunicationLogs(batch, campaignId, messageContent);

        // Prepare emails for vendor API
        const emailBatch = batch.map((customer, index) => ({
          messageId: communicationLogs[index].message_id,
          to: customer.email,
          subject: this.personalizeMessage(messageContent.subject, customer),
          htmlContent: this.generateEmailHTML(messageContent, customer),
          from: messageContent.from_email,
          campaignId: campaignId,
          customerId: customer.id
        }));

        // Send batch to vendor API
        try {
          const batchResult = await vendorAPI.sendBulkEmails(emailBatch);
          sentCount += batchResult.sent;
          failedCount += batchResult.failed;

          console.log(` Batch ${batchIndex + 1} completed: ${batchResult.sent} sent, ${batchResult.failed} failed`);

          // Add delay between batches to avoid overwhelming
          if (batchIndex < batches.length - 1) {
            await this.delay(1000); // 1 second delay between batches
          }

        } catch (batchError) {
          console.error(` Batch ${batchIndex + 1} failed:`, batchError);
          failedCount += batch.length;

          // Mark all emails in this batch as failed
          await CommunicationLog.updateMany(
            { message_id: { $in: communicationLogs.map(log => log.message_id) } },
            { 
              status: 'failed',
              failure_reason: 'Batch processing error: ' + batchError.message,
              delivered_at: new Date()
            }
          );
        }
      }

      // Update campaign with final statistics
      await Campaign.findByIdAndUpdate(campaignId, {
        status: 'completed',
        completed_at: new Date(),
        delivery_stats: {
          sent: sentCount,
          failed: failedCount,
          total: customers.length,
          success_rate: ((sentCount / customers.length) * 100).toFixed(2)
        }
      });

      console.log(` Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`);

    } catch (error) {
      console.error(` Campaign delivery failed for ${campaignId}:`, error);

      // Mark campaign as failed
      await Campaign.findByIdAndUpdate(campaignId, {
        status: 'failed',
        completed_at: new Date(),
        failure_reason: error.message
      });

      throw error;
    }
  }

  // Create communication logs for batch processing
  async createCommunicationLogs(customers, campaignId, messageContent) {
    const logs = customers.map(customer => ({
      customer_id: customer.id,
      campaign_id: campaignId,
      message_id: this.generateMessageId(),
      type: 'email',
      subject: this.personalizeMessage(messageContent.subject, customer),
      message_content: this.personalizeMessage(messageContent.message, customer),
      recipient_email: customer.email,
      status: 'pending',
      metadata: {
        batch_processed: true,
        customer_name: customer.name,
        from_name: messageContent.from_name,
        from_email: messageContent.from_email
      }
    }));

    return await CommunicationLog.insertMany(logs);
  }

  // Personalize message with customer data
  personalizeMessage(template, customer) {
    return template
      .replace(/\{name\}/g, customer.name || 'Valued Customer')
      .replace(/\{email\}/g, customer.email)
      .replace(/\{firstName\}/g, customer.name?.split(' ')[0] || 'Valued Customer');
  }

  // Generate email HTML with template
  generateEmailHTML(messageContent, customer) {
    const personalizedMessage = this.personalizeMessage(messageContent.message, customer);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${messageContent.subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { padding: 20px 0; }
        .footer { font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        .cta-button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Hi ${customer.name || 'Valued Customer'}! 👋</h2>
    </div>
    
    <div class="content">
        ${personalizedMessage.split('\n').map(line => `<p>${line}</p>`).join('')}
    </div>
    
    <div class="footer">
        <p>Best regards,<br><strong>${messageContent.from_name}</strong></p>
        <p><small>This email was sent from ${messageContent.from_email}</small></p>
        <p><small>© 2025 InsightCRM. All rights reserved.</small></p>
    </div>
</body>
</html>`;
  }

  // Create batches for batch processing
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  // Generate unique message ID
  generateMessageId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `msg_${timestamp}_${random}`;
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    this.isRunning = false;
    console.log('🛑 Campaign Consumer stopped');
  }
}

// Create singleton instance
const campaignConsumer = new CampaignConsumer();

export default campaignConsumer;
