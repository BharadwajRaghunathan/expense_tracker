/**
 * ExportReports Component
 * Export expenses to CSV and PDF formats with filters
 * Backend: GET /api/export/csv, GET /api/export/pdf
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  MdFileDownload,
  MdPictureAsPdf,
  MdTableChart,
  MdFilterList,
  MdCalendarToday,
  MdCheckCircle,
} from 'react-icons/md';
import { exportAPI, expenseAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';

const ExportReports = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  // Export filters
  const [exportConfig, setExportConfig] = useState({
    format: 'pdf', // 'pdf' or 'csv'
    reportType: 'detailed', // 'detailed' or 'summary' (PDF only)
    period: 'month', // 'today', 'week', 'month', 'year', 'custom'
    startDate: '',
    endDate: '',
    categoryId: '',
    paymentModeId: '',
  });

  const [exportHistory, setExportHistory] = useState([]);

  // Period options
  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Date Range' },
  ];

  // Fetch categories and payment modes
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [categoriesRes, paymentModesRes] = await Promise.all([
          expenseAPI.getCategories(),
          expenseAPI.getPaymentModes(),
        ]);

        setCategories(categoriesRes.data.categories || []);
        setPaymentModes(paymentModesRes.data.payment_modes || []);
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };

    fetchMetadata();

    // Load export history from localStorage
    const history = JSON.parse(localStorage.getItem('exportHistory') || '[]');
    setExportHistory(history);
  }, []);

  const handleConfigChange = (key, value) => {
    setExportConfig((prev) => ({ ...prev, [key]: value }));
  };

  const addToHistory = (exportRecord) => {
    const newHistory = [exportRecord, ...exportHistory].slice(0, 10); // Keep last 10
    setExportHistory(newHistory);
    localStorage.setItem('exportHistory', JSON.stringify(newHistory));
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();

      // Add period or custom dates
      if (exportConfig.period === 'custom') {
        if (!exportConfig.startDate || !exportConfig.endDate) {
          toast.error('Please select both start and end dates for custom range');
          setLoading(false);
          return;
        }
        params.append('start_date', exportConfig.startDate);
        params.append('end_date', exportConfig.endDate);
      } else {
        params.append('period', exportConfig.period);
      }

      // Add optional filters
      if (exportConfig.categoryId) {
        params.append('category_id', exportConfig.categoryId);
      }
      if (exportConfig.paymentModeId) {
        params.append('payment_mode_id', exportConfig.paymentModeId);
      }

      // Add report type for PDF
      if (exportConfig.format === 'pdf') {
        params.append('report_type', exportConfig.reportType);
      }

      // Make export request
      let response;
      if (exportConfig.format === 'csv') {
        response = await exportAPI.exportCSV(params.toString());
      } else {
        response = await exportAPI.exportPDF(params.toString());
      }

      // Create blob and download
      const blob = new Blob([response.data], {
        type:
          exportConfig.format === 'csv'
            ? 'text/csv'
            : 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename =
        exportConfig.format === 'csv'
          ? `expenses_${timestamp}.csv`
          : `expense_report_${timestamp}.pdf`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Add to export history
      const exportRecord = {
        id: Date.now(),
        format: exportConfig.format.toUpperCase(),
        reportType: exportConfig.reportType,
        period: exportConfig.period,
        timestamp: new Date().toISOString(),
        filename,
      };
      addToHistory(exportRecord);

      toast.success(`${exportConfig.format.toUpperCase()} exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        error.response?.data?.error || 'Failed to export. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (period) => {
    const option = periodOptions.find((opt) => opt.value === period);
    return option ? option.label : period;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
              <MdFileDownload className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Export Reports</h1>
              <p className="text-sm text-gray-600">
                Download your expense data in CSV or PDF format
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Format Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MdFilterList className="text-2xl text-blue-600" />
                Export Configuration
              </h2>

              {/* Format Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* CSV Option */}
                  <button
                    onClick={() => handleConfigChange('format', 'csv')}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      exportConfig.format === 'csv'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <MdTableChart
                        className={`text-4xl ${
                          exportConfig.format === 'csv'
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      />
                      <div className="text-center">
                        <p className="font-bold text-gray-900">CSV</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Spreadsheet format
                        </p>
                      </div>
                      {exportConfig.format === 'csv' && (
                        <MdCheckCircle className="text-2xl text-green-600" />
                      )}
                    </div>
                  </button>

                  {/* PDF Option */}
                  <button
                    onClick={() => handleConfigChange('format', 'pdf')}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      exportConfig.format === 'pdf'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <MdPictureAsPdf
                        className={`text-4xl ${
                          exportConfig.format === 'pdf'
                            ? 'text-red-600'
                            : 'text-gray-400'
                        }`}
                      />
                      <div className="text-center">
                        <p className="font-bold text-gray-900">PDF</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Professional report
                        </p>
                      </div>
                      {exportConfig.format === 'pdf' && (
                        <MdCheckCircle className="text-2xl text-red-600" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* PDF Report Type */}
              {exportConfig.format === 'pdf' && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    PDF Report Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleConfigChange('reportType', 'summary')}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                        exportConfig.reportType === 'summary'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => handleConfigChange('reportType', 'detailed')}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                        exportConfig.reportType === 'detailed'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Detailed
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {exportConfig.reportType === 'summary'
                      ? 'Summary report includes totals and category breakdown only'
                      : 'Detailed report includes all individual expense transactions'}
                  </p>
                </div>
              )}

              {/* Time Period */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Time Period
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {periodOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleConfigChange('period', option.value)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        exportConfig.period === option.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              {exportConfig.period === 'custom' && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={exportConfig.startDate}
                        onChange={(e) =>
                          handleConfigChange('startDate', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={exportConfig.endDate}
                        onChange={(e) =>
                          handleConfigChange('endDate', e.target.value)
                        }
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Optional Filters
                </h3>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={exportConfig.categoryId}
                    onChange={(e) =>
                      handleConfigChange('categoryId', e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Mode Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode
                  </label>
                  <select
                    value={exportConfig.paymentModeId}
                    onChange={(e) =>
                      handleConfigChange('paymentModeId', e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Payment Modes</option>
                    {paymentModes.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.name}
                        {pm.bank_name ? ` (${pm.bank_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Export Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleExport}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-6 w-6 text-white"
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
                      Generating {exportConfig.format.toUpperCase()}...
                    </>
                  ) : (
                    <>
                      <MdFileDownload className="text-2xl" />
                      Export {exportConfig.format.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Export Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Export Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Format:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {exportConfig.format.toUpperCase()}
                  </span>
                </div>

                {exportConfig.format === 'pdf' && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Report Type:</span>
                    <span className="text-sm font-bold text-gray-900 capitalize">
                      {exportConfig.reportType}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Period:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {getPeriodLabel(exportConfig.period)}
                  </span>
                </div>

                {exportConfig.period === 'custom' &&
                  exportConfig.startDate &&
                  exportConfig.endDate && (
                    <div className="py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600 block mb-1">
                        Date Range:
                      </span>
                      <span className="text-xs font-medium text-gray-900">
                        {formatDate(exportConfig.startDate)} to{' '}
                        {formatDate(exportConfig.endDate)}
                      </span>
                    </div>
                  )}

                {exportConfig.categoryId && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {categories.find(
                        (c) => c.id === parseInt(exportConfig.categoryId)
                      )?.name || 'N/A'}
                    </span>
                  </div>
                )}

                {exportConfig.paymentModeId && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Payment:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {paymentModes.find(
                        (p) => p.id === parseInt(exportConfig.paymentModeId)
                      )?.name || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Export History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MdCalendarToday className="text-blue-600" />
                Recent Exports
              </h3>

              {exportHistory.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {exportHistory.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {record.format === 'PDF' ? (
                            <MdPictureAsPdf className="text-xl text-red-600" />
                          ) : (
                            <MdTableChart className="text-xl text-green-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {record.format}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getPeriodLabel(record.period)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(record.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No export history yet
                </p>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Export Formats
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-blue-900">CSV Format</p>
                  <p className="text-gray-700 text-xs mt-1">
                    Best for data analysis in Excel, Google Sheets, or other
                    spreadsheet tools
                  </p>
                </div>
                <div>
                  <p className="font-medium text-red-900">PDF Format</p>
                  <p className="text-gray-700 text-xs mt-1">
                    Professional reports with charts and summaries, ideal for
                    sharing or printing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReports;
