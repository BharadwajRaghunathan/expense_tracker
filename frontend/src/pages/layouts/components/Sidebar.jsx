/**
 * Sidebar Component
 * Reusable navigation sidebar with responsive design
 */


import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdAccountBalanceWallet,
  MdBarChart,
  MdPsychology,
  MdFileDownload,
  MdPerson,
  MdClose,
  MdSettings,
  MdLogout,
  MdKeyboardArrowDown,
} from 'react-icons/md';
import { useState, useEffect } from 'react';
import { getUserData, logout } from '../../utils/auth';
import { toast } from 'react-hot-toast';


const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ ADDED: Track route changes
  const [userData, setUserData] = useState(null); // ✅ CHANGED: Now using state
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);

  // ✅ ADDED: Reload user data when route changes
  useEffect(() => {
    const user = getUserData();
    console.log('📋 Sidebar - User Data from localStorage:', user);
    console.log('📋 Sidebar - Full Name:', user?.full_name);
    console.log('📋 Sidebar - Email:', user?.email);
    setUserData(user);
  }, [location]);

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

  // ✅ ADDED: Helper function to get display name with fallback
  const getDisplayName = () => {
    if (userData?.full_name && userData.full_name.trim()) {
      return userData.full_name;
    }
    if (userData?.email) {
      return userData.email.split('@')[0];
    }
    return 'User';
  };

  // ✅ ADDED: Helper function to get initial for avatar
  const getInitial = () => {
    if (userData?.full_name && userData.full_name.trim()) {
      return userData.full_name.charAt(0).toUpperCase();
    }
    if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const navigation = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: MdDashboard,
      color: 'text-blue-600',
      hoverBg: 'hover:bg-blue-50',
      activeBg: 'bg-blue-50',
      activeColor: 'text-blue-600',
      activeBorder: 'border-blue-600',
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: MdAccountBalanceWallet,
      color: 'text-purple-600',
      hoverBg: 'hover:bg-purple-50',
      activeBg: 'bg-purple-50',
      activeColor: 'text-purple-600',
      activeBorder: 'border-purple-600',
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: MdBarChart,
      color: 'text-green-600',
      hoverBg: 'hover:bg-green-50',
      activeBg: 'bg-green-50',
      activeColor: 'text-green-600',
      activeBorder: 'border-green-600',
      submenu: [
        { name: 'Overview', path: '/analytics' },
        { name: 'Category Breakdown', path: '/analytics/category' },
        { name: 'Payment Analysis', path: '/analytics/payment' },
        { name: 'Trends', path: '/analytics/trends' },
      ],
    },
    {
      name: 'AI Insights',
      path: '/ai-insights',
      icon: MdPsychology,
      color: 'text-pink-600',
      hoverBg: 'hover:bg-pink-50',
      activeBg: 'bg-pink-50',
      activeColor: 'text-pink-600',
      activeBorder: 'border-pink-600',
    },
    {
      name: 'Export',
      path: '/export',
      icon: MdFileDownload,
      color: 'text-orange-600',
      hoverBg: 'hover:bg-orange-50',
      activeBg: 'bg-orange-50',
      activeColor: 'text-orange-600',
      activeBorder: 'border-orange-600',
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: MdPerson,
      color: 'text-gray-600',
      hoverBg: 'hover:bg-gray-50',
      activeBg: 'bg-gray-50',
      activeColor: 'text-gray-600',
      activeBorder: 'border-gray-600',
    },
  ];


  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}


      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MdAccountBalanceWallet className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Expense</h1>
              <p className="text-xs text-gray-500">Tracker</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <MdClose className="text-2xl text-gray-600" />
          </button>
        </div>


        {/* User Info */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {getInitial()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {getDisplayName()}
              </p>
              <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
            </div>
          </Link>
        </div>


        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const hasSubmenu = item.submenu && item.submenu.length > 0;


            return (
              <div key={item.path}>
                {hasSubmenu ? (
                  <>
                    <button
                      onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="text-2xl" />
                        <span>{item.name}</span>
                      </div>
                      <MdKeyboardArrowDown
                        className={`text-xl transition-transform ${
                          analyticsExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {analyticsExpanded && (
                      <div className="ml-8 mt-2 space-y-1">
                        {item.submenu.map((subitem) => (
                          <NavLink
                            key={subitem.path}
                            to={subitem.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                              `block px-4 py-2 rounded-lg text-sm transition-all ${
                                isActive
                                  ? 'bg-green-50 text-green-600 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`
                            }
                          >
                            {subitem.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-l-4 ${
                        isActive
                          ? `${item.activeBg} ${item.activeColor} ${item.activeBorder} font-semibold`
                          : `border-transparent text-gray-600 ${item.hoverBg}`
                      }`
                    }
                  >
                    <Icon className="text-2xl" />
                    <span>{item.name}</span>
                  </NavLink>
                )}
              </div>
            );
          })}
        </nav>


        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 space-y-2">
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
          >
            <MdSettings className="text-2xl" />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => {
              onClose();
              handleLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <MdLogout className="text-2xl" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};


export default Sidebar;
