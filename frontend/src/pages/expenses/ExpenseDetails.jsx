/**
 * ExpenseDetails Component
 * View detailed information about a specific expense
 * Backend: GET /api/expenses/:id
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  MdArrowBack,
  MdEdit,
  MdDelete,
  MdCalendarToday,
  MdCategory,
  MdPayment,
  MdDescription,
  MdAttachMoney,
} from 'react-icons/md';
import { expenseAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

const ExpenseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const response = await expenseAPI.getExpenseById(id);
        setExpense(response.data.expense);
      } catch (error) {
        console.error('Error fetching expense:', error);
        
        if (error.response?.status === 404) {
          toast.error('Expense not found');
          navigate('/expenses');
        } else {
          toast.error('Failed to load expense details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      await expenseAPI.deleteExpense(id);
      toast.success('Expense deleted successfully');
      navigate('/expenses');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expense details...</p>
        </div>
      </div>
    );
  }

  if (!expense) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/expenses"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <MdArrowBack className="text-xl" />
            Back to Expenses
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Expense Details</h1>
            <div className="flex gap-3">
              <Link
                to={`/expenses/edit/${id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MdEdit className="text-xl" />
                Edit
              </Link>
              <button
                onClick={() => setDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <MdDelete className="text-xl" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Amount Card */}
          <div className="lg:col-span-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <MdAttachMoney className="text-4xl" />
              <p className="text-blue-100 text-lg font-medium">Total Amount</p>
            </div>
            <h2 className="text-5xl font-bold">{formatCurrency(expense.amount)}</h2>
          </div>

          {/* Details Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Expense Information</h3>
            
            <div className="space-y-6">
              {/* Description */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <MdDescription className="text-2xl text-gray-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                  <p className="text-lg text-gray-900">{expense.description}</p>
                </div>
              </div>

              {/* Category */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: expense.category?.color + '20' || '#3B82F620',
                    }}
                  >
                    <MdCategory
                      className="text-2xl"
                      style={{ color: expense.category?.color || '#3B82F6' }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
                  <p className="text-lg text-gray-900">{expense.category?.name}</p>
                  {expense.category?.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {expense.category.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Mode */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <MdPayment className="text-2xl text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Payment Mode</p>
                  <p className="text-lg text-gray-900">
                    {expense.payment_mode?.name}
                    {expense.payment_mode?.bank_name && (
                      <span className="text-gray-600 text-base ml-2">
                        ({expense.payment_mode.bank_name})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MdCalendarToday className="text-2xl text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Expense Date</p>
                  <p className="text-lg text-gray-900">{formatDate(expense.expense_date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Metadata</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Created At</p>
                <p className="text-sm text-gray-900">
                  {new Date(expense.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                <p className="text-sm text-gray-900">
                  {new Date(expense.updated_at).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Expense ID</p>
                <p className="text-sm text-gray-900 font-mono">#{expense.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Expense</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>

            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-900 font-medium">
                {expense.description}
              </p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(expense.amount)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
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

export default ExpenseDetails;
