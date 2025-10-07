import nodemailer from 'nodemailer';
import { ApiError } from './ApiError.js';

// Email validation function
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Create email transporter with dynamic user config - Production Ready
const createTransporter = (userEmailConfig = null) => {
  // Only use user's email config - no fallback to .env
  if (userEmailConfig && userEmailConfig.isConfigured) {
    return nodemailer.createTransport({
      host: userEmailConfig.smtpHost,
      port: userEmailConfig.smtpPort,
      secure: userEmailConfig.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: userEmailConfig.smtpUser,
        pass: userEmailConfig.smtpPassword
      },
      // Production-ready connection settings
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
      // Connection pooling for better performance
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // Retry settings
      tls: {
        rejectUnauthorized: false // For self-signed certificates
      }
    });
  }
  
  // No fallback - email configuration is required
  throw new Error('Email configuration is required. Please configure your email settings first.');
};

// Send email function with retry logic - Production Ready
export const sendEmail = async (to, subject, htmlContent, textContent = '', fromEmail = null, fromName = null, userEmailConfig = null, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Validate email address
      if (!isValidEmail(to)) {
        throw new ApiError(400, `Invalid email address: ${to}`);
      }

      const transporter = createTransporter(userEmailConfig);
      
      // Only verify connection on first attempt to avoid redundant checks
      if (attempt === 1) {
        try {
          await transporter.verify();
        } catch (verifyError) {
          console.log(`⚠️ SMTP verification failed for ${to}, but proceeding with send attempt...`);
        }
      }

      // Require user's email configuration - no fallbacks
      if (!userEmailConfig || !userEmailConfig.isConfigured) {
        throw new ApiError(400, 'Email configuration is required. Please configure your email settings first.');
      }

      // Use company's configured email
      const senderEmail = fromEmail || userEmailConfig.smtpUser;
      const senderName = fromName || userEmailConfig.fromName || 'Company CRM';

      const mailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to} on attempt ${attempt}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        to,
        subject,
        attempts: attempt
      };
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Failed to send email to ${to} (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Don't retry for authentication or invalid email errors
      if (error.code === 'EAUTH' || error.responseCode === 550) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`⏳ Retrying email to ${to} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed, throw the last error
  console.error(`❌ All ${maxRetries} attempts failed for ${to}`);
  
  // Handle different types of email errors
  if (lastError.code === 'EAUTH') {
    throw new ApiError(500, 'Email authentication failed. Please check email credentials.');
  } else if (lastError.code === 'ECONNECTION' || lastError.code === 'ETIMEDOUT') {
    throw new ApiError(500, 'Connection timeout - email server unreachable.');
  } else if (lastError.responseCode === 550) {
    throw new ApiError(400, `Email address ${to} does not exist or is invalid.`);
  } else {
    throw new ApiError(500, `Failed to send email after ${maxRetries} attempts: ${lastError.message}`);
  }
};

// Send bulk emails with rate limiting
export const sendBulkEmails = async (emailList, subject, htmlTemplate, textTemplate = '', fromEmail = null, fromName = null, userEmailConfig = null) => {
  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (const emailData of emailList) {
    try {
      // Replace personalization variables in the template
      let personalizedHtml = htmlTemplate;
      let personalizedText = textTemplate;

      // Replace common variables
      Object.keys(emailData).forEach(key => {
        const placeholder = `{${key}}`;
        personalizedHtml = personalizedHtml.replace(new RegExp(placeholder, 'g'), emailData[key] || '');
        personalizedText = personalizedText.replace(new RegExp(placeholder, 'g'), emailData[key] || '');
      });

      await sendEmail(emailData.email, subject, personalizedHtml, personalizedText, fromEmail, fromName, userEmailConfig);
      results.sent++;
      
      // Rate limiting: wait 100ms between emails to avoid overwhelming the email server
      await delay(100);
      
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: emailData.email,
        error: error.message
      });
    }
  }

  return results;
};

// Create HTML email template with advanced tracking (multiple methods to counter image blocking)
export const createEmailTemplate = (subject, body, customerName = '', messageId = '', serverUrl = 'https://insightcrm.onrender.com', companyName = 'Your Company') => {
  
  let trackingElements = '';
  let processedBody = body.replace(/\n/g, '<br>');
  
  if (messageId) {
    // Method 1: Traditional tracking pixel (blocked by most clients)
    trackingElements += `<img src="${serverUrl}/api/track/open/${messageId}" width="1" height="1" style="display: none;" alt="" />`;
    
    // Method 2: CSS background image tracking (harder to block)
    trackingElements += `<div style="background-image: url('${serverUrl}/api/track/open/${messageId}'); width: 1px; height: 1px; background-size: 1px 1px; background-repeat: no-repeat; background-position: 0 0; display: none;"></div>`;
    
    // Method 3: CSS media query tracking (loads in some clients)
    trackingElements += `<style>@media screen { .track { background: url('${serverUrl}/api/track/open/${messageId}') no-repeat; } }</style><div class="track" style="width:1px;height:1px;display:none;"></div>`;
    
    // Method 4: Replace links with tracked versions
    processedBody = processedBody.replace(
      /(https?:\/\/[^\s<>"]+)/gi,
      `<a href="${serverUrl}/api/track/click/${messageId}?url=$1" style="color: #667eea; text-decoration: none;">$1</a>`
    );
    
    // Method 5: Add a "View Online" link (guarantees at least some tracking)
    const viewOnlineLink = `<p style="text-align: center; margin: 10px 0; font-size: 12px;">
      <a href="${serverUrl}/api/track/click/${messageId}?url=${encodeURIComponent(serverUrl + '/email-view/' + messageId)}" 
         style="color: #667eea; text-decoration: none;">
        📧 View this email in your browser
      </a>
    </p>`;
    
    // Method 6: Add engagement buttons that encourage clicking
    const engagementButtons = `
    <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f0f8ff; border-radius: 8px;">
      <p style="margin: 0 0 15px 0; color: #333; font-weight: bold;">📊 Was this email helpful?</p>
      <a href="${serverUrl}/api/track/click/${messageId}?url=${encodeURIComponent(serverUrl + '/feedback/yes/' + messageId)}" 
         style="display: inline-block; background: #28a745; color: white; padding: 8px 16px; margin: 0 5px; text-decoration: none; border-radius: 4px; font-size: 12px;">
        👍 Yes, helpful!
      </a>
      <a href="${serverUrl}/api/track/click/${messageId}?url=${encodeURIComponent(serverUrl + '/feedback/no/' + messageId)}" 
         style="display: inline-block; background: #dc3545; color: white; padding: 8px 16px; margin: 0 5px; text-decoration: none; border-radius: 4px; font-size: 12px;">
        👎 Not helpful
      </a>
    </div>`;
    
    // Method 7: Add social sharing (increases engagement)
    const socialSharing = `
    <div style="text-align: center; margin: 15px 0;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 12px;">Share this with others:</p>
      <a href="${serverUrl}/api/track/click/${messageId}?url=${encodeURIComponent('mailto:?subject=' + encodeURIComponent(subject) + '&body=Check this out!')}" 
         style="display: inline-block; margin: 0 5px; padding: 5px; color: #667eea; text-decoration: none;">
        📧 Email
      </a>
      <a href="${serverUrl}/api/track/click/${messageId}?url=${encodeURIComponent('https://wa.me/?text=' + encodeURIComponent(subject))}" 
         style="display: inline-block; margin: 0 5px; padding: 5px; color: #25d366; text-decoration: none;">
        💬 WhatsApp
      </a>
    </div>`;
    
    // Add all engagement elements to the body
    processedBody += engagementButtons + socialSharing;
    
    // Add view online at the top
    processedBody = viewOnlineLink + processedBody;
  }
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 30px; 
          text-align: center; 
          border-radius: 10px 10px 0 0;
          /* CSS tracking background */
          ${messageId ? `background-image: url('${serverUrl}/api/track/open/${messageId}'), linear-gradient(135deg, #667eea 0%, #764ba2 100%);` : ''}
        }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        a { color: #667eea; text-decoration: none; }
        a:hover { text-decoration: underline; }
        
        /* Additional CSS tracking methods */
        .header::before { 
          content: '';
          ${messageId ? `background: url('${serverUrl}/api/track/open/${messageId}') no-repeat;` : ''}
          width: 1px; 
          height: 1px; 
          display: block; 
          position: absolute; 
          left: -9999px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">${companyName}</div>
        <h2>${subject}</h2>
    </div>
    <div class="content">
        ${processedBody}
    </div>
    <div class="footer">
        <p>This email was sent by ${companyName}. If you no longer wish to receive these emails, please contact us.</p>
        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
    ${trackingElements}
</body>
</html>`;
};

export default {
  sendEmail,
  sendBulkEmails,
  createEmailTemplate,
  isValidEmail
};
