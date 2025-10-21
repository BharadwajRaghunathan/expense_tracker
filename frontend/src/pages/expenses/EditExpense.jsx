/**
 * EditExpense Component
 * Form for updating existing expense
 * Backend: PUT /api/expenses/:id
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MdArrowBack, MdSave } from 'react-icons/md';
import { expenseAPI } from '../../services/api';

const EditExpense = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    category_id: '',
    payment_mode_id: '',
    amount: '',
    description: '',
    expense_date: '',
  });

  const [categories, setCategories] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch expense details and metadata
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expenseRes, categoriesRes, paymentModesRes] = await Promise.all([
          expenseAPI.getExpenseById(id),
          expenseAPI.getCategories(),
          expenseAPI.getPaymentModes(),
        ]);

        const expense = expenseRes.data.expense;
        
        setFormData({
          category_id: expense.category_id,
          payment_mode_id: expense.payment_mode_id,
          amount: expense.amount,
          description: expense.description,
          expense_date: expense.expense_date,
        });

        setCategories(categoriesRes.data.categories || []);
        setPaymentModes(paymentModesRes.data.payment_modes || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        
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

    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.payment_mode_id) {
      newErrors.payment_mode_id = 'Payment mode is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      } else if (amount > 99999999.99) {
        newErrors.amount = 'Amount is too large';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    } else if (formData.description.trim().length > 255) {
      newErrors.description = 'Description is too long';
    }

    if (!formData.expense_date) {
      newErrors.expense_date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSaving(true);

    try {
      // Backend PUT endpoint accepts partial updates
      const payload = {
        category_id: parseInt(formData.category_id),
        payment_mode_id: parseInt(formData.payment_mode_id),
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        expense_date: formData.expense_date,
      };

      await expenseAPI.updateExpense(id, payload);
      
      toast.success('Expense updated successfully!');
      navigate('/expenses');
    } catch (error) {
      console.error('Error updating expense:', error);
      
      if (error.response?.status === 404) {
        toast.error('Expense not found');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.error || 'Invalid expense data');
      } else {
        toast.error('Failed to update expense. Please try again.');
      }
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/expenses"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <MdArrowBack className="text-xl" />
            Back to Expenses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Expense</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update expense details
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  ₹
                </span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="99999999.99"
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                maxLength="255"
                className={`w-full px-4 py-3 border ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none`}
                placeholder="Enter expense description"
              />
              <div className="flex justify-between mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-500">{errors.description}</p>
                ) : (
                  <p className="text-sm text-gray-500">Minimum 3 characters</p>
                )}
                <p className="text-sm text-gray-500">
                  {formData.description.length}/255
                </p>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${
                  errors.category_id ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <label htmlFor="payment_mode_id" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                id="payment_mode_id"
                name="payment_mode_id"
                value={formData.payment_mode_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${
                  errors.payment_mode_id ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">Select a payment mode</option>
                {paymentModes.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.name}
                    {mode.bank_name ? ` (${mode.bank_name})` : ''}
                  </option>
                ))}
              </select>
              {errors.payment_mode_id && (
                <p className="mt-1 text-sm text-red-500">{errors.payment_mode_id}</p>
              )}
            </div>

            {/* Expense Date */}
            <div>
              <label htmlFor="expense_date" className="block text-sm font-medium text-gray-700 mb-2">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="expense_date"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border ${
                  errors.expense_date ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.expense_date && (
                <p className="mt-1 text-sm text-red-500">{errors.expense_date}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/expenses')}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <MdSave className="text-xl" />
                    Update Expense
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditExpense;
