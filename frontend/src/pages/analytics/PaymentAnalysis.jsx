/**
 * PaymentAnalysis Component
 * Detailed payment mode analysis with cross-tabulation
 * Backend: GET /api/analytics/payment-modes-vs-expenses, /api/analytics/payment-modes-vs-categories
 */


import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MdArrowBack, MdRefresh, MdPayment } from 'react-icons/md';
import { analyticsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';


const PaymentAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentModes, setPaymentModes] = useState([]);
  const [crossTabData, setCrossTabData] = useState([]);
  
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

  const fetchPaymentAnalysis = async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('📊 Fetching payment analysis:', dateRange);

      // ✅ FIXED: Ensure dates are valid
      const startDate = dateRange.startDate || getDefaultDates().startDate;
      const endDate = dateRange.endDate || getDefaultDates().endDate;

      // ✅ FIXED: Use Promise.allSettled for partial failure handling
      const results = await Promise.allSettled([
        analyticsAPI.getPaymentBreakdown(startDate, endDate),
        analyticsAPI.getCrossTab(startDate, endDate),
      ]);

      console.log('✅ Payment analysis results:', results);

      // ✅ FIXED: Safe data extraction with multiple fallbacks
      const paymentData = results[0].status === 'fulfilled'
        ? (results[0].value.data?.data || results[0].value.data || [])
        : [];
      
      const crossData = results[1].status === 'fulfilled'
        ? (results[1].value.data?.data || results[1].value.data || [])
        : [];

      console.log('📋 Extracted payment data:', paymentData);
      console.log('📋 Extracted cross-tab data:', crossData);

      if (Array.isArray(paymentData)) {
        setPaymentModes(paymentData);
      } else {
        console.warn('⚠️ Payment data is not an array:', paymentData);
        setPaymentModes([]);
      }

      if (Array.isArray(crossData)) {
        setCrossTabData(crossData);
      } else {
        console.warn('⚠️ Cross-tab data is not an array:', crossData);
        setCrossTabData([]);
      }

      if (showToast) {
        if (paymentData.length > 0 || crossData.length > 0) {
          toast.success('Data refreshed successfully');
        } else {
          toast.info('No payment data found for selected period');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching payment analysis:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      toast.error(
        error.response?.data?.error || 
        'Failed to load payment analysis'
      );
      setPaymentModes([]);
      setCrossTabData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ FIXED: Only fetch on mount, not on every dateRange change
  useEffect(() => {
    fetchPaymentAnalysis();
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
    fetchPaymentAnalysis(true);
  };

  // ✅ FIXED: Safe calculations with proper number conversion
  const totalAmount = paymentModes.reduce(
    (sum, pm) => sum + (parseFloat(pm.total) || 0), 
    0
  );
  
  const totalCount = paymentModes.reduce(
    (sum, pm) => sum + (parseInt(pm.count) || 0), 
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading payment analysis...</p>
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
                Payment Analysis
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Analyze spending across different payment methods
              </p>
            </div>

            <button
              onClick={() => fetchPaymentAnalysis(true)}
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
              From {paymentModes.length} payment methods
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Total Transactions</p>
            <p className="text-3xl font-bold text-purple-600">{totalCount}</p>
            <p className="text-xs text-gray-500 mt-2">
              Across all payment methods
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

        {/* Payment Mode Breakdown */}
        {paymentModes.length > 0 ? (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Payment Mode Breakdown
              </h3>
              <div className="space-y-4">
                {paymentModes.map((payment, index) => {
                  // ✅ FIXED: Safe values with proper type conversion
                  const total = parseFloat(payment.total) || 0;
                  const count = parseInt(payment.count) || 0;
                  const percentage = parseFloat(payment.percentage) || 0;
                  const avgPerTransaction = count > 0 ? total / count : 0;

                  return (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {payment.paymentmode || payment.payment_mode || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {count} transactions
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-gray-900 whitespace-nowrap">
                            {formatCurrency(total)}
                          </p>
                          <p className="text-sm text-purple-600 font-medium">
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>

                      {/* Average per transaction */}
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Avg: {formatCurrency(avgPerTransaction)}</span>
                        <span>{count} uses</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cross-Tabulation: Payment Modes vs Categories */}
            {crossTabData.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Payment Modes vs Categories
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  See how different payment methods are used across spending categories
                </p>
                <div className="space-y-6">
                  {crossTabData.map((categoryData, index) => (
                    <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                      <h4 className="font-bold text-gray-900 mb-4 text-lg">
                        {categoryData.category || 'Unknown Category'}
                      </h4>
                      {/* ✅ FIXED: Safe access to payments object with better handling */}
                      {categoryData.payments && typeof categoryData.payments === 'object' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(categoryData.payments).map(
                            ([paymentMode, paymentData], pmIndex) => {
                              // ✅ FIXED: Handle both old format (number) and new format (object)
                              const total = typeof paymentData === 'object' 
                                ? parseFloat(paymentData.total) || 0
                                : parseFloat(paymentData) || 0;
                              
                              const count = typeof paymentData === 'object'
                                ? parseInt(paymentData.count) || 0
                                : 0;

                              return (
                                <div
                                  key={pmIndex}
                                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 hover:shadow-md transition-all border border-purple-100"
                                >
                                  <p className="text-sm text-gray-600 mb-1 font-medium truncate" title={paymentMode}>
                                    {paymentMode}
                                  </p>
                                  <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(total)}
                                  </p>
                                  {count > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {count} transactions
                                    </p>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No payment data available for this category
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <MdPayment className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">
              No payment data available
            </p>
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


export default PaymentAnalysis;
