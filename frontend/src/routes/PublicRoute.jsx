/**
 * PublicRoute Component
 * Wrapper for routes that should only be accessible when NOT authenticated
 */

import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const PublicRoute = ({ children }) => {
  const location = useLocation();
  
  console.log('🌐 PublicRoute Check');
  console.log('   Current path:', location.pathname);
  
  const authenticated = isAuthenticated();
  console.log('   Is authenticated:', authenticated);
  
  // If authenticated, redirect to dashboard
  if (authenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    console.log('✅ Already authenticated - redirecting to:', from);
    
    // IMPORTANT: Don't render children, just redirect
    return <Navigate to={from} replace />;
  }

  console.log('👤 Not authenticated - showing public page');
  return children;
};

export default PublicRoute;
