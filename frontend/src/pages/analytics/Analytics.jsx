/**
 * Analytics Overview Component
 * Main analytics page with comprehensive expense insights
 * Backend: Multiple analytics endpoints
 */


import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  MdTrendingUp,
  MdPieChart,
  MdBarChart,
  MdShowChart,
  MdArrowForward,
  MdRefresh,
  MdCalendarToday,
} from 'react-icons/md';
import { analyticsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';


const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dateFilter, setDateFilter] = useState({
    days: 30,
    label: 'Last 30 Days',
  });

  const [analyticsData, setAnalyticsData] = useState({
    categoryBreakdown: [],
    paymentBreakdown: [],
    crossTab: [],
    dailyTrend: [],
    monthlySummary: null,
  });

  const fetchAnalytics = async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - dateFilter.days);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      console.log('📊 Fetching analytics for:', startDateStr, 'to', endDateStr);

      // Fetch all analytics data in parallel with error handling
      const results = await Promise.allSettled([
        analyticsAPI.getCategoryBreakdown(startDateStr, endDateStr),
        analyticsAPI.getPaymentBreakdown(startDateStr, endDateStr),
        analyticsAPI.getCrossTab(startDateStr, endDateStr),
        analyticsAPI.getDailyTrend(dateFilter.days),
        analyticsAPI.getMonthlySummary(),
      ]);

      // ✅ IMPROVED: Better error handling and data extraction
      const categoryData = results[0].status === 'fulfilled' 
        ? (results[0].value.data?.data || []) 
        : [];
      
      const paymentData = results[1].status === 'fulfilled' 
        ? (results[1].value.data?.data || []) 
        : [];
      
      const crossTabData = results[2].status === 'fulfilled' 
        ? (results[2].value.data?.data || []) 
        : [];
      
      const dailyTrendData = results[3].status === 'fulfilled' 
        ? (results[3].value.data?.data || []) 
        : [];
      
      const monthlySummaryData = results[4].status === 'fulfilled' 
        ? results[4].value.data 
        : null;

      // Log which endpoints failed
      const endpointNames = ['Categories', 'Payments', 'Cross-tab', 'Daily Trend', 'Monthly Summary'];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`⚠️ ${endpointNames[index]} failed:`, result.reason?.message);
        } else {
          console.log(`✅ ${endpointNames[index]} loaded successfully`);
        }
      });

      setAnalyticsData({
        categoryBreakdown: categoryData,
        paymentBreakdown: paymentData,
        crossTab: crossTabData,
        dailyTrend: dailyTrendData,
        monthlySummary: monthlySummaryData,
      });

      if (showToast) {
        toast.success('Analytics refreshed');
      }
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      toast.error('Failed to load some analytics data');
      
      // Set empty data so page still renders
      setAnalyticsData({
        categoryBreakdown: [],
        paymentBreakdown: [],
        crossTab: [],
        dailyTrend: [],
        monthlySummary: null,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter.days]);

  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  const handleDateFilterChange = (days, label) => {
    setDateFilter({ days, label });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // ✅ IMPROVED: Calculate totals with safe fallbacks
  const totalExpenses = analyticsData.categoryBreakdown.reduce(
    (sum, cat) => sum + (parseFloat(cat.total) || 0),
    0
  );
  
  const totalTransactions = analyticsData.categoryBreakdown.reduce(
    (sum, cat) => sum + (parseInt(cat.count) || 0),
    0
  );

  const averagePerTransaction = totalTransactions > 0 
    ? totalExpenses / totalTransactions 
    : 0;

  // ✅ ADDED: Get current month data
  const getCurrentMonthData = () => {
    if (!analyticsData.monthlySummary?.data) return null;
    
    const currentMonth = new Date().getMonth() + 1;
    const monthData = analyticsData.monthlySummary.data.find(
      m => m.month_number === currentMonth
    );
    
    return monthData || null;
  };

  const currentMonthData = getCurrentMonthData();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Detailed insights into your spending patterns - {dateFilter.label}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            {/* Date Filter Buttons */}
            <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => handleDateFilterChange(7, 'Last 7 Days')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateFilter.days === 7
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                7D
              </button>
              <button
                onClick={() => handleDateFilterChange(30, 'Last 30 Days')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateFilter.days === 30
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                30D
              </button>
              <button
                onClick={() => handleDateFilterChange(90, 'Last 90 Days')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateFilter.days === 90
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                90D
              </button>
              <button
                onClick={() => handleDateFilterChange(365, 'Last Year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateFilter.days === 365
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                1Y
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdRefresh
                className={`text-xl ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Spent</p>
                <h3 className="text-3xl font-bold mt-2">
                  {formatCurrency(totalExpenses)}
                </h3>
              </div>
              <div className="bg-blue-400 bg-opacity-50 rounded-full p-3">
                <MdTrendingUp className="text-3xl" />
              </div>
            </div>
            <p className="text-blue-100 text-xs mt-3">{dateFilter.label}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Transactions
                </p>
                <h3 className="text-3xl font-bold mt-2">{totalTransactions}</h3>
              </div>
              <div className="bg-purple-400 bg-opacity-50 rounded-full p-3">
                <MdBarChart className="text-3xl" />
              </div>
            </div>
            <p className="text-purple-100 text-xs mt-3">Total count</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Avg/Transaction</p>
                <h3 className="text-3xl font-bold mt-2">
                  {formatCurrency(averagePerTransaction)}
                </h3>
              </div>
              <div className="bg-green-400 bg-opacity-50 rounded-full p-3">
                <MdShowChart className="text-3xl" />
              </div>
            </div>
            <p className="text-green-100 text-xs mt-3">Per expense</p>
          </div>
        </div>

        {/* ✅ IMPROVED: Monthly Summary with better data handling */}
        {currentMonthData && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MdCalendarToday className="text-blue-600" />
                This Month's Summary
              </h2>
              <span className="text-sm text-gray-600">{currentMonthData.month}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Total Expenses</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(currentMonthData.total || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Transactions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {currentMonthData.count || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Average</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(currentMonthData.average || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Category Breakdown Link */}
          <Link
            to="/analytics/category"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MdPieChart className="text-2xl text-blue-600" />
              </div>
              <MdArrowForward className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Category Breakdown
            </h3>
            <p className="text-sm text-gray-600">
              View detailed spending by category with charts and percentages
            </p>
            {analyticsData.categoryBreakdown.length > 0 && (
              <p className="text-xs text-blue-600 font-medium mt-3">
                {analyticsData.categoryBreakdown.length} categories tracked
              </p>
            )}
          </Link>

          {/* Payment Analysis Link */}
          <Link
            to="/analytics/payment"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MdBarChart className="text-2xl text-purple-600" />
              </div>
              <MdArrowForward className="text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Payment Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Analyze spending patterns across different payment methods
            </p>
            {analyticsData.paymentBreakdown.length > 0 && (
              <p className="text-xs text-purple-600 font-medium mt-3">
                {analyticsData.paymentBreakdown.length} payment methods used
              </p>
            )}
          </Link>

          {/* Trend Analysis Link */}
          <Link
            to="/analytics/trends"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MdShowChart className="text-2xl text-green-600" />
              </div>
              <MdArrowForward className="text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Trend Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Track spending trends over time with daily and monthly views
            </p>
            {analyticsData.dailyTrend.length > 0 && (
              <p className="text-xs text-green-600 font-medium mt-3">
                {analyticsData.dailyTrend.length} days of data
              </p>
            )}
          </Link>
        </div>

        {/* Preview Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categories Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Top Categories</h2>
              <Link
                to="/analytics/category"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View All <MdArrowForward />
              </Link>
            </div>

            {analyticsData.categoryBreakdown.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.categoryBreakdown.slice(0, 5).map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color || '#3B82F6' }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {category.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({category.count || 0})
                        </span>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                          {formatCurrency(category.total || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(category.percentage || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${category.percentage || 0}%`,
                          backgroundColor: category.color || '#3B82F6',
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <MdPieChart className="text-5xl mx-auto mb-2 opacity-50" />
                <p>No category data available</p>
                <Link
                  to="/expenses/add"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                >
                  Add your first expense
                </Link>
              </div>
            )}
          </div>

          {/* Top Payment Methods Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Top Payment Methods</h2>
              <Link
                to="/analytics/payment"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View All <MdArrowForward />
              </Link>
            </div>

            {analyticsData.paymentBreakdown.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.paymentBreakdown.slice(0, 5).map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {payment.paymentmode || payment.payment_mode}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.count || 0} transactions
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(payment.total || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(payment.percentage || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <MdBarChart className="text-5xl mx-auto mb-2 opacity-50" />
                <p>No payment data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
