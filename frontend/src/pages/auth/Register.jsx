/**
 * Register Page Component
 * Handles new user registration with professional responsive design
 * Backend: POST /api/auth/register
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullname: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    // Email validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Invalid email format');
      return false;
    }

    // Password validation - Backend requires minimum 6 characters
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    // Confirm password match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e, isRetry = false) => {
    if (e) e.preventDefault();

    // Skip validation on retry
    if (!isRetry && !validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Backend expects: { email, password, full_name (optional) }
      const response = await authAPI.register({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        full_name: formData.fullname.trim() || undefined,
      });

      // Reset states on success
      setIsServerWaking(false);
      setRetryCount(0);

      // Backend returns: { message, user }
      toast.success('Registration successful! Please log in.');
      
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      
      setLoading(false);

      // Check for server wake-up scenarios
      const isNetworkError = error.message?.includes('Network Error') || 
                             error.code === 'ECONNABORTED' || 
                             error.code === 'ERR_NETWORK' ||
                             !error.response;

      if (isNetworkError && retryCount < 2) {
        // Server might be waking up
        setIsServerWaking(true);
        setRetryCount(prev => prev + 1);
        
        toast.loading(
          `Server is starting up... This may take up to 30 seconds. Retrying in 10 seconds... (Attempt ${retryCount + 1}/2)`,
          { 
            duration: 10000,
            id: 'server-waking'
          }
        );

        // Auto-retry after 10 seconds
        setTimeout(() => {
          console.log(`🔄 Auto-retry attempt ${retryCount + 1}`);
          handleSubmit(null, true);
        }, 10000);

        return;
      }

      // Reset server waking state
      setIsServerWaking(false);

      // Handle specific errors
      if (error.response?.status === 409) {
        toast.error('User with this email already exists');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.error || 'Invalid registration data');
      } else if (isNetworkError) {
        toast.error(
          'Cannot connect to server. The server might be starting up. Please wait 30 seconds and try again.',
          { duration: 6000 }
        );
      } else {
        toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
              <MdPerson className="text-white text-3xl sm:text-4xl" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Create Account
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              Join Expense Tracker and manage your finances
            </p>
          </div>

          {/* Server Waking Up Alert */}
          {isServerWaking && (
            <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-pulse">
              <div className="flex items-start sm:items-center">
                <svg
                  className="animate-spin h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5 sm:mt-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-yellow-800">
                    Server is starting up...
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    This may take up to 30 seconds. Automatically retrying...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            {/* Full Name Input (Optional) */}
            <div>
              <label htmlFor="fullname" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdPerson className="text-gray-400 text-lg sm:text-xl" />
                </div>
                <input
                  id="fullname"
                  name="fullname"
                  type="text"
                  autoComplete="name"
                  value={formData.fullname}
                  onChange={handleChange}
                  maxLength={100}
                  disabled={loading}
                  className="appearance-none relative block w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdEmail className="text-gray-400 text-lg sm:text-xl" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={120}
                  disabled={loading}
                  className="appearance-none relative block w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdLock className="text-gray-400 text-lg sm:text-xl" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="appearance-none relative block w-full pl-10 pr-12 py-2.5 sm:py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <MdVisibilityOff className="text-gray-400 text-xl hover:text-gray-600 transition-colors" />
                  ) : (
                    <MdVisibility className="text-gray-400 text-xl hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MdLock className="text-gray-400 text-lg sm:text-xl" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className="appearance-none relative block w-full pl-10 pr-12 py-2.5 sm:py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex="-1"
                >
                  {showConfirmPassword ? (
                    <MdVisibilityOff className="text-gray-400 text-xl hover:text-gray-600 transition-colors" />
                  ) : (
                    <MdVisibility className="text-gray-400 text-xl hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-2.5 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isServerWaking ? 'Server starting up...' : 'Creating account...'}
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 bg-white text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm sm:text-base font-medium text-green-600 hover:text-green-500 transition-colors"
            >
              Sign in here
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-xs sm:text-sm text-white/90">
            By creating an account, you agree to our{' '}
            <a href="#" className="font-medium underline hover:text-white transition-colors">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="#" className="font-medium underline hover:text-white transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
