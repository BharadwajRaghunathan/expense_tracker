/**
 * Router Configuration
 * Alternative router setup file
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';

// Layouts
import MainLayout from './pages/layouts/MainLayout';
import AuthLayout from './pages/layouts/AuthLayout';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// Lazy loaded components
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const ExpenseList = lazy(() => import('./pages/expenses/ExpenseList'));
const AddExpense = lazy(() => import('./pages/expenses/AddExpense'));
const EditExpense = lazy(() => import('./pages/expenses/EditExpense'));
const ExpenseDetails = lazy(() => import('./pages/expenses/ExpenseDetails'));
const Analytics = lazy(() => import('./pages/analytics/Analytics'));
const CategoryBreakdown = lazy(() => import('./pages/analytics/CategoryBreakdown'));
const PaymentAnalysis = lazy(() => import('./pages/analytics/PaymentAnalysis'));
const TrendAnalysis = lazy(() => import('./pages/analytics/TrendAnalysis'));
const AiInsights = lazy(() => import('./pages/ai/AiInsights'));
const ExportReports = lazy(() => import('./pages/export/ExportReports'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const Settings = lazy(() => import('./pages/profile/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

const Router = () => {
  console.log('🔀 Router component rendering');
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ====================================== */}
        {/* PUBLIC ROUTES (NO PublicRoute wrapper) */}
        {/* ====================================== */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* ====================================== */}
        {/* PROTECTED ROUTES */}
        {/* ====================================== */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Expenses */}
          <Route path="/expenses" element={<ExpenseList />} />
          <Route path="/expenses/add" element={<AddExpense />} />
          <Route path="/expenses/edit/:id" element={<EditExpense />} />
          <Route path="/expenses/:id" element={<ExpenseDetails />} />

          {/* Analytics */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/analytics/category" element={<CategoryBreakdown />} />
          <Route path="/analytics/payment" element={<PaymentAnalysis />} />
          <Route path="/analytics/trends" element={<TrendAnalysis />} />

          {/* AI & Export */}
          <Route path="/ai-insights" element={<AiInsights />} />
          <Route path="/export" element={<ExportReports />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Error routes */}
        <Route path="/401" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default Router;
