import { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";
import React from "react";
import LoadingSpinner from "../component/common/LoadingSpinner";
import { toast } from "react-hot-toast";
import { FiUpload, FiDownload, FiSearch, FiTrash2, FiFilter, FiEdit2 } from "react-icons/fi";
import { useApi } from "../context/ApiContext";

const Customers = () => {
  const { refreshGlobalData } = useApi();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    city: "",
    gender: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: {
      city: "",
      state: "",
      country: ""
    },
    demographics: {
      gender: "",
      age: "",
      occupation: ""
    },
    stats: {
      total_spent: 0,
      order_count: 0
    }
  });

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/customer/");
      setCustomers(response.data.data);
      setFilteredCustomers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters when they change
  useEffect(() => {
    const filtered = customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        (filters.city === "" ||
          customer.address?.city
            ?.toLowerCase()
            .includes(filters.city.toLowerCase())) &&
        (filters.gender === "" ||
          customer.demographics?.gender?.toLowerCase() ===
            filters.gender.toLowerCase())
      );
    });
    setFilteredCustomers(filtered);
  }, [filters, customers]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      toast.error('Please upload a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await axiosInstance.post('/customer/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(response.data.message);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload customers');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const downloadTemplate = () => {
    // Enhanced template with all supported fields for comprehensive analytics
    const headers = [
      'name', 'email', 'phone', 'city', 'state', 'country', 
      'gender', 'age', 'occupation', 'total_spent', 'order_count', 'joined_date'
    ];
    
    // Add sample data row to show format
    const sampleData = [
      'John Doe', 'john.doe@example.com', '9876543210', 'Mumbai', 'Maharashtra', 'India',
      'male', '28', 'Software Engineer', '1500.50', '5', '2023-01-15'
    ];
    
    const csvContent = headers.join(',') + '\n' + sampleData.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_template_enhanced.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Enhanced template downloaded! Includes all fields for proper analytics.');
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      const response = await axiosInstance.delete(`/customer/${customerId}`);
      if (response.data.success) {
        toast.success(response.data.message || "Customer deactivated successfully");
        setCustomers(prevCustomers => prevCustomers.filter(c => c._id !== customerId));
        setFilteredCustomers(prevCustomers => prevCustomers.filter(c => c._id !== customerId));
      } else {
        toast.error(response.data.message || "Failed to deactivate customer");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to deactivate customer");
    }
    setCustomerToDelete(null);
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.put(`/customer/${customerToEdit._id}`, editForm);
      toast.success("Customer updated successfully");
      fetchCustomers();
      setCustomerToEdit(null);
      // Trigger global refresh to update all components
      refreshGlobalData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update customer");
    }
  };

  const openEditModal = (customer) => {
    setCustomerToEdit(customer);
    setEditForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: {
        state: customer.address?.state || "",
        country: customer.address?.country || ""
      },
      demographics: {
        gender: customer.demographics?.gender || "",
        age: customer.demographics?.age || "",
      },
      stats: {
        total_spent: customer.stats?.total_spent || 0,
        order_count: customer.stats?.order_count || 0
      }
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading Customers..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Customer Management</h1>
              <p className="text-blue-600 mt-1">Manage and organize your customer database</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiDownload className="w-5 h-5" />
                Download Template
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                <FiUpload className="w-5 h-5" />
                {uploading ? "Uploading..." : "Upload CSV"}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                <input
                  type="text"
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FiFilter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-100">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={filters.city}
                    onChange={handleFilterChange}
                    placeholder="Filter by city"
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={filters.gender}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-100">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer._id}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {customer.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-blue-900">
                              {customer.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-blue-900">
                          {customer.email}
                        </div>
                        <div className="text-sm text-blue-600">
                          {customer.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-blue-900">
                           {customer.address?.state || "N/A"}, {customer.address?.country || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-blue-900">
                          ₹{customer.stats?.total_spent?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-blue-600">
                          {customer.stats?.order_count || 0} orders
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => openEditModal(customer)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setCustomerToDelete(customer)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-blue-600"
                    >
                      No customers found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {customerToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Edit Customer</h3>
            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={editForm.address.state}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Country</label>
                  <input
                    type="text"
                    name="address.country"
                    value={editForm.address.country}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Gender</label>
                  <select
                    name="demographics.gender"
                    value={editForm.demographics.gender}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Age</label>
                  <input
                    type="number"
                    name="demographics.age"
                    value={editForm.demographics.age}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Total Spent</label>
                  <input
                    type="number"
                    name="stats.total_spent"
                    value={editForm.stats.total_spent}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">Order Count</label>
                  <input
                    type="number"
                    name="stats.order_count"
                    value={editForm.stats.order_count}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setCustomerToEdit(null)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Delete Customer</h3>
            <p className="text-blue-600 mb-6">
              Are you sure you want to delete {customerToDelete.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCustomer(customerToDelete._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
