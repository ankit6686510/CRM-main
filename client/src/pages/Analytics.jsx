import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../component/common/LoadingSpinner";
import {
  FiUsers,
  FiMail,
  FiBarChart2,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiX,
  FiDollarSign,
  FiEye,
  FiMousePointer,
  FiTarget,
  FiActivity,
  FiPieChart,
  FiRefreshCw,
  FiDownload,
  FiFilter
} from "react-icons/fi";

const Analytics = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [communicationLogs, setCommunicationLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [analyticsData, setAnalyticsData] = useState({});

  useEffect(() => {
    fetchAllAnalyticsData();
  }, [timeRange]);

  const fetchAllAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // First fetch campaigns and customers
      const [campaignsResponse, customersResponse] = await Promise.all([
        axiosInstance.get("/user/get-campaign"),
        axiosInstance.get("/customer/get")
      ]);
      
      const campaignsData = campaignsResponse.data.data || [];
      const customersData = customersResponse.data.data || [];
      
      setCampaigns(campaignsData);
      setCustomers(customersData);
      
      // Then fetch communication logs using the campaign data
      await fetchAllCommunicationLogsWithCampaigns(campaignsData);
      
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await axiosInstance.get("/user/get-campaign");
      setCampaigns(response.data.data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get("/customer/get");
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchAllCommunicationLogs = async () => {
    try {
      const allLogs = [];
      for (const campaign of campaigns) {
        try {
          const response = await axiosInstance.get(`/user/get-log?campaignId=${campaign._id}`);
          const logs = response.data.data || [];
          allLogs.push(...logs.map(log => ({ ...log, campaignId: campaign._id, campaignName: campaign.name })));
        } catch (error) {
          console.error(`Error fetching logs for campaign ${campaign._id}:`, error);
        }
      }
      setCommunicationLogs(allLogs);
    } catch (error) {
      console.error("Error fetching communication logs:", error);
    }
  };

  const fetchAllCommunicationLogsWithCampaigns = async (campaignsData) => {
    try {
      const allLogs = [];
      for (const campaign of campaignsData) {
        try {
          const response = await axiosInstance.get(`/user/get-log?campaignId=${campaign._id}`);
          const logs = response.data.data || [];
          allLogs.push(...logs.map(log => ({ ...log, campaignId: campaign._id, campaignName: campaign.name })));
        } catch (error) {
          console.error(`Error fetching logs for campaign ${campaign._id}:`, error);
        }
      }
      setCommunicationLogs(allLogs);
      console.log('Fetched communication logs:', allLogs.length);
    } catch (error) {
      console.error("Error fetching communication logs:", error);
    }
  };

  const calculateComprehensiveAnalytics = () => {
    const now = new Date();
    let startDate = new Date();
    
    // Calculate date range
    switch (timeRange) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Filter data by time range
    const filteredCampaigns = campaigns.filter(c => 
      new Date(c.createdAt) >= startDate
    );

    const filteredLogs = communicationLogs.filter(log => 
      new Date(log.sent_at || log.createdAt) >= startDate
    );

    // Campaign Metrics
    const totalCampaigns = filteredCampaigns.length;
    const activeCampaigns = filteredCampaigns.filter(c => c.status === "active").length;
    const completedCampaigns = filteredCampaigns.filter(c => c.status === "completed").length;
    const failedCampaigns = filteredCampaigns.filter(c => c.status === "failed").length;

    // Email Metrics
    const totalRecipients = filteredCampaigns.reduce((sum, c) => sum + (c.stats?.total_recipients || 0), 0);
    const totalSent = filteredCampaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
    const overallSuccessRate = totalRecipients > 0 ? (totalSent / totalRecipients) * 100 : 0;

    // Communication Log Analytics - Fixed to count by timestamps not just status
    const emailsSent = filteredLogs.filter(log => log.sent_at || log.status === 'sent' || log.status === 'delivered' || log.status === 'opened' || log.status === 'clicked').length;
    const emailsDelivered = filteredLogs.filter(log => log.delivered_at || log.status === 'delivered' || log.status === 'opened' || log.status === 'clicked').length;
    const emailsOpened = filteredLogs.filter(log => log.opened_at || log.status === 'opened' || log.status === 'clicked').length;
    const emailsClicked = filteredLogs.filter(log => log.clicked_at || log.status === 'clicked').length;
    const emailsFailed = filteredLogs.filter(log => log.status === 'failed').length;

    // Engagement Rates
    const deliveryRate = emailsSent > 0 ? (emailsDelivered / emailsSent) * 100 : 0;
    const openRate = emailsDelivered > 0 ? (emailsOpened / emailsDelivered) * 100 : 0;
    const clickRate = emailsOpened > 0 ? (emailsClicked / emailsOpened) * 100 : 0;
    const clickThroughRate = emailsDelivered > 0 ? (emailsClicked / emailsDelivered) * 100 : 0;

    // Customer Analytics
    const activeCustomers = customers.filter(c => c.is_active).length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.stats?.total_spent || 0), 0);
    const totalOrders = customers.reduce((sum, c) => sum + (c.stats?.order_count || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Status Distribution
    const statusDistribution = {
      sent: filteredLogs.filter(log => log.status === 'sent').length,
      delivered: filteredLogs.filter(log => log.status === 'delivered').length,
      opened: filteredLogs.filter(log => log.status === 'opened').length,
      clicked: filteredLogs.filter(log => log.status === 'clicked').length,
      failed: filteredLogs.filter(log => log.status === 'failed').length,
      queued: filteredLogs.filter(log => log.status === 'queued').length,
    };

    // Campaign Performance Rankings
    const campaignPerformance = filteredCampaigns.map(campaign => {
      const campaignLogs = filteredLogs.filter(log => log.campaignId === campaign._id);
      const sent = campaignLogs.filter(log => log.sent_at || log.status === 'sent' || log.status === 'delivered' || log.status === 'opened' || log.status === 'clicked').length;
      const delivered = campaignLogs.filter(log => log.delivered_at || log.status === 'delivered' || log.status === 'opened' || log.status === 'clicked').length;
      const opened = campaignLogs.filter(log => log.opened_at || log.status === 'opened' || log.status === 'clicked').length;
      const clicked = campaignLogs.filter(log => log.clicked_at || log.status === 'clicked').length;
      
      return {
        ...campaign,
        performance: {
          sent,
          delivered,
          opened,
          clicked,
          deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
          openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
          clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
          overallScore: sent > 0 ? ((delivered + opened + clicked) / (sent * 3)) * 100 : 0
        }
      };
    }).sort((a, b) => b.performance.overallScore - a.performance.overallScore);

    return {
      // Campaign Metrics
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      failedCampaigns,
      
      // Email Metrics
      totalRecipients,
      totalSent,
      overallSuccessRate,
      emailsSent,
      emailsDelivered,
      emailsOpened,
      emailsClicked,
      emailsFailed,
      
      // Engagement Rates
      deliveryRate,
      openRate,
      clickRate,
      clickThroughRate,
      
      // Customer Metrics
      totalCustomers: customers.length,
      activeCustomers,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      
      // Distributions
      statusDistribution,
      campaignPerformance
    };
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
    return <LoadingSpinner label="Loading Advanced Analytics..." />;
  }

  const analytics = calculateComprehensiveAnalytics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Advanced Analytics</h1>
              <p className="text-blue-600 mt-1">Comprehensive insights into your marketing performance</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchAllAnalyticsData}
                className="px-4 py-2 border border-blue-200 rounded-xl bg-white text-blue-900 hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-blue-200 rounded-xl bg-white text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Campaigns</p>
                <h3 className="text-2xl font-bold text-blue-900 mt-1">{analytics.totalCampaigns}</h3>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600">{analytics.activeCampaigns} active</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-600">{analytics.completedCampaigns} completed</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <FiBarChart2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Delivery Rate</p>
                <h3 className="text-2xl font-bold text-green-900 mt-1">{analytics.deliveryRate.toFixed(1)}%</h3>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-600">{analytics.emailsDelivered} of {analytics.emailsSent}</span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Open Rate</p>
                <h3 className="text-2xl font-bold text-purple-900 mt-1">{analytics.openRate.toFixed(1)}%</h3>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-600">{analytics.emailsOpened} opened</span>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <FiEye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Click Rate</p>
                <h3 className="text-2xl font-bold text-indigo-900 mt-1">{analytics.clickThroughRate.toFixed(1)}%</h3>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-600">{analytics.emailsClicked} clicked</span>
                </div>
              </div>
              <div className="bg-indigo-100 p-3 rounded-xl">
                <FiMousePointer className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Customer Insights</h3>
              <FiUsers className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Customers</span>
                <span className="font-medium text-blue-900">{analytics.totalCustomers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Customers</span>
                <span className="font-medium text-green-700">{analytics.activeCustomers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-medium text-blue-900">₹{analytics.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Order Value</span>
                <span className="font-medium text-blue-900">₹{Math.round(analytics.averageOrderValue).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Email Status Distribution</h3>
              <FiPieChart className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Delivered</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-green-500 rounded-full" 
                      style={{ width: `${analytics.emailsSent > 0 ? (analytics.emailsDelivered / analytics.emailsSent) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analytics.emailsDelivered}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Opened</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-purple-500 rounded-full" 
                      style={{ width: `${analytics.emailsSent > 0 ? (analytics.emailsOpened / analytics.emailsSent) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analytics.emailsOpened}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Clicked</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-indigo-500 rounded-full" 
                      style={{ width: `${analytics.emailsSent > 0 ? (analytics.emailsClicked / analytics.emailsSent) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analytics.emailsClicked}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Failed</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-red-500 rounded-full" 
                      style={{ width: `${analytics.emailsSent > 0 ? (analytics.emailsFailed / analytics.emailsSent) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analytics.emailsFailed}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Engagement Breakdown</h3>
              <FiActivity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Rate</span>
                <span className="font-medium text-green-700">{analytics.deliveryRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Open Rate</span>
                <span className="font-medium text-purple-700">{analytics.openRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Click-through Rate</span>
                <span className="font-medium text-indigo-700">{analytics.clickThroughRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Click Rate</span>
                <span className="font-medium text-blue-700">{analytics.clickRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Campaigns */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-blue-900">Campaign Performance Ranking</h2>
            <FiTarget className="w-5 h-5 text-blue-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Delivery Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Open Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Click Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Overall Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {analytics.campaignPerformance.slice(0, 10).map((campaign, index) => (
                  <tr key={campaign._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-blue-900">{campaign.performance.deliveryRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-blue-900">{campaign.performance.openRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-blue-900">{campaign.performance.clickRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 mr-2">
                          <div className="h-2 bg-blue-100 rounded-full">
                            <div
                              className="h-2 bg-blue-600 rounded-full"
                              style={{ width: `${campaign.performance.overallScore}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-blue-900">{campaign.performance.overallScore.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedCampaign(campaign)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="View Details"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Campaign Details Modal */}
        {selectedCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-blue-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-blue-900">Campaign Analytics Detail</h2>
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900 mb-4">Campaign Information</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Name</p>
                        <p className="text-blue-900">{selectedCampaign.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCampaign.status)}`}>
                          {getStatusIcon(selectedCampaign.status)}
                          <span className="ml-1.5 capitalize">{selectedCampaign.status}</span>
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Created</p>
                        <p className="text-blue-900">{new Date(selectedCampaign.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-blue-900 mb-4">Performance Metrics</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Delivery Rate</p>
                        <p className="text-blue-900">{selectedCampaign.performance.deliveryRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Open Rate</p>
                        <p className="text-blue-900">{selectedCampaign.performance.openRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Click Rate</p>
                        <p className="text-blue-900">{selectedCampaign.performance.clickRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Overall Score</p>
                        <div className="flex items-center">
                          <div className="w-32 mr-2">
                            <div className="h-2 bg-blue-100 rounded-full">
                              <div
                                className="h-2 bg-blue-600 rounded-full"
                                style={{ width: `${selectedCampaign.performance.overallScore}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-blue-900">{selectedCampaign.performance.overallScore.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-blue-900 mb-4">Campaign Statistics</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Recipients</p>
                        <p className="text-blue-900">{selectedCampaign.stats?.total_recipients || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Emails Sent</p>
                        <p className="text-blue-900">{selectedCampaign.performance.sent}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Emails Delivered</p>
                        <p className="text-blue-900">{selectedCampaign.performance.delivered}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Emails Opened</p>
                        <p className="text-blue-900">{selectedCampaign.performance.opened}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Emails Clicked</p>
                        <p className="text-blue-900">{selectedCampaign.performance.clicked}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-4">Campaign Message</h3>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-600 mb-2">Subject</p>
                    <p className="text-blue-900 mb-4">{selectedCampaign.template.subject}</p>
                    <p className="text-sm font-medium text-blue-600 mb-2">Message</p>
                    <p className="text-blue-900 whitespace-pre-wrap">{selectedCampaign.template.body}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
