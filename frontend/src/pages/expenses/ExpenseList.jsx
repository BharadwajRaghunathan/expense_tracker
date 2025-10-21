/**
 * ExpenseList Component
 * Displays paginated list of expenses with filters
 * Backend: GET /api/expenses
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdFilterList,
  MdSearch,
  MdCalendarToday,
  MdAttachMoney,
} from 'react-icons/md';
import { expenseAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

const ExpenseList = () => {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  
  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    currentPage: 1,
  });

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categoryId: '',
    paymentModeId: '',
    searchTerm: '',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, expense: null });

  // Fetch expenses with filters
  const fetchExpenses = async () => {
    try {
      setLoading(true);

      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
      };

      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.categoryId) params.category_id = filters.categoryId;
      if (filters.paymentModeId) params.payment_mode_id = filters.paymentModeId;

      const response = await expenseAPI.getExpenses(params);
      
      // Backend returns: { expenses: [], total_count: 0, limit: 20, offset: 0 }
      setExpenses(response.data.expenses || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total_count || 0,
      }));
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories and payment modes
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

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [pagination.offset, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, offset: 0, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      categoryId: '',
      paymentModeId: '',
      searchTerm: '',
    });
  };

  const handlePageChange = (newPage) => {
    const newOffset = (newPage - 1) * pagination.limit;
    setPagination((prev) => ({
      ...prev,
      offset: newOffset,
      currentPage: newPage,
    }));
  };

  const handleDelete = async () => {
    if (!deleteModal.expense) return;

    try {
      await expenseAPI.deleteExpense(deleteModal.expense.id);
      toast.success('Expense deleted successfully');
      setDeleteModal({ show: false, expense: null });
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Filter expenses by search term (client-side)
  const filteredExpenses = expenses.filter((expense) =>
    filters.searchTerm
      ? expense.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      : true
  );

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage and track your expenses
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MdFilterList className="text-xl" />
              Filters
            </button>

            <Link
              to="/expenses/add"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <MdAdd className="text-xl" />
              Add Expense
            </Link>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => handleFilterChange('categoryId', e.target.value)}
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
                  value={filters.paymentModeId}
                  onChange={(e) => handleFilterChange('paymentModeId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Payment Modes</option>
                  {paymentModes.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name} {pm.bank_name ? `(${pm.bank_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search expenses by description..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredExpenses.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Mode
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/expenses/${expense.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <MdCalendarToday className="text-gray-400" />
                            {formatDate(expense.expense_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: expense.category?.color + '20' || '#3B82F620',
                              color: expense.category?.color || '#3B82F6',
                            }}
                          >
                            {expense.category?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {expense.payment_mode?.name}
                          {expense.payment_mode?.bank_name && (
                            <span className="text-gray-500 text-xs ml-1">
                              ({expense.payment_mode.bank_name})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/expenses/edit/${expense.id}`);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-2"
                            >
                              <MdEdit className="text-xl" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteModal({ show: true, expense });
                              }}
                              className="text-red-600 hover:text-red-900 p-2"
                            >
                              <MdDelete className="text-xl" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/expenses/${expense.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {expense.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MdCalendarToday />
                          {formatDate(expense.expense_date)}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: expense.category?.color + '20' || '#3B82F620',
                          color: expense.category?.color || '#3B82F6',
                        }}
                      >
                        {expense.category?.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        {expense.payment_mode?.name}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/expenses/edit/${expense.id}`);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                      >
                        <MdEdit /> Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ show: true, expense });
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium"
                      >
                        <MdDelete /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing {pagination.offset + 1} to{' '}
                    {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                    {pagination.total} expenses
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                              page === pagination.currentPage
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === pagination.currentPage - 2 ||
                        page === pagination.currentPage + 2
                      ) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}

                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <MdAttachMoney className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-4">No expenses found</p>
              <Link
                to="/expenses/add"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MdAdd className="text-xl" />
                Add Your First Expense
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Expense</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                <strong>Description:</strong> {deleteModal.expense?.description}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Amount:</strong> {formatCurrency(deleteModal.expense?.amount)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, expense: null })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
