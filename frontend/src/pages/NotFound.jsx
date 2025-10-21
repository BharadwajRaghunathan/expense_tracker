/**
 * NotFound Component
 * 404 Error Page - Page Not Found
 * Displayed when user navigates to non-existent route
 */

import { Link, useNavigate } from 'react-router-dom';
import {
  MdHome,
  MdArrowBack,
  MdSearch,
  MdSentimentDissatisfied,
} from 'react-icons/md';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="relative inline-block">
              {/* Large 404 Text */}
              <h1 className="text-[200px] md:text-[280px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 leading-none select-none">
                404
              </h1>
              
              {/* Sad Face Icon */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <MdSentimentDissatisfied className="text-6xl md:text-8xl text-gray-400 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Oops! Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <p className="text-gray-500">
              Let's get you back on track!
            </p>
          </div>

          {/* Search Suggestions */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <MdSearch className="text-2xl text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">
                Looking for something?
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <Link
                to="/dashboard"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                  Dashboard
                </h4>
                <p className="text-sm text-gray-500">
                  View your expense overview
                </p>
              </Link>

              <Link
                to="/expenses"
                className="p-4 border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all group"
              >
                <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 mb-1">
                  Expenses
                </h4>
                <p className="text-sm text-gray-500">
                  Manage your expenses
                </p>
              </Link>

              <Link
                to="/analytics"
                className="p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all group"
              >
                <h4 className="font-semibold text-gray-900 group-hover:text-green-600 mb-1">
                  Analytics
                </h4>
                <p className="text-sm text-gray-500">
                  View spending insights
                </p>
              </Link>

              <Link
                to="/ai-insights"
                className="p-4 border border-gray-200 rounded-lg hover:border-pink-400 hover:bg-pink-50 transition-all group"
              >
                <h4 className="font-semibold text-gray-900 group-hover:text-pink-600 mb-1">
                  AI Insights
                </h4>
                <p className="text-sm text-gray-500">
                  Get AI-powered advice
                </p>
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all transform hover:-translate-y-1"
            >
              <MdArrowBack className="text-xl" />
              Go Back
            </button>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:-translate-y-1"
            >
              <MdHome className="text-xl" />
              Go to Dashboard
            </Link>
          </div>

          {/* Helpful Tip */}
          <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-gray-600">
              💡 <strong className="text-gray-900">Helpful Tip:</strong> If you believe this is an error, 
              please check the URL or contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
