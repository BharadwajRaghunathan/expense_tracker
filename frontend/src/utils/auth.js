/**
 * Authentication Utility Functions
 * Handles JWT token storage, validation, and user session management
 */

// Token and user data keys for localStorage
const TOKEN_KEY = 'expense_tracker_token';
const USER_KEY = 'expense_tracker_user';

/**
 * Check if user is authenticated
 * @returns {boolean} - True if valid token exists
 */
export const isAuthenticated = () => {
  console.log('🔍 === AUTHENTICATION CHECK START ===');
  
  try {
    const token = getAuthToken();
    console.log('1️⃣ Token exists:', !!token);
    console.log('   Token value:', token ? token.substring(0, 50) + '...' : 'null');
    
    // If no token exists, user is not authenticated
    if (!token) {
      console.log('❌ RESULT: Not authenticated (no token)');
      console.log('🔍 === AUTHENTICATION CHECK END ===\n');
      return false;
    }

    // Validate token format (JWT has 3 parts separated by dots)
    const parts = token.split('.');
    console.log('2️⃣ Token parts count:', parts.length);
    
    if (parts.length !== 3) {
      console.warn('⚠️ Invalid token format - expected 3 parts, got', parts.length);
      removeAuthToken(); // Clear invalid token
      console.log('❌ RESULT: Not authenticated (invalid format)');
      console.log('🔍 === AUTHENTICATION CHECK END ===\n');
      return false;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(parts[1]));
      console.log('3️⃣ Token payload decoded:', payload);
      
      // Check if payload has expiration
      if (!payload.exp) {
        console.log('⚠️ Token has no expiration - allowing access');
        console.log('✅ RESULT: Authenticated (no expiration check)');
        console.log('🔍 === AUTHENTICATION CHECK END ===\n');
        return true; // Allow if no expiration set
      }

      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const isValid = currentTime < expirationTime;
      
      console.log('4️⃣ Token expiration check:');
      console.log('   Expires at:', new Date(expirationTime).toLocaleString());
      console.log('   Current time:', new Date(currentTime).toLocaleString());
      console.log('   Is valid:', isValid);
      console.log('   Time remaining:', Math.round((expirationTime - currentTime) / 1000 / 60), 'minutes');

      // Clear token if expired
      if (!isValid) {
        console.log('❌ Token has expired');
        logout();
        console.log('❌ RESULT: Not authenticated (expired)');
        console.log('🔍 === AUTHENTICATION CHECK END ===\n');
        return false;
      }

      console.log('✅ RESULT: Authenticated (valid token)');
      console.log('🔍 === AUTHENTICATION CHECK END ===\n');
      return true;
    } catch (decodeError) {
      console.error('❌ Token decode error:', decodeError);
      removeAuthToken(); // Clear invalid token
      console.log('❌ RESULT: Not authenticated (decode error)');
      console.log('🔍 === AUTHENTICATION CHECK END ===\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication check error:', error);
    console.log('❌ RESULT: Not authenticated (exception)');
    console.log('🔍 === AUTHENTICATION CHECK END ===\n');
    return false;
  }
};

/**
 * Get authentication token from localStorage
 * @returns {string|null} - JWT token or null
 */
export const getAuthToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Set authentication token in localStorage
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      console.log('💾 Token saved to localStorage');
      console.log('   Key:', TOKEN_KEY);
      console.log('   Value:', token.substring(0, 50) + '...');
    }
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    console.log('🗑️ Token removed from localStorage');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

/**
 * Get user data from localStorage
 * @returns {object|null} - User object or null
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Set user data in localStorage
 * @param {object} user - User object
 */
export const setUserData = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      console.log('💾 User data saved to localStorage');
      console.log('   Key:', USER_KEY);
      console.log('   Value:', user);
    }
  } catch (error) {
    console.error('Error setting user data:', error);
  }
};

/**
 * Update user data in localStorage
 * @param {object} updates - Partial user object with updates
 */
export const updateUserData = (updates) => {
  try {
    const currentUser = getUserData();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setUserData(updatedUser);
    }
  } catch (error) {
    console.error('Error updating user data:', error);
  }
};

/**
 * Remove user data from localStorage
 */
export const removeUserData = () => {
  try {
    localStorage.removeItem(USER_KEY);
    console.log('🗑️ User data removed from localStorage');
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};

/**
 * Logout user - Clear all auth data
 */
export const logout = () => {
  console.log('👋 Logging out user...');
  try {
    removeAuthToken();
    removeUserData();
    // Clear any other user-specific data
    localStorage.removeItem('exportHistory');
    console.log('✅ Logout complete');
  } catch (error) {
    console.error('Error during logout:', error);
  }
  return Promise.resolve();
};

/**
 * Initialize auth - Check token validity on app load
 * @returns {boolean} - True if session is valid
 */
export const initializeAuth = () => {
  if (!isAuthenticated()) {
    logout(); // Clear invalid session
    return false;
  }
  return true;
};

/**
 * Get authorization header for API requests
 * @returns {object} - Authorization header object
 */
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Decode JWT token payload
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid token format');
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Get user ID from token
 * @returns {string|null} - User ID or null
 */
export const getUserId = () => {
  const token = getAuthToken();
  if (!token) return null;

  const payload = decodeToken(token);
  return payload?.sub || payload?.user_id || payload?.id || null;
};

/**
 * Check if token will expire soon (within 5 minutes)
 * @returns {boolean} - True if token expires soon
 */
export const isTokenExpiringSoon = () => {
  try {
    const token = getAuthToken();
    if (!token) return false;

    const payload = decodeToken(token);
    if (!payload || !payload.exp) return false;

    const expirationTime = payload.exp * 1000;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() > expirationTime - fiveMinutes;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return false;
  }
};

/**
 * Get token expiration time
 * @returns {Date|null} - Expiration date or null
 */
export const getTokenExpiration = () => {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const payload = decodeToken(token);
    if (!payload || !payload.exp) return null;

    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

/**
 * Save login data (token and user info)
 * @param {string} token - JWT token
 * @param {object} user - User data object
 */
export const saveLoginData = (token, user) => {
  console.log('💾 Saving login data...');
  try {
    setAuthToken(token);
    setUserData(user);
    console.log('✅ Login data saved successfully');
  } catch (error) {
    console.error('Error saving login data:', error);
  }
};
