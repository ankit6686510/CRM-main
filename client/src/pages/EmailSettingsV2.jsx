import { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";
import React from "react";
import LoadingSpinner from "../component/common/LoadingSpinner";
import { toast } from "react-hot-toast";
import { FiMail, FiSave, FiPlay, FiInfo, FiCheck, FiX, FiExternalLink, FiKey, FiZap } from "react-icons/fi";

const EmailSettingsV2 = () => {
  const [emailConfig, setEmailConfig] = useState({
    emailService: "gmail",
    smtpUser: "",
    fromName: "",
    
    // API Keys for different services
    googleAccessToken: "",
    sendgridApiKey: "",
    resendApiKey: "",
    brevoApiKey: "",
    
    isConfigured: false,
    preferredService: "gmail"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/user/email-settings");
      setEmailConfig(prev => ({
        ...prev,
        ...response.data.data
      }));
    } catch (error) {
      console.error("Failed to fetch email settings:", error);
      toast.error("Failed to fetch email settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = (service) => {
    setEmailConfig(prev => ({
      ...prev,
      emailService: service,
      preferredService: service
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate based on selected service
    if (!emailConfig.smtpUser || !emailConfig.fromName) {
      toast.error("Please fill in your email and company name");
      return;
    }

    // Service-specific validation
    let isServiceConfigured = false;
    switch (emailConfig.emailService) {
      case "gmail":
        isServiceConfigured = emailConfig.googleAccessToken || emailConfig.smtpPassword;
        break;
      case "sendgrid":
        isServiceConfigured = !!emailConfig.sendgridApiKey;
        break;
      case "resend":
        isServiceConfigured = !!emailConfig.resendApiKey;
        break;
      case "brevo":
        isServiceConfigured = !!emailConfig.brevoApiKey;
        break;
    }

    if (!isServiceConfigured) {
      toast.error(`Please configure API credentials for ${emailConfig.emailService}`);
      return;
    }

    try {
      setSaving(true);
      const response = await axiosInstance.put("/user/email-settings", {
        ...emailConfig,
        isConfigured: true
      });
      setEmailConfig({...emailConfig, ...response.data.data, isConfigured: true});
      toast.success("Email settings saved successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save email settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!emailConfig.isConfigured) {
      toast.error("Please save your configuration first");
      return;
    }

    try {
      setTesting(true);
      // Test endpoint would be implemented in backend
      await axiosInstance.post("/user/test-email", {
        to: emailConfig.smtpUser,
        subject: "Test Email from InsightCRM",
        body: "This is a test email to verify your email configuration is working properly."
      });
      toast.success("Test email sent! Check your inbox to verify configuration.");
    } catch (error) {
      toast.error("Test email failed. Please check your configuration.");
    } finally {
      setTesting(false);
    }
  };

  const emailServices = [
    {
      id: "gmail",
      name: "Gmail API",
      icon: "📧",
      description: "Use Gmail API (OAuth) - Recommended for Gmail users",
      pros: ["Free", "Reliable", "No rate limits", "Professional"],
      cons: ["Requires OAuth setup"],
      setupComplexity: "Medium",
      cost: "Free",
      recommended: true
    },
    {
      id: "brevo",
      name: "Brevo (Sendinblue)",
      icon: "📬",
      description: "Free tier with 300 emails/day",
      pros: ["Free tier", "Easy setup", "Good deliverability"],
      cons: ["Daily limits on free tier"],
      setupComplexity: "Easy",
      cost: "Free tier available",
      recommended: true
    },
    {
      id: "resend",
      name: "Resend",
      icon: "🚀",
      description: "Modern email API with 100 emails/day free",
      pros: ["Easy setup", "Developer-friendly", "Good documentation"],
      cons: ["Limited free tier"],
      setupComplexity: "Easy", 
      cost: "Free tier: 100 emails/day",
      recommended: false
    },
    {
      id: "sendgrid",
      name: "SendGrid",
      icon: "📮",
      description: "Enterprise email service",
      pros: ["Reliable", "Scalable", "Advanced features"],
      cons: ["Paid service", "Complex pricing"],
      setupComplexity: "Easy",
      cost: "Paid (starts $14.95/month)",
      recommended: false
    }
  ];

  const getServiceInstructions = (serviceId) => {
    const instructions = {
      gmail: {
        title: "Gmail API Setup",
        steps: [
          "Go to Google Cloud Console (console.cloud.google.com)",
          "Create a new project or select existing",
          "Enable Gmail API",
          "Create OAuth 2.0 credentials",
          "Add your domain to authorized origins",
          "Use the OAuth flow to get access token"
        ],
        links: [
          { text: "Google Cloud Console", url: "https://console.cloud.google.com" },
          { text: "Gmail API Guide", url: "https://developers.google.com/gmail/api/quickstart" }
        ]
      },
      brevo: {
        title: "Brevo API Setup",
        steps: [
          "Sign up at brevo.com (free account)",
          "Go to Account > SMTP & API",
          "Generate a new API key",
          "Copy the API key and paste below"
        ],
        links: [
          { text: "Sign up for Brevo", url: "https://www.brevo.com" },
          { text: "API Documentation", url: "https://developers.brevo.com" }
        ]
      },
      resend: {
        title: "Resend API Setup", 
        steps: [
          "Sign up at resend.com",
          "Go to API Keys in dashboard",
          "Create a new API key",
          "Copy the API key and paste below"
        ],
        links: [
          { text: "Sign up for Resend", url: "https://resend.com" },
          { text: "API Documentation", url: "https://resend.com/docs" }
        ]
      },
      sendgrid: {
        title: "SendGrid API Setup",
        steps: [
          "Sign up at sendgrid.com",
          "Go to Settings > API Keys", 
          "Create a new API key with Mail Send permissions",
          "Copy the API key and paste below"
        ],
        links: [
          { text: "Sign up for SendGrid", url: "https://sendgrid.com" },
          { text: "API Documentation", url: "https://docs.sendgrid.com" }
        ]
      }
    };
    return instructions[serviceId] || {};
  };

  if (loading) {
    return <LoadingSpinner label="Loading Email Settings..." />;
  }

  const selectedService = emailServices.find(s => s.id === emailConfig.emailService);
  const instructions = getServiceInstructions(emailConfig.emailService);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <FiMail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Email Configuration</h1>
              <p className="text-blue-600 mt-1">Configure email delivery for your campaigns (Render-compatible)</p>
            </div>
          </div>

          {/* Status Banner */}
          <div className={`rounded-lg p-4 flex items-center gap-3 ${
            emailConfig.isConfigured 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            {emailConfig.isConfigured ? (
              <FiCheck className="w-5 h-5 text-green-600" />
            ) : (
              <FiX className="w-5 h-5 text-yellow-600" />
            )}
            <div>
              <p className={`font-medium ${
                emailConfig.isConfigured ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {emailConfig.isConfigured 
                  ? `Email Configured (${selectedService?.name})` 
                  : 'Email Configuration Required'
                }
              </p>
              <p className={`text-sm ${
                emailConfig.isConfigured ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {emailConfig.isConfigured 
                  ? 'Your campaigns will send using HTTP APIs (compatible with Render)'
                  : 'SMTP ports are blocked on Render - use HTTP APIs instead'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Options */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100">
              <div className="p-6 border-b border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900">Choose Email Service</h3>
                <p className="text-blue-600 text-sm mt-1">
                  Select the email service that works best for your company
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emailServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceChange(service.id)}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        emailConfig.emailService === service.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {service.recommended && (
                        <div className="absolute -top-2 -right-2">
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            Recommended
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{service.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Setup:</span>
                              <span className={`font-medium ${
                                service.setupComplexity === 'Easy' ? 'text-green-600' : 
                                service.setupComplexity === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {service.setupComplexity}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Cost:</span>
                              <span className="font-medium text-gray-700">{service.cost}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Configuration Form */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100">
              <div className="p-6 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-blue-900">
                    {selectedService?.name} Configuration
                  </h3>
                  <span className="text-2xl">{selectedService?.icon}</span>
                </div>
                <p className="text-blue-600 text-sm mt-1">
                  {selectedService?.description}
                </p>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-6">
                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Company Email *
                    </label>
                    <input
                      type="email"
                      name="smtpUser"
                      value={emailConfig.smtpUser}
                      onChange={handleInputChange}
                      placeholder="company@yourdomain.com"
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      This will be the "from" address for campaigns
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="fromName"
                      value={emailConfig.fromName}
                      onChange={handleInputChange}
                      placeholder="Your Company Name"
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Service-specific Configuration */}
                {emailConfig.emailService === "gmail" && (
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      <FiKey className="inline w-4 h-4 mr-1" />
                      Google OAuth Access Token
                    </label>
                    <input
                      type="password"
                      name="googleAccessToken"
                      value={emailConfig.googleAccessToken}
                      onChange={handleInputChange}
                      placeholder="Enter your Google OAuth access token"
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      Get this from Google Cloud Console OAuth 2.0 flow
                    </p>
                  </div>
                )}

                {emailConfig.emailService === "sendgrid" && (
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      <FiKey className="inline w-4 h-4 mr-1" />
                      SendGrid API Key *
                    </label>
                    <input
                      type="password"
                      name="sendgridApiKey"
                      value={emailConfig.sendgridApiKey}
                      onChange={handleInputChange}
                      placeholder="SG.xxxxxxxxxx"
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={emailConfig.emailService === "sendgrid"}
                    />
                  </div>
                )}

                {emailConfig.emailService === "resend" && (
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      <FiKey className="inline w-4 h-4 mr-1" />
                      Resend API Key *
                    </label>
                    <input
                      type="password"
                      name="resendApiKey"
                      value={emailConfig.resendApiKey}
                      onChange={handleInputChange}
                      placeholder="re_xxxxxxxxxx"
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={emailConfig.emailService === "resend"}
                    />
                  </div>
                )}

                {emailConfig.emailService === "brevo" && (
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      <FiKey className="inline w-4 h-4 mr-1" />
                      Brevo API Key *
                    </label>
                    <input
                      type="password"
                      name="brevoApiKey"
                      value={emailConfig.brevoApiKey}
                      onChange={handleInputChange}
                      placeholder="xkeysib-xxxxxxxxxx"
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={emailConfig.emailService === "brevo"}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <FiSave className="w-5 h-5" />
                    {saving ? "Saving..." : "Save Configuration"}
                  </button>
                  
                  {emailConfig.isConfigured && (
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={testing}
                      className="flex items-center gap-2 px-6 py-3 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      <FiPlay className="w-5 h-5" />
                      {testing ? "Testing..." : "Test"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Instructions Panel */}
          <div className="space-y-6">
            {/* Setup Instructions */}
            {instructions.steps && (
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiInfo className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">{instructions.title}</h3>
                </div>
                <ol className="space-y-2 text-sm text-blue-700">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                
                {instructions.links && (
                  <div className="mt-4 pt-4 border-t border-blue-100">
                    <p className="text-sm font-medium text-blue-900 mb-2">Helpful Links:</p>
                    <div className="space-y-1">
                      {instructions.links.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <FiExternalLink className="w-3 h-3" />
                          {link.text}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Current Status */}
            {emailConfig.isConfigured && (
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Current Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Service:</span>
                    <span className="text-blue-900 font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Email:</span>
                    <span className="text-blue-900 font-medium">{emailConfig.smtpUser}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">From Name:</span>
                    <span className="text-blue-900 font-medium">{emailConfig.fromName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Status:</span>
                    <span className="text-green-600 font-medium">✅ Ready</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettingsV2;
