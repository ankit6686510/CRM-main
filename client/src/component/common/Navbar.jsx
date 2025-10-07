import { Link, useLocation } from "react-router-dom";
import { useApi } from "../../context/ApiContext";
import React, { useState, useEffect, useRef } from "react";
import {
  FiUsers,
  FiPieChart,
  FiChevronDown,
  FiMenu,
  FiX,
  FiGrid,
  FiSend,
  FiUser,
  FiLogOut,
  FiMail,
} from "react-icons/fi";

const Navbar = () => {
  const { authUser, logout } = useApi();
  const location = useLocation();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const profileBtnRef = useRef(null);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <FiGrid /> },
    { path: "/campaigns", label: "Campaigns", icon: <FiSend /> },
    { path: "/customers", label: "Customers", icon: <FiUser /> },
    { path: "/audience", label: "Audience", icon: <FiUsers /> },
    { path: "/analytics", label: "Analytics", icon: <FiPieChart /> },
    { path: "/email-settings", label: "Email Settings", icon: <FiMail /> },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target) && 
          profileBtnRef.current && !profileBtnRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!isUserMenuOpen);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-white/80 shadow-md border-b border-blue-100/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-extrabold text-blue-700 tracking-tight"
            >
              InsightCRM
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-200 focus:outline-none"
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              item.external ? (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </a>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                ref={profileBtnRef}
                onClick={toggleUserMenu}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-700 focus:outline-none"
              >
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {authUser?.name?.charAt(0) || "U"}
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {authUser?.name || "User"}
                </span>
                <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                  isUserMenuOpen ? "transform rotate-180" : ""
                }`} />
              </button>
              {isUserMenuOpen && (
                <div
                  ref={userMenuRef}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10"
                >
                  <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                    {authUser?.email || "No email"}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 w-full text-left"
                  >
                    <FiLogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 space-y-2 bg-white/90 backdrop-blur border-t border-gray-200 transition-all duration-300">
          {navItems.map((item) => (
            item.external ? (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg text-base font-medium transition ${
                  location.pathname === item.path
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            )
          ))}

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <FiLogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
