/**
 * Login Component
 * User login page with email and password authentication
 */


import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { authAPI } from '../../services/api';
import { setAuthToken, setUserData } from '../../utils/auth';


const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });


  const from = location.state?.from?.pathname || '/dashboard';


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSubmit = async (e, isRetry = false) => {
    if (e) e.preventDefault();
    
    console.log('🔐 === LOGIN PROCESS START ===');
    console.log('1. Form submitted');
    console.log('   Email:', formData.email);


    // Validation (skip on retry)
    if (!isRetry) {
      if (!formData.email || !formData.password) {
        toast.error('Please fill in all fields');
        return;
      }


      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        toast.error('Please enter a valid email');
        return;
      }
    }


    setLoading(true);


    try {
      console.log('2. Calling login API...');
      
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });


      console.log('3. ✅ API Response received');
      console.log('   Full response:', response.data);


      const { access_token, user } = response.data;


      if (!access_token) {
        throw new Error('No access token in response');
      }


      console.log('4. 💾 Saving credentials...');
      console.log('   Token length:', access_token.length);
      console.log('   User:', user.email);
      
      setAuthToken(access_token);
      setUserData(user);


      const verifyToken = localStorage.getItem('expense_tracker_token');
      const verifyUser = localStorage.getItem('expense_tracker_user');
      
      console.log('5. ✅ Verification:');
      console.log('   Token saved:', !!verifyToken);
      console.log('   User saved:', !!verifyUser);


      if (!verifyToken || !verifyUser) {
        console.error('❌ CRITICAL: localStorage save failed!');
        throw new Error('Failed to save login data');
      }


      // Reset states on success
      setIsServerWaking(false);
      setRetryCount(0);
      toast.success('Login successful!');


      console.log('6. 🔄 Redirecting to:', from);
      console.log('   Current URL:', window.location.href);
      
      // Immediate redirect using navigate
      navigate(from);


    } catch (error) {
      console.error('❌ === LOGIN ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);


      setLoading(false);


      // Check for server wake-up scenarios
      const isNetworkError = error.message.includes('Network Error') || 
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
      if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Invalid credentials');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again.');
      } else if (isNetworkError) {
        toast.error(
          'Cannot connect to server. The server might be starting up. Please wait 30 seconds and try again.',
          { duration: 6000 }
        );
      } else {
        toast.error(error.message || 'Login failed');
      }
    }
  };


  return (
    <div className="w-full max-w-md px-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to continue to Expense Tracker</p>
        </div>


        {/* Server Waking Up Alert */}
        {isServerWaking && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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


        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdEmail className="text-gray-400 text-xl" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                autoComplete="email"
                required
              />
            </div>
          </div>


          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdLock className="text-gray-400 text-xl" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                autoComplete="current-password"
                required
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
          </div>


          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700"
              >
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Forgot password?
            </Link>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                {isServerWaking ? 'Server starting up...' : 'Signing in...'}
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>


        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Don't have an account?
              </span>
            </div>
          </div>
        </div>


        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
          >
            Create a new account
          </Link>
        </div>
      </div>


      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          By signing in, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};


export default Login;
