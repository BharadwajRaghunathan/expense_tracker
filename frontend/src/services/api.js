/**
 * API Service
 * Centralized API calls with axios interceptors for authentication
 */


import axios from 'axios';
import { getAuthToken, logout } from '../utils/auth';
import { toast } from 'react-hot-toast';


// Base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';


console.log('🌐 API Base URL:', API_BASE_URL);


// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: false,
});


// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
    });


    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token attached');
    } else {
      console.log('⚠️ No token');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);


// ✅ IMPROVED: Response interceptor with better error logging
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', {
      status: response.status,
      url: response.config.url,
    });
    
    // ✅ ADDED: Log auth responses for debugging
    if (response.config.url.includes('/auth/login') || response.config.url.includes('/auth/register')) {
      console.log('🔍 AUTH RESPONSE DATA:', response.data);
      console.log('🔍 USER OBJECT:', response.data.user);
      console.log('🔍 FULL_NAME VALUE:', response.data.user?.full_name);
    }
    
    return response;
  },
  async (error) => {
    // ✅ IMPROVED: Better error logging to see backend errors
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      // ✅ ADDED: Show full backend error response
      backendError: error.response?.data?.error || error.response?.data?.message,
      fullErrorData: error.response?.data,
    });
    
    // ✅ ADDED: Log full error for 500 errors
    if (error.response?.status === 500) {
      console.error('🔥 BACKEND 500 ERROR DETAILS:', {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        errorMessage: error.response?.data?.error,
        fullResponse: error.response?.data,
      });
    }


    const originalRequest = error.config;
    if (!error.response) {
      toast.error('Cannot connect to server');
      return Promise.reject(error);
    }


    if (error.response.status === 401) {
      const url = originalRequest.url;
      const isAuth = url.includes('/auth/');
      const isUser = url.includes('/user/');
      if ((isAuth || isUser) && !originalRequest._retry) {
        originalRequest._retry = true;
        console.log('🔒 Auth failed on auth/user route - logging out');
        await logout();
        window.location.href = '/login';
        toast.error('Session expired');
        return Promise.reject(error);
      }
      console.warn('⚠️ 401 on non-auth route:', url);
    }


    if (error.response.status === 500) {
      // ✅ IMPROVED: Show backend error message if available
      const backendMessage = error.response?.data?.error || error.response?.data?.message;
      toast.error(backendMessage || 'Server error occurred');
    }
    return Promise.reject(error);
  }
);


// ============================================================================
// AUTH API
// ============================================================================
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
};


// ============================================================================
// EXPENSE API
// ============================================================================
export const expenseAPI = {
  getExpenses: (params) => apiClient.get('/expenses', { params }),
  getExpenseById: (id) => apiClient.get(`/expenses/${id}`),
  createExpense: (data) => apiClient.post('/expenses/add', data), // fixed
  updateExpense: (id, data) => apiClient.put(`/expenses/${id}`, data),
  deleteExpense: (id) => apiClient.delete(`/expenses/${id}`),
  getCategories: () => apiClient.get('/expenses/categories'),
  getPaymentModes: () => apiClient.get('/expenses/payment-modes'),
  getSummary: (params) => apiClient.get('/expenses/summary', { params }),
};


// ============================================================================
// ANALYTICS API
// ============================================================================
export const analyticsAPI = {
  getCategoryBreakdown: (startDate, endDate) =>
    apiClient.get('/analytics/categories-vs-expenses', {
      params: { start_date: startDate, end_date: endDate },
    }),
  getPaymentBreakdown: (startDate, endDate) =>
    apiClient.get('/analytics/payment-modes-vs-expenses', {
      params: { start_date: startDate, end_date: endDate },
    }),
  getCrossTab: (startDate, endDate) =>
    apiClient.get('/analytics/payment-modes-vs-categories', {
      params: { start_date: startDate, end_date: endDate },
    }),
  getDailyTrend: (days = 7) =>
    apiClient.get('/analytics/daily-trend', {
      params: { days },
    }),
  getMonthlySummary: () =>
    apiClient.get('/analytics/monthly-summary'),
};


// ============================================================================
// AI API
// ============================================================================
export const aiAPI = {
  query: (data) => apiClient.post('/ai/query', data),
  getSuggestions: () => apiClient.get('/ai/suggestions'),
};


// ============================================================================
// EXPORT API
// ============================================================================
export const exportAPI = {
  exportCSV: (params) =>
    apiClient.get(`/export/csv?${params}`, {
      responseType: 'blob',
    }),
  exportPDF: (params) =>
    apiClient.get(`/export/pdf?${params}`, {
      responseType: 'blob',
    }),
};


// ============================================================================
// USER API
// ============================================================================
export const userAPI = {
  getProfile: () => apiClient.get('/user/profile'),
  updateProfile: (data) => apiClient.put('/user/profile', data),
  changePassword: (data) => apiClient.post('/user/change-password', data),
};


export default apiClient;
