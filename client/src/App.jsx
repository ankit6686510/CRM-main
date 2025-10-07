import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import React from "react";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "react-hot-toast";
import { ApiProvider, useApi } from "./context/ApiContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import Customers from "./pages/Customers";
import Analytics from "./pages/Analytics";
import EmailSettingsV2 from "./pages/EmailSettingsV2";
import Footer from "./component/common/Footer";
import Navbar from "./component/common/Navbar";
import Segment from "./component/Campaign/Segment";
import Audience from "./pages/Audience";

// Layout component that includes navbar and footer
const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet /> {/* This renders the matched child route */}
      </main>
    </div>
  );
};

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useApi();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-700"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <>
      <BrowserRouter>
        <ApiProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* Protected routes with layout */}
            <Route element={<MainLayout />}>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns"
                element={
                  <ProtectedRoute>
                    <Campaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/create"
                element={
                  <ProtectedRoute>
                    <Segment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audience"
                element={
                  <ProtectedRoute>
                    <Audience />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/email-settings"
                element={
                  <ProtectedRoute>
                    <EmailSettingsV2 />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ApiProvider>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;
