/**
 * Main Routes Configuration
 * Defines all application routes with lazy loading for better performance
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import ROUTES from './routes.config';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Loading component with better styling
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// Lazy load pages for code splitting
// Auth pages
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));

// Dashboard
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));

// Expense pages
const ExpenseList = lazy(() => import('../pages/expenses/ExpenseList'));
const AddExpense = lazy(() => import('../pages/expenses/AddExpense'));
const EditExpense = lazy(() => import('../pages/expenses/EditExpense'));
const ExpenseDetails = lazy(() => import('../pages/expenses/ExpenseDetails'));

// Analytics pages
const Analytics = lazy(() => import('../pages/analytics/Analytics'));
const CategoryBreakdown = lazy(() => import('../pages/analytics/CategoryBreakdown'));
const PaymentAnalysis = lazy(() => import('../pages/analytics/PaymentAnalysis'));
const TrendAnalysis = lazy(() => import('../pages/analytics/TrendAnalysis'));

// AI pages
const AiInsights = lazy(() => import('../pages/ai/AiInsights'));

// Export pages
const ExportReports = lazy(() => import('../pages/export/ExportReports'));

// Profile pages
const Profile = lazy(() => import('../pages/profile/Profile'));
const Settings = lazy(() => import('../pages/profile/Settings'));

// Error pages
const NotFound = lazy(() => import('../pages/NotFound'));
const Unauthorized = lazy(() => import('../pages/Unauthorized'));

/**
 * Main Router Component
 * Handles all application routing with authentication protection
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Root redirect - redirect to login if not authenticated, else dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public routes - Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.REGISTER}
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
        </Route>

        {/* Protected routes - Main Layout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

          {/* Expense Management */}
          <Route path={ROUTES.EXPENSES} element={<ExpenseList />} />
          <Route path={ROUTES.ADD_EXPENSE} element={<AddExpense />} />
          <Route path={ROUTES.EDIT_EXPENSE} element={<EditExpense />} />
          <Route path={ROUTES.EXPENSE_DETAILS} element={<ExpenseDetails />} />

          {/* Analytics */}
          <Route path={ROUTES.ANALYTICS} element={<Analytics />} />
          <Route path={ROUTES.CATEGORY_BREAKDOWN} element={<CategoryBreakdown />} />
          <Route path={ROUTES.PAYMENT_ANALYSIS} element={<PaymentAnalysis />} />
          <Route path={ROUTES.TREND_ANALYSIS} element={<TrendAnalysis />} />

          {/* AI Insights */}
          <Route path={ROUTES.AI_INSIGHTS} element={<AiInsights />} />

          {/* Export Reports */}
          <Route path={ROUTES.EXPORT_REPORTS} element={<ExportReports />} />

          {/* Profile & Settings */}
          <Route path={ROUTES.PROFILE} element={<Profile />} />
          <Route path={ROUTES.SETTINGS} element={<Settings />} />
        </Route>

        {/* Error routes - Outside layouts for full-screen display */}
        <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        
        {/* Catch all route - 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
