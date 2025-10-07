import React from "react";
import { Link } from "react-router-dom";
import { 
  FiGithub, 
  FiLinkedin, 
  FiGlobe, 
  FiUsers, 
  FiTarget, 
  FiTrendingUp, 
  FiMail, 
  FiArrowRight,
  FiCheck,
  FiStar,
  FiShield,
  FiZap,
  FiPhone,
  FiMapPin
} from "react-icons/fi";

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link 
              to="/" 
              className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-10 h-10 mr-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <span className="text-2xl font-bold" style={{color: '#1D4ED8'}}>InsightCRM</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Features</a>
              <a href="#contact" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Contact</a>
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-8">
              <FiStar className="w-4 h-4 mr-2" />
              Next-Generation Customer Relationship Management
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 leading-tight">
              Transform Your
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Customer Journey
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              AI-powered segmentation, automated campaigns, and real-time analytics. 
              Build meaningful relationships that drive growth.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                to="/login"
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center"
              >
                Start Free Trial
                <FiArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="text-slate-700 px-8 py-4 rounded-2xl font-semibold text-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300">
                View Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-slate-500 text-sm">
              <div className="flex items-center">
                <FiShield className="w-4 h-4 mr-2" />
                Enterprise Security
              </div>
              <div className="flex items-center">
                <FiZap className="w-4 h-4 mr-2" />
                AI-Powered Insights
              </div>
              <div className="flex items-center">
                <FiCheck className="w-4 h-4 mr-2" />
                No Setup Required
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to help you understand, engage, and grow your customer base.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiUsers className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Smart Segmentation</h3>
              <p className="text-slate-600 leading-relaxed">
                AI-powered customer segmentation based on behavior, demographics, and purchase history for targeted campaigns.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiMail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Campaign Automation</h3>
              <p className="text-slate-600 leading-relaxed">
                Create, schedule, and track email campaigns with advanced analytics and real-time performance insights.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiTrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Advanced Analytics</h3>
              <p className="text-slate-600 leading-relaxed">
                Deep insights into customer behavior, campaign performance, and revenue attribution with beautiful dashboards.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiTarget className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Audience Targeting</h3>
              <p className="text-slate-600 leading-relaxed">
                Precisely target your ideal customers with custom filters and dynamic audience building tools.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiZap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Real-time Tracking</h3>
              <p className="text-slate-600 leading-relaxed">
                Monitor email opens, clicks, and engagement in real-time with advanced tracking and attribution.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiShield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Enterprise Security</h3>
              <p className="text-slate-600 leading-relaxed">
                Bank-level security with data encryption, user permissions, and compliance with industry standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-6">Contact</h2>
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200/50 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="mailto:mr.rayyan2005@gmail.com" className="flex items-center p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 hover:text-blue-700 transition-all duration-300 group border border-blue-100/50 hover:border-blue-200 hover:shadow-md">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <FiMail className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">mr.rayyan2005@gmail.com</span>
              </a>
              <a href="mailto:ankit6686510@gmail.com" className="flex items-center p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 hover:text-purple-700 transition-all duration-300 group border border-purple-100/50 hover:border-purple-200 hover:shadow-md">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <FiMail className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">ankit6686510@gmail.com</span>
              </a>
              <a href="tel:+919897700769" className="flex items-center p-3 rounded-2xl bg-gradient-to-r from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200/50 hover:text-green-700 transition-all duration-300 group border border-green-100/50 hover:border-green-200 hover:shadow-md">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <FiPhone className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">+91 98977 00769</span>
              </a>
              <a href="tel:+919310934230" className="flex items-center p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100/50 hover:from-orange-100 hover:to-orange-200/50 hover:text-orange-700 transition-all duration-300 group border border-orange-100/50 hover:border-orange-200 hover:shadow-md">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <FiPhone className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">+91 93109 34230</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <Link 
                to="/" 
                className="flex items-center mb-4 hover:opacity-80 transition-opacity cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <div className="w-8 h-8 mr-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">I</span>
                </div>
                <span className="text-xl font-bold" style={{color: 'white'}}>InsightCRM</span>
              </Link>
              <p className="text-slate-400 max-w-md leading-relaxed">
                Next-generation customer relationship management platform designed to help businesses build meaningful customer relationships and drive growth.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Automation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-400 text-sm">
                © {new Date().getFullYear()} InsightCRM. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a
                  href="https://github.com/mrrayyan2005/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <FiGithub className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com/in/mohd-rayyan-380173285/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <FiLinkedin className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <FiGlobe className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
