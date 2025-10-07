import { CommunicationLog } from "../models/comunicationLog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Track email opens
const trackEmailOpen = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  
  try {
    // Find the communication log by message ID
    const log = await CommunicationLog.findOne({ message_id: messageId });
    
    if (log && !log.opened_at) {
      // Update the log to mark as opened
      await CommunicationLog.findByIdAndUpdate(log._id, {
        opened_at: new Date(),
        status: 'opened'
      });
      
      console.log(`📧 Email opened: ${messageId}`);
    }
    
    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.send(pixel);
  } catch (error) {
    console.error('Error tracking email open:', error);
    
    // Still return the pixel even if tracking fails
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pixel.length
    });
    
    res.send(pixel);
  }
});

// Track email clicks
const trackEmailClick = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { url } = req.query;
  
  try {
    // Find the communication log by message ID
    const log = await CommunicationLog.findOne({ message_id: messageId });
    
    if (log) {
      const updates = {
        clicked_at: new Date(),
        status: 'clicked'
      };
      
      // If not opened yet, mark as opened too
      if (!log.opened_at) {
        updates.opened_at = new Date();
      }
      
      await CommunicationLog.findByIdAndUpdate(log._id, updates);
      
      console.log(`🖱️ Email clicked: ${messageId}`);
    }
    
    // Redirect to the original URL
    if (url) {
      res.redirect(url);
    } else {
      res.status(200).json(new ApiResponse(200, null, "Click tracked successfully"));
    }
  } catch (error) {
    console.error('Error tracking email click:', error);
    
    // Still redirect even if tracking fails
    if (url) {
      res.redirect(url);
    } else {
      res.status(500).json(new ApiResponse(500, null, "Error tracking click"));
    }
  }
});

// Handle email view online
const viewEmailOnline = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  
  try {
    // Find the communication log by message ID
    const log = await CommunicationLog.findOne({ message_id: messageId });
    
    if (log) {
      // Update the log to mark as opened (since they viewed online)
      if (!log.opened_at) {
        await CommunicationLog.findByIdAndUpdate(log._id, {
          opened_at: new Date(),
          status: 'opened'
        });
        
        console.log(`📧 Email viewed online: ${messageId}`);
      }
    }
    
    // Return a simple page showing the email was viewed
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Viewed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f8ff; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: inline-block; }
          .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅ Email Opened Successfully!</div>
          <p>This email view has been tracked. Thank you for engaging with our content!</p>
          <p><small>Message ID: ${messageId}</small></p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error viewing email online:', error);
    res.status(500).send('Error viewing email');
  }
});

// Handle feedback (yes/no buttons)
const handleFeedback = asyncHandler(async (req, res) => {
  const { messageId, feedback } = req.params; // feedback will be 'yes' or 'no'
  
  try {
    // Find the communication log by message ID
    const log = await CommunicationLog.findOne({ message_id: messageId });
    
    if (log) {
      const updates = {
        clicked_at: new Date(),
        status: 'clicked'
      };
      
      // If not opened yet, mark as opened too
      if (!log.opened_at) {
        updates.opened_at = new Date();
      }
      
      // Add feedback to metadata
      updates.metadata = {
        ...log.metadata,
        feedback: feedback,
        feedback_at: new Date()
      };
      
      await CommunicationLog.findByIdAndUpdate(log._id, updates);
      
      console.log(`👍 Feedback received: ${feedback} for message: ${messageId}`);
    }
    
    // Return a thank you page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Thank You for Your Feedback</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f8ff; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: inline-block; }
          .feedback { font-size: 24px; margin-bottom: 20px; }
          .positive { color: #28a745; }
          .negative { color: #dc3545; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="feedback ${feedback === 'yes' ? 'positive' : 'negative'}">
            ${feedback === 'yes' ? '😊 Thank you for the positive feedback!' : '😔 Thanks for letting us know. We\'ll improve!'}
          </div>
          <p>Your feedback helps us create better content for you.</p>
          ${feedback === 'no' ? '<p>We value your input and will work to improve our emails.</p>' : '<p>We\'re glad you found our email helpful!</p>'}
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error handling feedback:', error);
    res.status(500).send('Error processing feedback');
  }
});

export {
  trackEmailOpen,
  trackEmailClick,
  viewEmailOnline,
  handleFeedback
};
