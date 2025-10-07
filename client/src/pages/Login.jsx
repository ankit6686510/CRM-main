import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { useApi } from "../context/ApiContext";

const Login = () => {
  const { isAuthenticated, loading, googleLogin } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-8 flex flex-col justify-center">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to InsightCRM </h2>
          <p className="text-gray-500 text-base">Enter your credentials to access your dashboard</p>
        </div>
        <div className="mb-6">
          <GoogleOAuthProvider clientId="967385408580-bq048js5rmiceg63l83n5msvjo0rndn3.apps.googleusercontent.com">
            <GoogleLogin
              onSuccess={googleLogin}
              onError={() => toast.error("Google login failed")}
              theme="outline"
              size="large"
              shape="pill"
              text="continue with"
              width="100%"
            />
          </GoogleOAuthProvider>
        </div>
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
        <form className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition text-base bg-gray-50"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition text-base bg-gray-50"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 focus:ring-blue-600 focus:ring-offset-2 text-white font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition text-lg shadow-md"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
