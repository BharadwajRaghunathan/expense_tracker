/**
 * Register Page Component
 * Handles new user registration
 * Backend: POST /api/auth/register
 */


import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';


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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div>
          <h2 className="text-center text-4xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Expense Tracker and manage your finances
          </p>
        </div>


        {/* Server Waking Up Alert */}
        {isServerWaking && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="animate-spin h-5 w-5 text-yellow-600 mr-3"
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
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Server is starting up...
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  This may take up to 30 seconds on first use. Automatically retrying...
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name Input (Optional) */}
            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                autoComplete="name"
                value={formData.fullname}
                onChange={handleChange}
                maxLength={100}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                placeholder="John Doe"
              />
            </div>


            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                maxLength={120}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                placeholder="you@example.com"
              />
            </div>


            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>


            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                placeholder="Re-enter your password"
              />
            </div>
          </div>


          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isServerWaking ? 'Server starting up...' : 'Creating account...'}
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>


          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-green-600 hover:text-green-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};


export default Register;
