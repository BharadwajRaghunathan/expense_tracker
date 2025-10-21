/**
 * ProtectedRoute Component
 * Wrapper component that protects routes requiring authentication
 * Redirects to login if user is not authenticated
 */

import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  console.log('🛡️ ProtectedRoute Check');
  console.log('   Current path:', location.pathname);
  
  const authenticated = isAuthenticated();
  console.log('   Is authenticated:', authenticated);
  
  // Check if user is authenticated
  if (!authenticated) {
    console.log('⛔ Not authenticated - redirecting to /login');
    console.log('   Saving return path:', location.pathname);
    // Redirect to login page, but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('✅ Authenticated - rendering protected content');
  // User is authenticated, render the protected component
  return children;
};

export default ProtectedRoute;
