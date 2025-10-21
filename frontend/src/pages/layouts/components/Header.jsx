/**
 * Header Component
 * Reusable header with navigation actions, notifications, and user menu
 */


import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MdMenu,
  MdNotifications,
  MdSettings,
  MdPerson,
  MdLogout,
  MdAccountBalanceWallet,
} from 'react-icons/md';
import { getUserData, logout } from '../../utils/auth';
import { toast } from 'react-hot-toast';


const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ ADDED: Track route changes
  const [userData, setUserData] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // ✅ FIXED: Reload user data when route changes
  useEffect(() => {
    const user = getUserData();
    console.log('📋 Header - User Data from localStorage:', user);
    console.log('📋 Full Name Value:', user?.full_name);
    console.log('📋 Email Value:', user?.email);
    setUserData(user);
  }, [location]); // ✅ CHANGED: Added location as dependency

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  // Sample notifications (replace with real data)
  const notifications = [
    {
      id: 1,
      title: 'New expense added',
      message: 'Food expense of ₹500 was added',
      time: '5 minutes ago',
      read: false,
    },
    {
      id: 2,
      title: 'Monthly report ready',
      message: 'Your expense report for October is ready',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 3,
      title: 'Budget alert',
      message: 'You have reached 80% of your monthly budget',
      time: '1 day ago',
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Get display name with fallback
  const getDisplayName = () => {
    if (userData?.full_name && userData.full_name.trim()) {
      return userData.full_name;
    }
    if (userData?.email) {
      return userData.email.split('@')[0];
    }
    return 'User';
  };

  // Get first name
  const getFirstName = () => {
    const fullName = getDisplayName();
    return fullName.split(' ')[0];
  };

  // Get initial for avatar
  const getInitial = () => {
    if (userData?.full_name && userData.full_name.trim()) {
      return userData.full_name.charAt(0).toUpperCase();
    }
    if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="h-20 bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <MdMenu className="text-2xl text-gray-600" />
          </button>

          {/* Logo for Mobile */}
          <Link
            to="/dashboard"
            className="lg:hidden flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MdAccountBalanceWallet className="text-lg text-white" />
            </div>
            <span className="font-bold text-gray-900">Expense Tracker</span>
          </Link>

          {/* Welcome Message for Desktop */}
          <div className="hidden lg:block">
            <h2 className="text-xl font-bold text-gray-900">
              Welcome back, {getFirstName()}!
            </h2>
            <p className="text-sm text-gray-500">
              Track and manage your expenses efficiently
            </p>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <MdNotifications className="text-2xl text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Menu */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-2 h-2 rounded-full mt-2 ${
                                !notification.read ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            ></div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-gray-200 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settings Link */}
          <Link
            to="/settings"
            className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Settings"
          >
            <MdSettings className="text-2xl text-gray-600" />
          </Link>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {getInitial()}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {getFirstName()}
              </span>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                  {/* User Info */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {getInitial()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {getDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {userData?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MdPerson className="text-xl" />
                      <span className="text-sm font-medium">My Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MdSettings className="text-xl" />
                      <span className="text-sm font-medium">Settings</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="p-2 border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <MdLogout className="text-xl" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
