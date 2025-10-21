/**
 * CategoryBreakdown Component
 * Detailed category-wise expense analysis with pie chart
 * Backend: GET /api/analytics/categories-vs-expenses
 */


import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MdArrowBack, MdRefresh, MdPieChart } from 'react-icons/md';
import { analyticsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';


const CategoryBreakdown = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // ✅ FIXED: Initialize with proper default dates
  const getDefaultDates = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDates());

  const fetchCategoryBreakdown = async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('📊 Fetching category breakdown:', dateRange);

      // ✅ FIXED: Ensure dates are valid
      const startDate = dateRange.startDate || getDefaultDates().startDate;
      const endDate = dateRange.endDate || getDefaultDates().endDate;

      const response = await analyticsAPI.getCategoryBreakdown(startDate, endDate);

      console.log('✅ Category breakdown response:', response.data);

      // ✅ FIXED: Proper data extraction with multiple fallbacks
      const categoryData = response.data?.data || response.data || [];
      
      console.log('📋 Extracted category data:', categoryData);

      if (Array.isArray(categoryData) && categoryData.length > 0) {
        setCategories(categoryData);
        if (showToast) {
          toast.success('Data refreshed successfully');
        }
      } else {
        setCategories([]);
        if (showToast) {
          toast.info('No category data found for selected period');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching category breakdown:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      toast.error(
        error.response?.data?.error || 
        'Failed to load category breakdown'
      );
      setCategories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ FIXED: Only fetch on mount, not on every dateRange change
  useEffect(() => {
    fetchCategoryBreakdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // ✅ ADDED: Handler for date change with manual trigger
  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ ADDED: Handler for applying date filter
  const handleApplyFilter = () => {
    fetchCategoryBreakdown(true);
  };

  // ✅ FIXED: Safe calculations with proper number conversion
  const totalAmount = categories.reduce(
    (sum, cat) => sum + (parseFloat(cat.total) || 0), 
    0
  );
  
  const totalCount = categories.reduce(
    (sum, cat) => sum + (parseInt(cat.count) || 0), 
    0
  );

  // Generate colors for pie chart
  const chartColors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#6366F1', '#F97316', '#14B8A6', '#EF4444', '#84CC16',
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading category breakdown...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">
                Category Breakdown
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Detailed analysis of expenses by category
              </p>
            </div>

            <button
              onClick={() => fetchCategoryBreakdown(true)}
              disabled={refreshing}
              className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdRefresh className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                max={dateRange.endDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                min={dateRange.startDate}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleApplyFilter}
                disabled={refreshing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshing ? 'Loading...' : 'Apply Filter'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Total Amount</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              From {categories.length} categories
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Total Transactions</p>
            <p className="text-3xl font-bold text-purple-600">{totalCount}</p>
            <p className="text-xs text-gray-500 mt-2">
              Across all categories
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Average per Transaction</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(totalCount > 0 ? totalAmount / totalCount : 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Overall average
            </p>
          </div>
        </div>

        {/* Category Details */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart Visualization */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Visual Distribution
              </h3>
              <div className="relative w-full aspect-square max-w-sm mx-auto">
                {/* Simple Donut Chart */}
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {categories.map((category, index) => {
                    const percentage = parseFloat(category.percentage) || 0;
                    const startAngle = categories
                      .slice(0, index)
                      .reduce((sum, cat) => sum + ((parseFloat(cat.percentage) || 0) / 100) * 360, 0);
                    const angle = (percentage / 100) * 360;
                    const endAngle = startAngle + angle;

                    const startRad = (startAngle - 90) * (Math.PI / 180);
                    const endRad = (endAngle - 90) * (Math.PI / 180);

                    const x1 = 100 + 80 * Math.cos(startRad);
                    const y1 = 100 + 80 * Math.sin(startRad);
                    const x2 = 100 + 80 * Math.cos(endRad);
                    const y2 = 100 + 80 * Math.sin(endRad);

                    const largeArc = angle > 180 ? 1 : 0;

                    return (
                      <path
                        key={index}
                        d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={category.color || chartColors[index % chartColors.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        title={`${category.category}: ${percentage.toFixed(1)}%`}
                      />
                    );
                  })}
                  {/* Center circle for donut effect */}
                  <circle cx="100" cy="100" r="50" fill="white" />
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    className="text-xs fill-gray-600 font-medium"
                  >
                    Total
                  </text>
                  <text
                    x="100"
                    y="110"
                    textAnchor="middle"
                    className="text-sm fill-gray-900 font-bold"
                  >
                    {categories.length}
                  </text>
                </svg>
              </div>

              {/* Legend */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                {categories.map((category, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          category.color || chartColors[index % chartColors.length],
                      }}
                    ></div>
                    <span className="text-xs text-gray-700 truncate">
                      {category.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Category Details
              </h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {categories.map((category, index) => {
                  const categoryTotal = parseFloat(category.total) || 0;
                  const categoryCount = parseInt(category.count) || 0;
                  const categoryPercentage = parseFloat(category.percentage) || 0;
                  const avgPerTransaction = categoryCount > 0 ? categoryTotal / categoryCount : 0;

                  return (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                            style={{
                              backgroundColor:
                                category.color || chartColors[index % chartColors.length],
                            }}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {category.category}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {categoryCount} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-gray-900 whitespace-nowrap">
                            {formatCurrency(categoryTotal)}
                          </p>
                          <p className="text-sm text-blue-600 font-medium">
                            {categoryPercentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${categoryPercentage}%`,
                            backgroundColor:
                              category.color || chartColors[index % chartColors.length],
                          }}
                        ></div>
                      </div>

                      {/* Average per transaction */}
                      <p className="text-xs text-gray-500 mt-2">
                        Avg: {formatCurrency(avgPerTransaction)} per transaction
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <MdPieChart className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">No category data available</p>
            <p className="text-gray-400 text-sm mb-4">
              Try adjusting the date range or add some expenses
            </p>
            <Link
              to="/expenses/add"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add Expense
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};


export default CategoryBreakdown;
