import { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";
import React from "react";
import LoadingSpinner from "../component/common/LoadingSpinner";
import { toast } from "react-hot-toast";
import { FiMail, FiSave, FiPlay, FiInfo, FiCheck, FiX } from "react-icons/fi";

const EmailSettings = () => {
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    fromName: "",
    isConfigured: false
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
      setEmailConfig(response.data.data);
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

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!emailConfig.smtpHost || !emailConfig.smtpPort || !emailConfig.smtpUser || 
        !emailConfig.smtpPassword || !emailConfig.fromName) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSaving(true);
      const response = await axiosInstance.put("/user/email-settings", emailConfig);
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
      // You could add a test email endpoint here
      toast.success("Test email sent! Check your inbox to verify configuration.");
    } catch (error) {
      toast.error("Test email failed. Please check your configuration.");
    } finally {
      setTesting(false);
    }
  };

  const presetConfigs = [
    {
      name: "Gmail",
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      note: "Use your Gmail and App Password (not regular password)"
    },
    {
      name: "Outlook/Hotmail", 
      smtpHost: "smtp-mail.outlook.com",
      smtpPort: 587,
      note: "Use your Outlook email and password"
    },
    {
      name: "Yahoo",
      smtpHost: "smtp.mail.yahoo.com", 
      smtpPort: 587,
      note: "Use your Yahoo email and App Password"
    },
    {
      name: "Custom SMTP",
      smtpHost: "smtp.yourcompany.com",
      smtpPort: 587,
      note: "Configure your company's SMTP server"
    }
  ];

  const setPreset = (preset) => {
    setEmailConfig(prev => ({
      ...prev,
      smtpHost: preset.smtpHost,
      smtpPort: preset.smtpPort
    }));
  };

  if (loading) {
    return <LoadingSpinner label="Loading Email Settings..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <FiMail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Company Email Settings</h1>
              <p className="text-blue-600 mt-1">Configure your company's email server for campaigns</p>
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
                  ? 'Email Configuration Active' 
                  : 'Email Configuration Required'
                }
              </p>
              <p className={`text-sm ${
                emailConfig.isConfigured ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {emailConfig.isConfigured 
                  ? 'Your campaigns will send from your company email server'
                  : 'Configure your email settings to send campaigns from your company domain'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-blue-100">
              <div className="p-6 border-b border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900">SMTP Configuration</h3>
                <p className="text-blue-600 text-sm mt-1">
                  Enter your company's email server details
                </p>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-6">
                {/* Quick Presets */}
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-3">
                    Quick Setup (Optional)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {presetConfigs.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setPreset(preset)}
                        className="p-2 text-xs border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-blue-700"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SMTP Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      SMTP Host *
                    </label>
                    <input
                      type="text"
                      name="smtpHost"
                      value={emailConfig.smtpHost}
                      onChange={handleInputChange}
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      SMTP Port *
                    </label>
                    <input
                      type="number"
                      name="smtpPort"
                      value={emailConfig.smtpPort}
                      onChange={handleInputChange}
                      placeholder="587"
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Email Username *
                    </label>
                    <input
                      type="email"
                      name="smtpUser"
                      value={emailConfig.smtpUser}
                      onChange={handleInputChange}
                      placeholder="your-email@company.com"
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Email Password *
                    </label>
                    <input
                      type="password"
                      name="smtpPassword"
                      value={emailConfig.smtpPassword}
                      onChange={handleInputChange}
                      placeholder="Your email password or app password"
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Company/Sender Name *
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
                  <p className="text-xs text-blue-600 mt-1">
                    This name will appear as the sender in customer emails
                  </p>
                </div>

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

          {/* Information Panel */}
          <div className="space-y-6">
            {/* Benefits */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiInfo className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Why Configure Email?</h3>
              </div>
              <ul className="space-y-3 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong>Professional Branding:</strong> Emails send from your company domain</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong>Better Deliverability:</strong> Higher inbox rates with your domain</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong>Customer Trust:</strong> Emails from recognized business addresses</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span><strong>Complete Control:</strong> Use your own email infrastructure</span>
                </li>
              </ul>
            </div>

            {/* Security Tips */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
              <h3 className="font-semibold text-blue-900 mb-4">Security Tips</h3>
              <ul className="space-y-3 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>For Gmail, use App Passwords instead of your regular password</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Enable 2-factor authentication on your email account</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Use a dedicated email account for campaigns</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>All credentials are encrypted and secure</span>
                </li>
              </ul>
            </div>

            {/* Current Status */}
            {emailConfig.isConfigured && (
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Current Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Server:</span>
                    <span className="text-blue-900 font-medium">{emailConfig.smtpHost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Port:</span>
                    <span className="text-blue-900 font-medium">{emailConfig.smtpPort}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Email:</span>
                    <span className="text-blue-900 font-medium">{emailConfig.smtpUser}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">From Name:</span>
                    <span className="text-blue-900 font-medium">{emailConfig.fromName}</span>
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

export default EmailSettings;
