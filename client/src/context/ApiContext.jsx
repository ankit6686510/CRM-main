import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { useLocation } from "react-router-dom";

const ApiContext = createContext();

// ApiProvider component
export const ApiProvider = ({ children }) => {
  
// States
  const [authUser, setAuthUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Initial loading state
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState(null);
  
  // Global refresh state to trigger re-fetching across components
  const [dataVersion, setDataVersion] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const location = useLocation();

  // Verify authentication
  const verifyAuth = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/auth/verify", {
        withCredentials: true,
      });
      setAuthUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
     // If the error is not 401 (unauthorized), log the error
      if (error.response?.status !== 401) {
        console.error("Auth verification error:", error);
      }
      setAuthUser(null);
      setIsAuthenticated(false);
      // If we're not on the login or home page, redirect to login
      if (location.pathname !== "/login" && location.pathname !== "/") {
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  // Call verifyAuth only once on initial load
  useEffect(() => {
    verifyAuth();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await axiosInstance.get("/customer/get");
      setCustomers(response.data.data);

      return response.data.data;
    } catch (error) {
      setCustomerError(
        error.response?.data?.message || "Failed to fetch customers"
      );
      throw error;
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Load customers only after successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated]);

  // Refresh token function to be called when needed
  const refreshToken = async () => {
    try {
      await axiosInstance.post(
        "/auth/refresh-token",
        {},
        { withCredentials: true }
      );
    } catch (error) {
      logout();
      throw error;
    }
  };

  // Google login
  const googleLogin = async (credentialResponse) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post("/auth/google-login", {
        token: credentialResponse.credential,
      });

      const { user } = response.data.data;
      setAuthUser(user);
      setIsAuthenticated(true);

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Google login failed";
      toast.error(errorMessage);
      console.error("Google Login Error:", error);
    } finally {
      setLoading(false);
    }
  };
// Logout function
  const logout = async () => {
    try {
      // Use axiosInstance instead of direct axios call
      const response = await axiosInstance.post("/auth/logout");

      if (response.data.statusCode === 200) {
        // Clear auth state
        setAuthUser(null);
        setIsAuthenticated(false);
        
        // Clear stored user data
        localStorage.removeItem('user');
        
        toast.success("Logged out successfully");
        navigate("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if the API call fails, we should still clear the local state
      setAuthUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      navigate("/");
      toast.error(error?.response?.data?.message || "Failed to logout");
    }
  };

  // Global refresh function to trigger data refresh across all components
  const refreshGlobalData = () => {
    setDataVersion(prev => prev + 1);
    setRefreshTrigger(Date.now());
    // Also refresh customers immediately
    if (isAuthenticated) {
      fetchCustomers();
    }
  };

  const CustomValueEditor = ({ field, operator, value, handleOnChange }) => {
    // Render a text input for most cases
    return (
      <input
        type={field === "age" || field === "total_spent" || field === "order_count" || field === "last_purchase" ? "number" : "text"}
        value={value}
        onChange={(e) => handleOnChange(e.target.value)}
        className="w-auto px-2 py-1 border rounded"
      />
    );
  };

  return (
    <ApiContext.Provider
      value={{
        authUser,
        isAuthenticated,
        loading,
        verifyAuth,
        googleLogin,
        logout,
        fetchCustomers,
        customers,
        loadingCustomers,
        customerError,
        CustomValueEditor,
        axiosInstance,
        // Global refresh functionality
        refreshGlobalData,
        dataVersion,
        refreshTrigger,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => useContext(ApiContext);

// Custom Value Editor for React Query Builder (example)
export const CustomValueEditor = ({ field, operator, value, handleOnChange }) => {
  // Render a text input for most cases
  return (
    <input
      type={field === "age" || field === "total_spent" || field === "order_count" || field === "last_purchase" ? "number" : "text"}
      value={value}
      onChange={(e) => handleOnChange(e.target.value)}
      className="w-auto px-2 py-1 border rounded"
    />
  );
};
