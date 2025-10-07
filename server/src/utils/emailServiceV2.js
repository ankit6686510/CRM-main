import fetch from 'node-fetch';
import { ApiError } from './ApiError.js';

// Email validation function
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// HTTP-based email service that works around Render's SMTP port blocking
class EmailServiceV2 {
  constructor() {
    this.services = {
      gmail: new GmailAPIService(),
      sendgrid: new SendGridService(),
      resend: new ResendService(),
      brevo: new BrevoService()
    };
  }

  // Auto-detect email provider and use appropriate service
  async sendEmail(to, subject, htmlContent, textContent = '', userEmailConfig = null, maxRetries = 3) {
    if (!userEmailConfig || !userEmailConfig.isConfigured) {
      throw new ApiError(400, 'Email configuration is required. Please configure your email settings first.');
    }

    // Validate email address
    if (!isValidEmail(to)) {
      throw new ApiError(400, `Invalid email address: ${to}`);
    }

    let service = null;

    // Determine which service to use based on user's preferred service configuration
    const preferredService = userEmailConfig.emailService || userEmailConfig.preferredService || 'brevo';
    
    // Use the service the user actually configured
    if (preferredService === 'gmail' && userEmailConfig.googleAccessToken) {
      service = this.services.gmail;
    } else if (preferredService === 'sendgrid' && userEmailConfig.sendgridApiKey) {
      service = this.services.sendgrid;
    } else if (preferredService === 'resend' && userEmailConfig.resendApiKey) {
      service = this.services.resend;
    } else if (preferredService === 'brevo' && userEmailConfig.brevoApiKey) {
      service = this.services.brevo;
    } else {
      // Auto-detect based on available credentials
      if (userEmailConfig.brevoApiKey) {
        service = this.services.brevo;
      } else if (userEmailConfig.sendgridApiKey) {
        service = this.services.sendgrid;
      } else if (userEmailConfig.resendApiKey) {
        service = this.services.resend;
      } else if (userEmailConfig.googleAccessToken) {
        service = this.services.gmail;
      } else {
        throw new ApiError(400, 'No valid email service configuration found. Please configure at least one email service.');
      }
    }

    // Try sending with retry logic
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await service.sendEmail({
          to,
          subject,
          htmlContent,
          textContent,
          fromEmail: userEmailConfig.smtpUser,
          fromName: userEmailConfig.fromName,
          userConfig: userEmailConfig
        });

        console.log(`✅ Email sent via ${service.constructor.name} to ${to} on attempt ${attempt}: ${result.messageId}`);
        
        return {
          success: true,
          messageId: result.messageId,
          to,
          subject,
          attempts: attempt,
          service: service.constructor.name
        };

      } catch (error) {
        lastError = error;
        console.error(`❌ Failed to send email via ${service.constructor.name} to ${to} (attempt ${attempt}/${maxRetries}):`, error.message);
        
        // Don't retry for authentication errors
        if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`⏳ Retrying email to ${to} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new ApiError(500, `Failed to send email after ${maxRetries} attempts: ${lastError.message}`);
  }

  // Send bulk emails with rate limiting
  async sendBulkEmails(emailList, subject, htmlTemplate, textTemplate = '', userEmailConfig = null) {
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

        await this.sendEmail(emailData.email, subject, personalizedHtml, personalizedText, userEmailConfig);
        results.sent++;
        
        // Rate limiting: wait 200ms between emails for HTTP APIs
        await delay(200);
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: emailData.email,
          error: error.message
        });
      }
    }

    return results;
  }
}

// Gmail API Service (OAuth 2.0)
class GmailAPIService {
  async sendEmail({ to, subject, htmlContent, textContent, fromEmail, fromName, userConfig }) {
    if (!userConfig.googleAccessToken) {
      throw new Error('Gmail OAuth access token required. Please authenticate with Google.');
    }

    const email = this.createEmailMessage({
      to,
      subject,
      htmlContent,
      textContent,
      fromEmail,
      fromName
    });

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userConfig.googleAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gmail API error: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    return { messageId: result.id };
  }

  createEmailMessage({ to, subject, htmlContent, textContent, fromEmail, fromName }) {
    const boundary = Math.random().toString(36).substr(2, 15);
    
    return [
      `From: "${fromName}" <${fromEmail}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      textContent || htmlContent.replace(/<[^>]*>/g, ''),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      htmlContent,
      '',
      `--${boundary}--`
    ].join('\r\n');
  }
}

// SendGrid Service (Paid but reliable)
class SendGridService {
  async sendEmail({ to, subject, htmlContent, textContent, fromEmail, fromName, userConfig }) {
    if (!userConfig.sendgridApiKey) {
      throw new Error('SendGrid API key required.');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userConfig.sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }]
        }],
        from: {
          email: fromEmail,
          name: fromName
        },
        subject,
        content: [
          {
            type: 'text/plain',
            value: textContent || htmlContent.replace(/<[^>]*>/g, '')
          },
          {
            type: 'text/html',
            value: htmlContent
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid error: ${error}`);
    }

    return { messageId: response.headers.get('x-message-id') || `sg_${Date.now()}` };
  }
}

// Resend Service (Modern alternative)
class ResendService {
  async sendEmail({ to, subject, htmlContent, textContent, fromEmail, fromName, userConfig }) {
    if (!userConfig.resendApiKey) {
      throw new Error('Resend API key required.');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userConfig.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '')
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend error: ${error.message || 'Unknown error'}`);
    }

    const result = await response.json();
    return { messageId: result.id };
  }
}

// Brevo (formerly Sendinblue) Service - Free tier available
class BrevoService {
  async sendEmail({ to, subject, htmlContent, textContent, fromEmail, fromName, userConfig }) {
    if (!userConfig.brevoApiKey) {
      throw new Error('Brevo API key required.');
    }

    console.log(`🔍 Brevo API Debug - Sending to: ${to}, from: ${fromEmail}, API key: ${userConfig.brevoApiKey.substring(0, 20)}...`);

    const requestBody = {
      sender: {
        name: fromName,
        email: fromEmail
      },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent: textContent || htmlContent.replace(/<[^>]*>/g, '')
    };

    console.log(`🔍 Brevo Request Body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Api-Key': userConfig.brevoApiKey, // Fixed: Case-sensitive header
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`🔍 Brevo Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
        console.error(`❌ Brevo API Error Response:`, errorData);
      } catch (e) {
        errorText = await response.text();
        console.error(`❌ Brevo API Error Text:`, errorText);
      }
      throw new Error(`Brevo API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Brevo API Success Response:`, result);
    
    return { 
      messageId: result.messageId || result.id || `brevo_${Date.now()}` 
    };
  }
}

// Create singleton instance
const emailServiceV2 = new EmailServiceV2();

// Export functions that match the original API
export const sendEmail = async (to, subject, htmlContent, textContent = '', fromEmail = null, fromName = null, userEmailConfig = null, maxRetries = 3) => {
  return await emailServiceV2.sendEmail(to, subject, htmlContent, textContent, userEmailConfig, maxRetries);
};

export const sendBulkEmails = async (emailList, subject, htmlTemplate, textTemplate = '', fromEmail = null, fromName = null, userEmailConfig = null) => {
  return await emailServiceV2.sendBulkEmails(emailList, subject, htmlTemplate, textTemplate, userEmailConfig);
};

// Create HTML email template with advanced tracking (copied from emailService.js)
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
