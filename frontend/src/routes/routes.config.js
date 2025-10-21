/**
 * Route Configuration
 * Defines all route paths and metadata for the application
 */

// Route path constants
export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  
  // Expense routes
  EXPENSES: '/expenses',
  ADD_EXPENSE: '/expenses/add',
  EDIT_EXPENSE: '/expenses/edit/:id',
  EXPENSE_DETAILS: '/expenses/:id',
  
  // Analytics routes
  ANALYTICS: '/analytics',
  CATEGORY_BREAKDOWN: '/analytics/category',
  PAYMENT_ANALYSIS: '/analytics/payment',
  TREND_ANALYSIS: '/analytics/trends',
  
  // AI routes
  AI_INSIGHTS: '/ai-insights',
  
  // Export routes
  EXPORT_REPORTS: '/export',
  
  // Profile routes
  PROFILE: '/profile',
  SETTINGS: '/settings',
  
  // Error routes
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
};

// Route metadata
export const ROUTE_METADATA = {
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard',
    requiresAuth: true,
    showInNav: true,
    icon: 'MdDashboard',
  },
  [ROUTES.EXPENSES]: {
    title: 'Expenses',
    requiresAuth: true,
    showInNav: true,
    icon: 'MdAccountBalanceWallet',
  },
  [ROUTES.ANALYTICS]: {
    title: 'Analytics',
    requiresAuth: true,
    showInNav: true,
    icon: 'MdBarChart',
  },
  [ROUTES.AI_INSIGHTS]: {
    title: 'AI Insights',
    requiresAuth: true,
    showInNav: true,
    icon: 'MdPsychology',
  },
  [ROUTES.EXPORT_REPORTS]: {
    title: 'Export',
    requiresAuth: true,
    showInNav: true,
    icon: 'MdFileDownload',
  },
  [ROUTES.PROFILE]: {
    title: 'Profile',
    requiresAuth: true,
    showInNav: true,
    icon: 'MdPerson',
  },
};

// API endpoints - matching backend routes
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },
  
  // Expense endpoints
  EXPENSES: {
    BASE: '/api/expenses',
    BY_ID: (id) => `/api/expenses/${id}`,
    SUMMARY: '/api/expenses/summary',
  },
  
  // Category endpoints
  CATEGORIES: {
    BASE: '/api/expenses/categories',
  },
  
  // Payment mode endpoints
  PAYMENT_MODES: {
    BASE: '/api/expenses/payment-modes',
  },
  
  // Analytics endpoints
  ANALYTICS: {
    CATEGORY_BREAKDOWN: '/api/analytics/category-breakdown',
    PAYMENT_BREAKDOWN: '/api/analytics/payment-breakdown',
    CROSS_TAB: '/api/analytics/cross-tab',
    DAILY_TREND: '/api/analytics/daily-trend',
    MONTHLY_SUMMARY: '/api/analytics/monthly-summary',
  },
  
  // AI endpoints
  AI: {
    QUERY: '/api/ai/query',
    SUGGESTIONS: '/api/ai/suggestions',
  },
  
  // Export endpoints
  EXPORT: {
    CSV: '/api/export/csv',
    PDF: '/api/export/pdf',
    SUMMARY_PDF: '/api/export/summary-pdf',
  },
};

export default ROUTES;
