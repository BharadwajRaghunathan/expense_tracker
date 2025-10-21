/**
 * AddExpense Component
 * Form for creating new expense
 * Backend: POST /api/expenses
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MdArrowBack, MdSave } from 'react-icons/md';
import { expenseAPI } from '../../services/api';

const AddExpense = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category_id: '',
    payment_mode_id: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0], // Today's date
  });

  const [categories, setCategories] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
        toast.error('Failed to load form data');
      }
    };

    fetchMetadata();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Category validation
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    // Payment mode validation
    if (!formData.payment_mode_id) {
      newErrors.payment_mode_id = 'Payment mode is required';
    }

    // Amount validation - Backend requires positive number, max 99999999.99
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      } else if (amount > 99999999.99) {
        newErrors.amount = 'Amount is too large (max: 99,999,999.99)';
      }
    }

    // Description validation - Backend requires 3-255 characters
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    } else if (formData.description.trim().length > 255) {
      newErrors.description = 'Description is too long (max: 255 characters)';
    }

    // Date validation - Backend checks date is not too old (5 years)
    if (!formData.expense_date) {
      newErrors.expense_date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.expense_date);
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      
      if (selectedDate < fiveYearsAgo) {
        newErrors.expense_date = 'Date is too old (max 5 years ago)';
      } else if (selectedDate > new Date()) {
        newErrors.expense_date = 'Date cannot be in the future';
      }
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

    setLoading(true);

    try {
      // Backend expects: { category_id, payment_mode_id, amount, description, expense_date }
      const payload = {
        category_id: parseInt(formData.category_id),
        payment_mode_id: parseInt(formData.payment_mode_id),
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        expense_date: formData.expense_date,
      };

      await expenseAPI.createExpense(payload);
      
      toast.success('Expense added successfully!');
      navigate('/expenses');
    } catch (error) {
      console.error('Error adding expense:', error);
      
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.error || 'Invalid expense data');
      } else if (error.response?.status === 404) {
        toast.error('Invalid category or payment mode');
      } else {
        toast.error('Failed to add expense. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Add New Expense</h1>
          <p className="mt-1 text-sm text-gray-600">
            Fill in the details to track your expense
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
                placeholder="Enter expense description (3-255 characters)"
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
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <MdSave className="text-xl" />
                    Save Expense
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

export default AddExpense;
