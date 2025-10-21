/**
 * Profile Component
 * User profile page with account information and statistics
 * Backend: User model with email, fullname, created_at, updated_at
 */


import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  MdPerson,
  MdEmail,
  MdCalendarToday,
  MdEdit,
  MdTrendingUp,
  MdAccountBalanceWallet,
  MdBarChart,
  MdSettings,
} from 'react-icons/md';
import { getUserData } from '../../utils/auth';
import { expenseAPI, analyticsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';


const Profile = () => {
  const location = useLocation(); // ✅ ADDED: Track route changes
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [statistics, setStatistics] = useState({
    totalExpenses: 0,
    expenseCount: 0,
    averageExpense: 0,
    topCategory: null,
    mostUsedPayment: null,
  });


  useEffect(() => {
    fetchProfileData();
  }, [location]); // ✅ CHANGED: Added location as dependency


  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Get user data from localStorage
      const user = getUserData();
      console.log('🔍 Profile - User Data from localStorage:', user);
      console.log('🔍 Profile - Full Name:', user?.full_name);
      console.log('🔍 Profile - Email:', user?.email);
      setUserData(user);

      // Fetch user statistics
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      // ✅ FIXED: Use Promise.allSettled for partial failure handling
      const results = await Promise.allSettled([
        analyticsAPI.getCategoryBreakdown(startDate, endDate),
        analyticsAPI.getPaymentBreakdown(startDate, endDate),
        expenseAPI.getExpenses({ start_date: startDate, end_date: endDate }),
      ]);

      // ✅ FIXED: Safe data access with fallbacks
      const categories =
        results[0].status === 'fulfilled'
          ? results[0].value.data?.data || []
          : [];
      const payments =
        results[1].status === 'fulfilled'
          ? results[1].value.data?.data || []
          : [];

      // ✅ FIXED: Safe calculations
      const totalExpenses = categories.reduce(
        (sum, cat) => sum + (cat.total || 0),
        0
      );
      const expenseCount = categories.reduce(
        (sum, cat) => sum + (cat.count || 0),
        0
      );

      setStatistics({
        totalExpenses,
        expenseCount,
        averageExpense: expenseCount > 0 ? totalExpenses / expenseCount : 0,
        topCategory: categories.length > 0 ? categories[0] : null,
        mostUsedPayment: payments.length > 0 ? payments[0] : null,
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADDED: Helper function to get display name with fallback
  const getDisplayName = () => {
    if (userData?.full_name && userData.full_name.trim()) {
      return userData.full_name;
    }
    if (userData?.email) {
      return userData.email.split('@')[0];
    }
    return 'User';
  };

  // ✅ ADDED: Helper function to get initial for avatar
  const getInitial = () => {
    if (userData?.full_name && userData.full_name.trim()) {
      return userData.full_name.charAt(0).toUpperCase();
    }
    if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account information and view your statistics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl text-blue-600 font-bold">
                    {getInitial()}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {getDisplayName()}
                </h2>
                <p className="text-blue-100 text-sm mt-1">Expense Tracker Member</p>
              </div>

              {/* Profile Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MdEmail className="text-xl text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Email Address</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userData?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MdCalendarToday className="text-xl text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Member Since</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(userData?.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <MdCalendarToday className="text-xl text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(userData?.updated_at)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Account Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {userData?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <Link
                  to="/settings"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <MdSettings className="text-xl" />
                  Account Settings
                </Link>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      Total Spent (30d)
                    </p>
                    <h3 className="text-3xl font-bold mt-2">
                      {formatCurrency(statistics.totalExpenses)}
                    </h3>
                  </div>
                  <div className="bg-blue-400 bg-opacity-50 rounded-full p-3">
                    <MdAccountBalanceWallet className="text-3xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      Transactions
                    </p>
                    <h3 className="text-3xl font-bold mt-2">
                      {statistics.expenseCount}
                    </h3>
                  </div>
                  <div className="bg-purple-400 bg-opacity-50 rounded-full p-3">
                    <MdBarChart className="text-3xl" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Average</p>
                    <h3 className="text-3xl font-bold mt-2">
                      {formatCurrency(statistics.averageExpense)}
                    </h3>
                  </div>
                  <div className="bg-green-400 bg-opacity-50 rounded-full p-3">
                    <MdTrendingUp className="text-3xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Category & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Category */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Top Category
                </h3>
                {statistics.topCategory ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor:
                            (statistics.topCategory.color || '#3B82F6') + '20',
                        }}
                      >
                        <MdBarChart
                          className="text-2xl"
                          style={{
                            color: statistics.topCategory.color || '#3B82F6',
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold text-gray-900">
                          {statistics.topCategory.category}
                        </p>
                        <p className="text-sm text-gray-500">
                          {statistics.topCategory.count || 0} transactions
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Spent</span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatCurrency(statistics.topCategory.total || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">
                          Percentage of Total
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {(statistics.topCategory.percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No category data available
                  </p>
                )}
              </div>

              {/* Most Used Payment */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Most Used Payment
                </h3>
                {statistics.mostUsedPayment ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <MdAccountBalanceWallet className="text-2xl text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold text-gray-900">
                          {statistics.mostUsedPayment.paymentmode}
                        </p>
                        <p className="text-sm text-gray-500">
                          {statistics.mostUsedPayment.count || 0} transactions
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Spent</span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatCurrency(statistics.mostUsedPayment.total || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">
                          Percentage of Total
                        </span>
                        <span className="text-lg font-bold text-purple-600">
                          {(statistics.mostUsedPayment.percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No payment data available
                  </p>
                )}
              </div>
            </div>

            {/* Activity Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Account Activity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">
                    Account Created
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {userData?.created_at
                      ? new Date(userData.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium mb-1">
                    Last Activity
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {userData?.updated_at
                      ? new Date(userData.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-white">
                  <h3 className="text-xl font-bold">Ready to explore more?</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    Check out your analytics and insights
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    to="/analytics"
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
                  >
                    View Analytics
                  </Link>
                  <Link
                    to="/expenses/add"
                    className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors shadow-lg whitespace-nowrap"
                  >
                    Add Expense
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
