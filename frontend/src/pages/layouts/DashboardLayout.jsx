/**
 * DashboardLayout Component
 * Specialized layout for dashboard-specific features
 * Can be used if dashboard needs different layout than other pages
 * Currently uses same structure as MainLayout
 */

import { Outlet } from 'react-router-dom';
import MainLayout from './MainLayout';

const DashboardLayout = () => {
  // You can add dashboard-specific features here
  // For now, it uses the MainLayout structure
  // This provides flexibility for future customization

  return <MainLayout />;
};

export default DashboardLayout;
