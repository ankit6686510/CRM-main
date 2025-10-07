import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../component/common/LoadingSpinner";
import Modal from "../component/dashboard/Modal";
import { useApi } from "../context/ApiContext";
import {
  FiPlus,
  FiUsers,
  FiMail,
  FiBarChart2,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiEye,
  FiSettings,
  FiX,
} from "react-icons/fi";

const Campaigns = () => {
  const { refreshTrigger } = useApi();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showEmailConfigModal, setShowEmailConfigModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Listen for global data refresh triggers
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchCampaigns();
    }
  }, [refreshTrigger]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/user/get-campaign");
      setCampaigns(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  // Fetch communication logs with loading state (copied from Dashboard)
  const fetchCommunicationLogs = async (campaignId) => {
    try {
      setLogsLoading(true);
      const response = await axiosInstance.get(
        `/user/get-log?campaignId=${campaignId}`
      );
      setSelectedLogs(response.data.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch communication logs"
      );
    } finally {
      setLogsLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId, campaignName) => {
    if (!window.confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/user/delete-campaign/${campaignId}`);
      toast.success("Campaign deleted successfully");
      fetchCampaigns(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete campaign");
    }
  };

  // Check if user has configured email settings
  const checkEmailConfiguration = async () => {
    try {
      const response = await axiosInstance.get("/user/email-settings");
      return response.data.data.isConfigured;
    } catch (error) {
      console.error("Failed to check email configuration:", error);
      return false;
    }
  };

  // Handle create campaign button click
  const handleCreateCampaign = async () => {
    const isEmailConfigured = await checkEmailConfiguration();
    
    if (!isEmailConfigured) {
      setShowEmailConfigModal(true);
      return;
    }
    
    navigate("/campaigns/create");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <FiClock className="w-4 h-4" />;
      case "completed":
        return <FiCheckCircle className="w-4 h-4" />;
      case "failed":
        return <FiAlertCircle className="w-4 h-4" />;
      default:
        return <FiBarChart2 className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading Campaigns..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900 mb-2">Campaigns</h1>
            <p className="text-blue-600">Manage and track your marketing campaigns</p>
          </div>
          <button
            onClick={handleCreateCampaign}
            className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Create Campaign
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Campaigns</p>
                <h3 className="text-2xl font-bold text-blue-900 mt-1">{campaigns.length}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <FiBarChart2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Campaigns</p>
                <h3 className="text-2xl font-bold text-green-900 mt-1">
                  {campaigns.filter(c => c.status === "active").length}
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <FiClock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Recipients</p>
                <h3 className="text-2xl font-bold text-blue-900 mt-1">
                  {campaigns.reduce((sum, c) => sum + (c.stats?.total_recipients || 0), 0)}
                </h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Emails Sent</p>
                <h3 className="text-2xl font-bold text-purple-900 mt-1">
                  {campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0)}
                </h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <FiMail className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {campaigns.map((campaign) => (
                  <tr key={campaign._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900">{campaign.name}</h4>
                        <p className="text-sm text-blue-600">{campaign.template.subject}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {getStatusIcon(campaign.status)}
                        <span className="ml-1.5 capitalize">{campaign.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900">
                      {campaign.stats?.total_recipients || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900">
                      {campaign.stats?.sent || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-900">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => fetchCommunicationLogs(campaign._id)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Logs"
                          disabled={logsLoading}
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign._id, campaign.name)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Campaign"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Email Configuration Required Modal */}
      <Modal
        isOpen={showEmailConfigModal}
        onClose={() => setShowEmailConfigModal(false)}
        title=""
        size="md"
        blurBackground={true}
      >
        <div className="text-center p-6">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <FiMail className="h-8 w-8 text-yellow-600" />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Email Configuration Required
          </h3>
          
          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Before creating campaigns, you need to configure your company's email settings. 
            This ensures emails are sent from your business domain with professional branding.
          </p>
          
          {/* Benefits */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-medium text-blue-900 mb-2">Why configure email?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Professional emails from your company domain</li>
              <li>• Better email deliverability and trust</li>
              <li>• Consistent branding across all campaigns</li>
            </ul>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowEmailConfigModal(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowEmailConfigModal(false);
                navigate("/email-settings");
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiSettings className="w-4 h-4" />
              Configure Email Settings
            </button>
          </div>
        </div>
      </Modal>

      {/* Communication Logs Modal */}
      <Modal
        isOpen={!!selectedLogs}
        onClose={() => setSelectedLogs(null)}
        title="Communication Logs"
        size="xl"
        blurBackground={false}
      >
        {logsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          selectedLogs && <CommunicationLogs logs={selectedLogs} />
        )}
      </Modal>
    </div>
  );
};

// Communication Logs Component (copied from Dashboard)
const CommunicationLogs = ({ logs }) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter((log) => {
    if (filter !== "all" && log.status !== filter) return false;
    if (
      search &&
      !(
        log.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
        log.status?.toLowerCase().includes(search.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });

  const statusColors = {
    queued: "bg-yellow-500",
    sent: "bg-blue-500",
    delivered: "bg-green-500",
    opened: "bg-purple-500",
    clicked: "bg-indigo-500",
    failed: "bg-red-500",
  };

  const getStatusTimeline = (log) => {
    const timeline = [];
    if (log.sent_at) timeline.push({ status: "sent", time: log.sent_at });
    if (log.delivered_at) timeline.push({ status: "delivered", time: log.delivered_at });
    if (log.opened_at) timeline.push({ status: "opened", time: log.opened_at });
    if (log.clicked_at) timeline.push({ status: "clicked", time: log.clicked_at });
    return timeline;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="opened">Opened</option>
          <option value="clicked">Clicked</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status Timeline
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.map((log) => {
              const timeline = getStatusTimeline(log);
              const lastUpdate = timeline[timeline.length - 1]?.time || log.sent_at;
              
              return (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600">
                          {log.customer?.name?.charAt(0) || "C"}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {log.customer?.name || "Unknown Customer"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.customer?.phone || "No phone"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.customer?.email || "No email"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[log.status] || "bg-gray-500"
                      } text-white`}
                    >
                      {log.status}
                    </span>
                    {log.failure_reason && (
                      <div className="text-xs text-red-500 mt-1">
                        {log.failure_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {timeline.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              statusColors[item.status]
                            } text-white`}
                          >
                            {item.status}
                          </span>
                          {index < timeline.length - 1 && (
                            <span className="mx-2 text-gray-400">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lastUpdate ? new Date(lastUpdate).toLocaleString() : "Not updated"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Campaigns;
