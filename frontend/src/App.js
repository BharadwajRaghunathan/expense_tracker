/**
 * App Component
 * Root component that sets up routing and global providers
 */

import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Router from './router'; // Using router.jsx
import './App.css';

function App() {
  console.log('🚀 App component loaded');
  
  return (
    <BrowserRouter>
      {/* Global Toast Notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          // Default options
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            fontSize: '14px',
            fontWeight: '500',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          // Success
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          // Error
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          // Loading
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Main Application Routes */}
      <Router />
    </BrowserRouter>
  );
}

export default App;
