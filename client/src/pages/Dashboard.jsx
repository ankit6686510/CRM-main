import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../component/common/LoadingSpinner";
import { useApi } from "../context/ApiContext";
import {
  FiCalendar,
  FiClock,
  FiUsers,
  FiMail,
  FiTarget,
  FiTrendingUp,
  FiPlus,
  FiArrowRight,
  FiCheck,
  FiActivity,
  FiSettings,
  FiBriefcase,
  FiStar,
  FiBookmark,
  FiPlay,
  FiPause,
  FiMoreHorizontal
} from "react-icons/fi";

const Dashboard = () => {
  const { authUser } = useApi();
  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get current time and date
  const now = new Date();
  const currentTime = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const currentDate = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, customersRes, segmentsRes] = await Promise.all([
        axiosInstance.get("/user/get-campaign"),
        axiosInstance.get("/customer/get"),
        axiosInstance.get("/user/get-segment")
      ]);
      
      setCampaigns(campaignsRes.data.data || []);
      setCustomers(customersRes.data.data || []);
      setSegments(segmentsRes.data.data || []);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Get recent activities
  const getRecentCampaigns = () => campaigns.slice(0, 3);
  const getRecentCustomers = () => customers.slice(0, 4);
  const getActiveSegments = () => segments.slice(0, 3);

  // Quick stats
  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'processing').length;
  const totalCustomers = customers.length;
  const totalSegments = segments.length;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;

  if (loading) {
    return <LoadingSpinner label="Loading your workspace..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome {authUser?.name || authUser?.email?.split('@')[0] || 'User'}! 👋</h1>
              <p className="text-slate-600 mt-1">Let's get productive today</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">{currentTime}</div>
              <div className="text-sm text-slate-600">{currentDate}</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Work</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{activeCampaigns}</p>
                <p className="text-xs text-green-600 mt-1">campaigns running</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <FiActivity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Customers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalCustomers}</p>
                <p className="text-xs text-blue-600 mt-1">in your database</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Segments</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalSegments}</p>
                <p className="text-xs text-purple-600 mt-1">audience groups</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <FiTarget className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completed</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{completedCampaigns}</p>
                <p className="text-xs text-orange-600 mt-1">successful campaigns</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <FiCheck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate("/campaigns/create")}
                  className="flex flex-col items-center p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all group"
                >
                  <div className="bg-blue-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                    <FiMail className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">New Campaign</span>
                </button>

                <button
                  onClick={() => navigate("/audience")}
                  className="flex flex-col items-center p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-all group"
                >
                  <div className="bg-green-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                    <FiUsers className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Add Customers</span>
                </button>

                <button
                  onClick={() => navigate("/audience")}
                  className="flex flex-col items-center p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-all group"
                >
                  <div className="bg-purple-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                    <FiTarget className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Create Segment</span>
                </button>

                <button
                  onClick={() => navigate("/analytics")}
                  className="flex flex-col items-center p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-all group"
                >
                  <div className="bg-orange-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                    <FiTrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">View Analytics</span>
                </button>

                <button
                  onClick={() => navigate("/email-settings")}
                  className="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group"
                >
                  <div className="bg-gray-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                    <FiSettings className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Email Settings</span>
                </button>

                <button
                  onClick={() => navigate("/customers")}
                  className="flex flex-col items-center p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-all group"
                >
                  <div className="bg-indigo-600 p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                    <FiBriefcase className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">Manage CRM</span>
                </button>
              </div>
            </div>

            {/* Recent Work */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Recent Campaigns</h2>
                <button
                  onClick={() => navigate("/campaigns")}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  View all <FiArrowRight className="w-4 h-4" />
                </button>
              </div>

              {getRecentCampaigns().length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FiMail className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No campaigns yet</h3>
                  <p className="text-slate-600 mb-4">Create your first campaign to get started</p>
                  <button
                    onClick={() => navigate("/campaigns/create")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Campaign
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {getRecentCampaigns().map((campaign) => (
                    <div key={campaign._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          campaign.status === 'active' ? 'bg-green-500' :
                          campaign.status === 'completed' ? 'bg-blue-500' :
                          campaign.status === 'processing' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}></div>
                        <div>
                          <h3 className="font-medium text-slate-900">{campaign.name}</h3>
                          <p className="text-sm text-slate-600">{campaign.template?.subject}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                          campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          campaign.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {campaign.status}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Today's Summary */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-bold mb-4">Today's Summary</h2>
              <div className="space-y-3">
                {activeCampaigns > 0 && (
                  <div className="flex items-center gap-3">
                    <FiActivity className="w-5 h-5 text-green-300" />
                    <span className="text-sm">{activeCampaigns} active campaign{activeCampaigns !== 1 ? 's' : ''} running</span>
                  </div>
                )}
                {customers.length > 0 && (
                  <div className="flex items-center gap-3">
                    <FiUsers className="w-5 h-5 text-blue-300" />
                    <span className="text-sm">{customers.length} customer{customers.length !== 1 ? 's' : ''} in database</span>
                  </div>
                )}
                {segments.length > 0 && (
                  <div className="flex items-center gap-3">
                    <FiTarget className="w-5 h-5 text-purple-300" />
                    <span className="text-sm">{segments.length} audience segment{segments.length !== 1 ? 's' : ''} created</span>
                  </div>
                )}
                {campaigns.length === 0 && customers.length === 0 && segments.length === 0 && (
                  <div className="flex items-center gap-3">
                    <FiStar className="w-5 h-5 text-yellow-300" />
                    <span className="text-sm">Ready to start your CRM journey!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Customers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Recent Customers</h2>
                <button
                  onClick={() => navigate("/customers")}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all
                </button>
              </div>

              {getRecentCustomers().length === 0 ? (
                <div className="text-center py-6">
                  <FiUsers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">No customers yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getRecentCustomers().map((customer, index) => (
                    <div key={customer._id || index} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {customer.name?.charAt(0) || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{customer.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-600 truncate">{customer.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Work Status */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Work Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Active Projects</span>
                  <span className="text-sm font-medium text-slate-900">{activeCampaigns}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Campaigns</span>
                  <span className="text-sm font-medium text-slate-900">{campaigns.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Completed</span>
                  <span className="text-sm font-medium text-slate-900">{completedCampaigns}</span>
                </div>
              </div>

              {campaigns.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Completion Rate</span>
                    <span className="font-medium text-slate-900">{Math.round((completedCampaigns / campaigns.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500" 
                      style={{width: `${Math.round((completedCampaigns / campaigns.length) * 100)}%`}}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
