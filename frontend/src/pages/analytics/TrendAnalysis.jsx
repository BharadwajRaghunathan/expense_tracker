/**
 * TrendAnalysis Component
 * Daily and monthly spending trends with line charts
 * Backend: GET /api/analytics/daily-trend, /api/analytics/monthly-summary
 */


import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MdArrowBack, MdRefresh, MdShowChart } from 'react-icons/md';
import { analyticsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';


const TrendAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [days, setDays] = useState(30);

  const fetchTrendData = async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('📊 Fetching trend data for:', days, 'days');

      // ✅ IMPROVED: Use Promise.allSettled for better error handling
      const results = await Promise.allSettled([
        analyticsAPI.getDailyTrend(days),
        analyticsAPI.getMonthlySummary(),
      ]);

      console.log('✅ Trend analysis results:', results);

      // ✅ FIXED: Safe data extraction with multiple fallbacks
      const dailyData = results[0].status === 'fulfilled'
        ? (results[0].value.data?.data || results[0].value.data || [])
        : [];
      
      const monthlyData = results[1].status === 'fulfilled'
        ? results[1].value.data
        : null;

      console.log('📋 Extracted daily data:', dailyData);
      console.log('📋 Extracted monthly data:', monthlyData);

      // Log which endpoints failed
      if (results[0].status === 'rejected') {
        console.warn('⚠️ Daily trend failed:', results[0].reason?.message);
      }
      if (results[1].status === 'rejected') {
        console.warn('⚠️ Monthly summary failed:', results[1].reason?.message);
      }

      if (Array.isArray(dailyData)) {
        setDailyTrend(dailyData);
      } else {
        console.warn('⚠️ Daily data is not an array:', dailyData);
        setDailyTrend([]);
      }

      // ✅ FIXED: Extract current month data from the new backend structure
      if (monthlyData && monthlyData.data) {
        const currentMonth = new Date().getMonth() + 1;
        const currentMonthData = monthlyData.data.find(
          m => m.month_number === currentMonth
        );
        setMonthlySummary(currentMonthData || null);
      } else {
        setMonthlySummary(null);
      }

      if (showToast) {
        if (dailyData.length > 0 || monthlyData) {
          toast.success('Data refreshed successfully');
        } else {
          toast.info('No trend data found');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching trend data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      toast.error(
        error.response?.data?.error || 
        'Failed to load trend analysis'
      );
      
      setDailyTrend([]);
      setMonthlySummary(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrendData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]); // Fetch when days changes

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading trend analysis...</p>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Safe calculations with proper number conversion
  const maxTotal = Math.max(...dailyTrend.map((d) => parseFloat(d.total) || 0), 1);
  const totalSpent = dailyTrend.reduce((sum, d) => sum + (parseFloat(d.total) || 0), 0);
  const totalTransactions = dailyTrend.reduce((sum, d) => sum + (parseInt(d.count) || 0), 0);
  const avgDaily = dailyTrend.length > 0 ? totalSpent / dailyTrend.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/analytics"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <MdArrowBack className="text-xl" />
            Back to Analytics
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trend Analysis</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track spending trends over time
              </p>
            </div>

            <button
              onClick={() => fetchTrendData(true)}
              disabled={refreshing}
              className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdRefresh className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Time Period</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setDays(7)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                days === 7
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                days === 30
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDays(90)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                days === 90
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 90 Days
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Total Spent</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Last {days} days
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Daily Average</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(avgDaily)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Per day
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Transactions</p>
            <p className="text-3xl font-bold text-green-600">
              {totalTransactions}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Total count
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Days with Data</p>
            <p className="text-3xl font-bold text-orange-600">
              {dailyTrend.filter(d => (d.total || 0) > 0).length}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Out of {dailyTrend.length}
            </p>
          </div>
        </div>

        {/* Daily Trend Chart */}
        {dailyTrend.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Daily Spending Trend
            </h3>

            {/* Bar Chart */}
            <div className="h-80 mb-4">
              <div className="h-full flex items-end justify-between gap-1">
                {dailyTrend.map((day, index) => {
                  const total = parseFloat(day.total) || 0;
                  const count = parseInt(day.count) || 0;
                  const height = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative min-w-0">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap pointer-events-none z-10">
                        <div className="font-semibold">{day.dayname || day.date}</div>
                        <div>{formatCurrency(total)}</div>
                        <div>{count} transactions</div>
                        {count > 0 && (
                          <div className="text-gray-300">
                            Avg: {formatCurrency(total / count)}
                          </div>
                        )}
                      </div>

                      {/* Bar Container */}
                      <div className="w-full h-full flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                          style={{
                            height: `${height}%`,
                            minHeight: height > 0 ? '4px' : '0',
                          }}
                        ></div>
                      </div>

                      {/* Day Label */}
                      <p className="text-xs text-gray-600 mt-2 text-center truncate w-full">
                        {day.dayname ? day.dayname.slice(0, 3) : (day.date?.slice(-5) || '')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Y-axis labels */}
            <div className="flex justify-between text-xs text-gray-500 border-t pt-2">
              <span>{formatCurrency(0)}</span>
              <span>{formatCurrency(maxTotal / 2)}</span>
              <span>{formatCurrency(maxTotal)}</span>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-t from-blue-500 to-blue-400 rounded"></div>
                <span>Daily Spending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-400 rounded"></div>
                <span>Hover for details</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center mb-6">
            <MdShowChart className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">
              No trend data available
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Add some expenses to see spending trends
            </p>
            <Link
              to="/expenses/add"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add Expense
            </Link>
          </div>
        )}

        {/* Monthly Summary */}
        {monthlySummary && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Current Month Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-2">Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monthlySummary.month || 'N/A'}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 font-medium mb-2">
                  Total Spent
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(parseFloat(monthlySummary.total) || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-2">
                  Transactions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {monthlySummary.count || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-600 font-medium mb-2">
                  Average
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(parseFloat(monthlySummary.average) || 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default TrendAnalysis;
