import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../component/common/LoadingSpinner";
import Modal from "../component/dashboard/Modal";
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiFilter,
  FiTrendingUp,
  FiTrendingDown,
  FiMapPin,
  FiDollarSign,
  FiMail,
  FiClock,
  FiEye,
  FiBarChart2,
  FiPieChart,
  FiTarget,
  FiActivity,
  FiLayers,
  FiGlobe,
  FiCalendar,
  FiDownload,
  FiRefreshCw
} from "react-icons/fi";

const Audience = () => {
  const { axiosInstance, refreshTrigger } = useApi();
  const navigate = useNavigate();
  const [segments, setSegments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [segmentPreview, setSegmentPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [audienceStats, setAudienceStats] = useState({});
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchAllData();
    }
  }, [refreshTrigger]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSegmentsAndCampaigns(),
        fetchCustomers(),
        fetchAudienceStats()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSegmentsAndCampaigns = async () => {
    try {
      // Fetch both segments and campaigns
      const [segmentsResponse, campaignsResponse] = await Promise.all([
        axiosInstance.get("/user/get-segment"),
        axiosInstance.get("/user/get-campaign")
      ]);
      
      const allSegments = segmentsResponse.data.data || [];
      const activeCampaigns = campaignsResponse.data.data || [];
      
      // Get segment IDs that are used in active campaigns - handle different data types
      const activeSegmentIds = activeCampaigns.map(campaign => {
        // Handle both string IDs and object references
        if (typeof campaign.segment_id === 'object' && campaign.segment_id._id) {
          return campaign.segment_id._id;
        }
        return campaign.segment_id;
      }).filter(Boolean); // Remove any undefined/null values
      
      // Filter segments to only include those used in active campaigns
      const activeSegments = allSegments.filter(segment => {
        // Convert both to strings for comparison to handle ObjectId vs string issues
        const segmentId = segment._id.toString();
        return activeSegmentIds.some(activeId => activeId.toString() === segmentId);
      });
      
      console.log('Active campaigns:', activeCampaigns.length);
      console.log('Active segment IDs:', activeSegmentIds);
      console.log('Filtered segments:', activeSegments.length);
      
      setSegments(activeSegments);
      setCampaigns(activeCampaigns); // Store campaigns for finding communication logs
    } catch (error) {
      console.error("Error fetching segments:", error);
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

  const fetchAudienceStats = async () => {
    try {
      // Calculate comprehensive audience statistics
      const response = await axiosInstance.get("/customer/get");
      const customerData = response.data.data || [];
      
      const stats = calculateAudienceStats(customerData);
      setAudienceStats(stats);
    } catch (error) {
      console.error("Error fetching audience stats:", error);
    }
  };

  const calculateAudienceStats = (customerData) => {
    if (!customerData || customerData.length === 0) {
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        genderStats: {},
        ageGroups: {},
        locationStats: {},
        spendingTiers: {},
        engagementRate: 0
      };
    }

    // Basic metrics - only real data
    const totalCustomers = customerData.length;
    const activeCustomers = customerData.filter(c => c.is_active).length;
    const totalRevenue = customerData.reduce((sum, c) => sum + (c.stats?.total_spent || 0), 0);
    const totalOrders = customerData.reduce((sum, c) => sum + (c.stats?.order_count || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Demographics - only from actual data
    const genderStats = customerData.reduce((acc, c) => {
      if (c.demographics?.gender) {
        const gender = c.demographics.gender;
        acc[gender] = (acc[gender] || 0) + 1;
      }
      return acc;
    }, {});

    const ageGroups = customerData.reduce((acc, c) => {
      const age = c.demographics?.age;
      if (age) {
        let group;
        if (age < 25) group = '18-24';
        else if (age < 35) group = '25-34';
        else if (age < 45) group = '35-44';
        else if (age < 55) group = '45-54';
        else group = '55+';
        
        acc[group] = (acc[group] || 0) + 1;
      }
      return acc;
    }, {});

    // Geographic distribution - only real cities
    const locationStats = customerData.reduce((acc, c) => {
      if (c.address?.city) {
        const city = c.address.city;
        acc[city] = (acc[city] || 0) + 1;
      }
      return acc;
    }, {});

    // Spending tiers - only actual spending data
    const spendingTiers = customerData.reduce((acc, c) => {
      const spent = c.stats?.total_spent || 0;
      let tier;
      if (spent === 0) tier = 'No Purchases';
      else if (spent < 1000) tier = '₹1-999';
      else if (spent < 5000) tier = '₹1K-5K';
      else if (spent < 10000) tier = '₹5K-10K';
      else tier = '₹10K+';
      
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});

    return {
      totalCustomers,
      activeCustomers,
      totalRevenue,
      avgOrderValue,
      genderStats,
      ageGroups,
      locationStats: Object.entries(locationStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((acc, [city, count]) => {
          acc[city] = count;
          return acc;
        }, {}),
      spendingTiers,
      engagementRate: totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0
    };
  };

  // Fetch communication logs with loading state (same as Dashboard/Campaigns)
  const fetchCommunicationLogs = async (segment) => {
    try {
      setLogsLoading(true);
      
      // Find the campaign that uses this segment
      const campaign = campaigns.find(c => {
        const campaignSegmentId = typeof c.segment_id === 'object' ? c.segment_id._id : c.segment_id;
        return campaignSegmentId.toString() === segment._id.toString();
      });

      if (!campaign) {
        toast.error("No campaign found for this segment");
        return;
      }

      const response = await axiosInstance.get(
        `/user/get-log?campaignId=${campaign._id}`
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

  const fetchSegmentPreview = async (segment) => {
    try {
      setPreviewLoading(true);
      const response = await axiosInstance.post("/user/get-segment-preview", {
        rules: segment.rules
      });
      setSegmentPreview(response.data.data);
      setSelectedSegment(segment);
    } catch (error) {
      toast.error("Failed to fetch segment preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateSegment = () => {
    navigate("/campaigns/create");
  };

  const filteredSegments = segments.filter((segment) =>
    segment.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner label="Loading Audience Insights..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-purple-900 mb-2">Audience Intelligence</h1>
            <p className="text-purple-600">Comprehensive insights into your customer base and segments</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={fetchAllData}
              className="px-4 py-2 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleCreateSegment}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Create Segment
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Audience</p>
                <h3 className="text-2xl font-bold text-purple-900 mt-1">
                  {audienceStats.totalCustomers?.toLocaleString() || 0}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600">
                    Real customer data
                  </span>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <FiUsers className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Customers</p>
                <h3 className="text-2xl font-bold text-green-900 mt-1">
                  {audienceStats.activeCustomers?.toLocaleString() || 0}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600">
                    {audienceStats.engagementRate}% engagement
                  </span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <FiActivity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Revenue</p>
                <h3 className="text-2xl font-bold text-blue-900 mt-1">
                  ₹{(audienceStats.totalRevenue || 0).toLocaleString()}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600">
                    ₹{Math.round(audienceStats.avgOrderValue || 0)} avg order
                  </span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <FiDollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Segments</p>
                <h3 className="text-2xl font-bold text-orange-900 mt-1">
                  {segments.length}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600">
                    Active segments
                  </span>
                </div>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <FiTarget className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Demographics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Age Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
              <FiBarChart2 className="w-5 h-5" />
              Age Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(audienceStats.ageGroups || {}).map(([age, count]) => (
                <div key={age} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{age}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / audienceStats.totalCustomers) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spending Tiers */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
              <FiDollarSign className="w-5 h-5" />
              Spending Tiers
            </h3>
            <div className="space-y-3">
              {Object.entries(audienceStats.spendingTiers || {}).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{tier}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / audienceStats.totalCustomers) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 mb-8">
          <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
            <FiMapPin className="w-5 h-5" />
            Top Locations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(audienceStats.locationStats || {}).map(([city, count]) => (
              <div key={city} className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-900">{count}</div>
                <div className="text-sm text-purple-600">{city}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Segments Management */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="p-6 border-b border-purple-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                <FiLayers className="w-5 h-5" />
                Audience Segments
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Search segments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">
                    Segment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-purple-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {filteredSegments.length > 0 ? (
                  filteredSegments.map((segment) => (
                    <tr key={segment._id} className="hover:bg-purple-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <h4 className="text-sm font-semibold text-purple-900">{segment.name}</h4>
                          <p className="text-sm text-purple-600">{segment.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {segment.estimated_count || 0} customers
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-900">
                        {segment.is_dynamic ? 'Dynamic' : 'Static'}
                      </td>
                      <td className="px-6 py-4 text-sm text-purple-900">
                        {new Date(segment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => fetchCommunicationLogs(segment)}
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all"
                          title="View Logs"
                          disabled={logsLoading}
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <FiTarget className="w-12 h-12 text-purple-400 mb-4" />
                        <h3 className="text-lg font-medium text-purple-900 mb-2">No segments found</h3>
                        <p className="text-purple-600 mb-4">
                          {searchQuery ? 'Try adjusting your search terms' : 'Create your first audience segment to get started'}
                        </p>
                        {!searchQuery && (
                          <button
                            onClick={handleCreateSegment}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                          >
                            <FiPlus className="w-4 h-4" />
                            Create Segment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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

        {/* Segment Preview Modal */}
        <Modal
          isOpen={!!selectedSegment}
          onClose={() => {
            setSelectedSegment(null);
            setSegmentPreview(null);
          }}
          title={`Segment: ${selectedSegment?.name}`}
          size="xl"
          blurBackground={false}
        >
          {previewLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner label="Loading segment details..." />
            </div>
          ) : (
            segmentPreview && <SegmentPreview segment={selectedSegment} preview={segmentPreview} />
          )}
        </Modal>
      </div>
    </div>
  );
};

// Communication Logs Component (same as Dashboard/Campaigns)
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

// Segment Preview Component
const SegmentPreview = ({ segment, preview }) => {
  return (
    <div className="space-y-6">
      {/* Segment Summary */}
      <div className="bg-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-purple-900 mb-2">{segment.name}</h3>
        <p className="text-purple-700 mb-4">{segment.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-900">{preview.totalCount}</div>
            <div className="text-sm text-purple-600">Total Customers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">
              ₹{(preview.spendingStats?.totalSpent || 0).toLocaleString()}
            </div>
            <div className="text-sm text-purple-600">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              ₹{Math.round(preview.spendingStats?.avgSpent || 0).toLocaleString()}
            </div>
            <div className="text-sm text-purple-600">Avg Spent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-900">
              {Math.round(preview.spendingStats?.avgOrders || 0)}
            </div>
            <div className="text-sm text-purple-600">Avg Orders</div>
          </div>
        </div>
      </div>

      {/* Demographics */}
      {preview.demographics && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4">Demographics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender Distribution */}
            {preview.demographics.gender && preview.demographics.gender.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Gender Distribution</h5>
                <div className="space-y-2">
                  {preview.demographics.gender.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{item.gender || 'Unknown'}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Age Groups */}
            {preview.demographics.ageGroups && preview.demographics.ageGroups.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Age Groups</h5>
                <div className="space-y-2">
                  {preview.demographics.ageGroups.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{item.ageGroup}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Cities */}
      {preview.cityDistribution && preview.cityDistribution.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4">Top Cities</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {preview.cityDistribution.map((item, index) => (
              <div key={index} className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="font-bold text-blue-900">{item.count}</div>
                <div className="text-sm text-blue-600">{item.city}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Customers */}
      {preview.sampleCustomers && preview.sampleCustomers.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4">Sample Customers</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.sampleCustomers.map((customer, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{customer.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{customer.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      ₹{(customer.stats?.total_spent || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {customer.stats?.order_count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Audience;
