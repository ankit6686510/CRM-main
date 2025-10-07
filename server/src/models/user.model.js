// models/User.js
import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatar: String,
  role: {
    type: String,
    enum: ["admin", "marketer", "analyst"],
    default: "marketer",
  },
  // Company Email Configuration (SaaS Feature) - Updated for Render compatibility
  emailConfig: {
    // Legacy SMTP (kept for backward compatibility, but won't work on Render)
    smtpHost: { type: String, default: "smtp.gmail.com" },
    smtpPort: { type: Number, default: 587 },
    smtpUser: String, // Company's email username
    smtpPassword: String, // Company's email password (for SMTP)
    
    // HTTP API-based email services (Render-compatible)
    emailService: { 
      type: String, 
      enum: ["gmail", "sendgrid", "resend", "brevo", "smtp"], 
      default: "gmail" 
    },
    
    // Gmail API (OAuth 2.0) - Recommended for Gmail users
    googleAccessToken: String,
    googleRefreshToken: String,
    
    // SendGrid API
    sendgridApiKey: String,
    
    // Resend API
    resendApiKey: String,
    
    // Brevo (Sendinblue) API
    brevoApiKey: String,
    
    // Common fields
    fromName: String, // Company name for emails
    isConfigured: { type: Boolean, default: false },
    
    // Service status and preferences
    preferredService: { 
      type: String, 
      enum: ["gmail", "sendgrid", "resend", "brevo", "smtp"], 
      default: "gmail" 
    },
    lastTestedAt: Date,
    isWorking: { type: Boolean, default: false }
  },
  last_login: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
});

userSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

export const User = mongoose.model("User", userSchema);
