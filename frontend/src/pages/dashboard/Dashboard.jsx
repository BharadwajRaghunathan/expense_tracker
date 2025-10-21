/**
 * Dashboard Component
 * Main dashboard displaying expense overview, analytics, and recent activities
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  MdTrendingUp, 
  MdAccountBalanceWallet, 
  MdBarChart, 
  MdAttachMoney,
  MdCalendarToday,
  MdArrowForward,
  MdRefresh
} from 'react-icons/md';
import { analyticsAPI, expenseAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalExpenses: 0,
      expenseCount: 0,
      dailyAverage: 0,
      period: 7,
    },
    categoryBreakdown: [],
    paymentBreakdown: [],
    dailyTrend: [],
    recentExpenses: [],
    topCategory: null,
    mostUsedPayment: null,
  });

  const [dateFilter, setDateFilter] = useState({
    days: 7,
    label: 'Last 7 Days'
  });

  // ✅ FIXED: Fetch with graceful error handling
  const fetchDashboardData = async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('📊 Fetching dashboard data for:', dateFilter.label);

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - dateFilter.days);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      console.log('📅 Date range:', startDateStr, 'to', endDateStr);

      // ✅ FIXED: Use Promise.allSettled instead of Promise.all
      // This prevents one failing endpoint from crashing everything
      const results = await Promise.allSettled([
        analyticsAPI.getCategoryBreakdown(startDateStr, endDateStr),
        analyticsAPI.getPaymentBreakdown(startDateStr, endDateStr),
        analyticsAPI.getDailyTrend(dateFilter.days),
        expenseAPI.getExpenses({ 
          start_date: startDateStr, 
          end_date: endDateStr,
          per_page: 5 
        }),
      ]);

      console.log('✅ Dashboard API calls completed');

      // ✅ FIXED: Extract data with safe fallbacks
      const categories = results[0].status === 'fulfilled' 
        ? (results[0].value?.data?.data || []) 
        : [];
      
      const payments = results[1].status === 'fulfilled'
        ? (results[1].value?.data?.data || [])
        : [];
      
      const dailyData = results[2].status === 'fulfilled'
        ? (results[2].value?.data?.data || [])
        : [];
      
      const expenses = results[3].status === 'fulfilled'
        ? (results[3].value?.data?.expenses || results[3].value?.data?.data || [])
        : [];

      // ✅ Log which endpoints failed
      const endpointNames = ['Categories', 'Payments', 'Daily Trend', 'Expenses'];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`⚠️ ${endpointNames[index]} endpoint failed:`, result.reason?.message);
        } else {
          console.log(`✅ ${endpointNames[index]} loaded successfully`);
        }
      });

      // Process data
      const totalExpenses = categories.reduce((sum, cat) => sum + (cat.total || 0), 0);
      const expenseCount = categories.reduce((sum, cat) => sum + (cat.count || 0), 0);
      const topCategory = categories.length > 0 ? categories[0] : null;
      
      const mostUsedPayment = payments.length > 0 
        ? payments.reduce((prev, current) => 
            ((prev.count || 0) > (current.count || 0)) ? prev : current
          )
        : null;

      const dailyAverage = dateFilter.days > 0 
        ? totalExpenses / dateFilter.days 
        : 0;

      setDashboardData({
        summary: {
          totalExpenses,
          expenseCount,
          dailyAverage,
          period: dateFilter.days,
        },
        categoryBreakdown: categories.slice(0, 5),
        paymentBreakdown: payments.slice(0, 5),
        dailyTrend: dailyData,
        recentExpenses: expenses,
        topCategory,
        mostUsedPayment,
      });

      if (showToast) {
        toast.success('Dashboard refreshed');
      }
    } catch (error) {
      console.error('❌ Critical error fetching dashboard data:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return;
      }
      
      // ✅ Set empty data so dashboard still renders
      setDashboardData({
        summary: {
          totalExpenses: 0,
          expenseCount: 0,
          dailyAverage: 0,
          period: dateFilter.days,
        },
        categoryBreakdown: [],
        paymentBreakdown: [],
        dailyTrend: [],
        recentExpenses: [],
        topCategory: null,
        mostUsedPayment: null,
      });
      
      toast.error('Unable to load some dashboard data', {
        duration: 3000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter.days]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleDateFilterChange = (days, label) => {
    setDateFilter({ days, label });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview of your expenses - {dateFilter.label}
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
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdRefresh className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Expenses Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Expenses</p>
                <h3 className="text-3xl font-bold mt-2">
                  {formatCurrency(dashboardData.summary.totalExpenses)}
                </h3>
              </div>
              <div className="bg-blue-400 bg-opacity-50 rounded-full p-3">
                <MdAccountBalanceWallet className="text-3xl" />
              </div>
            </div>
            <p className="text-blue-100 text-xs mt-3">
              {dateFilter.label}
            </p>
          </div>

          {/* Transaction Count Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Transactions</p>
                <h3 className="text-3xl font-bold mt-2">
                  {dashboardData.summary.expenseCount}
                </h3>
              </div>
              <div className="bg-purple-400 bg-opacity-50 rounded-full p-3">
                <MdBarChart className="text-3xl" />
              </div>
            </div>
            <p className="text-purple-100 text-xs mt-3">
              Total count
            </p>
          </div>

          {/* Daily Average Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Daily Average</p>
                <h3 className="text-3xl font-bold mt-2">
                  {formatCurrency(dashboardData.summary.dailyAverage)}
                </h3>
              </div>
              <div className="bg-green-400 bg-opacity-50 rounded-full p-3">
                <MdTrendingUp className="text-3xl" />
              </div>
            </div>
            <p className="text-green-100 text-xs mt-3">
              Per day
            </p>
          </div>

          {/* Top Category Card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Top Category</p>
                <h3 className="text-xl font-bold mt-2 truncate">
                  {dashboardData.topCategory?.category || 'N/A'}
                </h3>
              </div>
              <div className="bg-orange-400 bg-opacity-50 rounded-full p-3">
                <MdAttachMoney className="text-3xl" />
              </div>
            </div>
            <p className="text-orange-100 text-xs mt-3">
              {dashboardData.topCategory 
                ? formatCurrency(dashboardData.topCategory.total)
                : 'No data'}
            </p>
          </div>
        </div>

        {/* Charts and Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Daily Spending Trend</h2>
              <Link
                to="/analytics"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View Details <MdArrowForward />
              </Link>
            </div>

            {dashboardData.dailyTrend.length > 0 ? (
              <div className="h-64">
                <div className="flex items-end justify-between h-full gap-2">
                  {dashboardData.dailyTrend.map((item, index) => {
                    const maxTotal = Math.max(...dashboardData.dailyTrend.map(d => d.total || 0));
                    const height = maxTotal > 0 ? ((item.total || 0) / maxTotal) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center min-w-0">
                        <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden relative group" style={{ height: '200px' }}>
                          <div
                            className="bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-300 hover:from-blue-600 hover:to-blue-500 absolute bottom-0 w-full"
                            style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                          >
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                              {formatCurrency(item.total || 0)}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 text-center truncate w-full">
                          {item.dayname?.slice(0, 3) || item.date}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MdBarChart className="text-5xl mx-auto mb-2 opacity-50" />
                  <p>No data available for the selected period</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Expenses</h2>
              <Link
                to="/expenses"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View All <MdArrowForward />
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.recentExpenses.length > 0 ? (
                dashboardData.recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {expense.description || expense.title || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 truncate">
                          {expense.category?.name || expense.category_name || 'Uncategorized'}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MdCalendarToday className="text-xs flex-shrink-0" />
                          {formatDate(expense.expense_date || expense.date)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MdAccountBalanceWallet className="text-5xl mx-auto mb-2 opacity-50" />
                  <p>No recent expenses</p>
                  <Link to="/expenses/add" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                    Add your first expense
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category and Payment Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Top Categories</h2>
              <Link
                to="/analytics"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View All <MdArrowForward />
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.categoryBreakdown.length > 0 ? (
                dashboardData.categoryBreakdown.map((category, index) => (
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
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                          {formatCurrency(category.total)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(category.percentage || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${category.percentage || 0}%`,
                          backgroundColor: category.color || '#3B82F6',
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No category data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Mode Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
              <Link
                to="/analytics"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View All <MdArrowForward />
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.paymentBreakdown.length > 0 ? (
                dashboardData.paymentBreakdown.map((payment, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
                        {payment.paymentmode || payment.payment_mode}
                      </span>
                      <div className="text-right ml-2">
                        <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                          {formatCurrency(payment.total)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.count} transactions
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${payment.percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No payment data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white text-center md:text-left">
              <h3 className="text-xl font-bold">Ready to track a new expense?</h3>
              <p className="text-blue-100 text-sm mt-1">
                Add your expenses quickly and keep your budget on track
              </p>
            </div>
            <Link
              to="/expenses/add"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
            >
              Add Expense
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
