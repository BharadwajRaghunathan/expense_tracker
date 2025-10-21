/**
 * Unauthorized Component
 * 401 Error Page - Unauthorized Access
 * Displayed when user tries to access protected routes without authentication
 */

import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MdLock,
  MdLogin,
  MdHome,
  MdArrowBack,
  MdSecurity,
  MdWarning,
} from 'react-icons/md';
import { isAuthenticated } from '../utils/auth';

const Unauthorized = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = isAuthenticated();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center">
          {/* 401 Illustration */}
          <div className="mb-8">
            <div className="relative inline-block">
              {/* Large 401 Text */}
              <h1 className="text-[180px] md:text-[250px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-500 to-yellow-500 leading-none select-none">
                401
              </h1>
              
              {/* Lock Icon */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <MdLock className="text-6xl md:text-8xl text-gray-400" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <MdWarning className="text-white text-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              {isLoggedIn 
                ? "You don't have permission to access this page."
                : "You need to be logged in to access this page."
              }
            </p>
            <p className="text-gray-500">
              {isLoggedIn
                ? "Please contact an administrator if you believe this is an error."
                : "Please sign in with your account credentials."}
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 max-w-2xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <MdSecurity className="text-2xl text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Why am I seeing this?
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {!isLoggedIn ? (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>You're not currently logged in to the application</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>Your session may have expired</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>You've been logged out for security reasons</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>This page requires special permissions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>Your account doesn't have access to this resource</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>The page URL might be incorrect</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MdWarning className="text-xl text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 text-left">
                  <strong className="text-gray-900">Security Notice:</strong> If you're 
                  attempting to access this page without authorization, please note that all 
                  access attempts are logged and monitored.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-red-700 hover:to-orange-700 transition-all transform hover:-translate-y-1"
                >
                  <MdLogin className="text-xl" />
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-1"
                >
                  Create Account
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-1"
                >
                  <MdArrowBack className="text-xl" />
                  Go Back
                </button>

                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-red-700 hover:to-orange-700 transition-all transform hover:-translate-y-1"
                >
                  <MdHome className="text-xl" />
                  Go to Dashboard
                </Link>
              </>
            )}
          </div>

          {/* Quick Access Links */}
          {isLoggedIn && (
            <div className="mt-8">
              <p className="text-sm text-gray-600 mb-4">Quick access to your pages:</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/expenses"
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow"
                >
                  My Expenses
                </Link>
                <Link
                  to="/analytics"
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow"
                >
                  Analytics
                </Link>
                <Link
                  to="/profile"
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow"
                >
                  Profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
