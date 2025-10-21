/**
 * MainLayout Component
 * Main authenticated layout with sidebar navigation and header
 */

import { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  MdDashboard,
  MdAccountBalanceWallet,
  MdBarChart,
  MdPsychology,
  MdFileDownload,
  MdPerson,
  MdMenu,
  MdClose,
  MdLogout,
  MdNotifications,
  MdSettings,
} from 'react-icons/md';
import { getUserData, logout } from '../../utils/auth'; // ✅ FIXED: Two levels up

const MainLayout = () => {
  const navigate = useNavigate();
  const userData = getUserData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const navigation = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: MdDashboard,
      activeColor: 'bg-blue-50 text-blue-600 border-blue-600',
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: MdAccountBalanceWallet,
      activeColor: 'bg-purple-50 text-purple-600 border-purple-600',
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: MdBarChart,
      activeColor: 'bg-green-50 text-green-600 border-green-600',
    },
    {
      name: 'AI Insights',
      path: '/ai-insights',
      icon: MdPsychology,
      activeColor: 'bg-pink-50 text-pink-600 border-pink-600',
    },
    {
      name: 'Export',
      path: '/export',
      icon: MdFileDownload,
      activeColor: 'bg-orange-50 text-orange-600 border-orange-600',
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: MdPerson,
      activeColor: 'bg-gray-50 text-gray-600 border-gray-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <MdAccountBalanceWallet className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Expense</h1>
              <p className="text-xs text-gray-500">Tracker</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MdClose className="text-2xl text-gray-600" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {userData?.fullname?.charAt(0) || userData?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userData?.fullname || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-l-4 ${
                    isActive
                      ? item.activeColor + ' font-semibold'
                      : 'border-transparent text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <Icon className="text-2xl" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all mb-2"
          >
            <MdSettings className="text-2xl" />
            <span>Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <MdLogout className="text-2xl" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:ml-72">
        <header className="h-20 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MdMenu className="text-2xl text-gray-600" />
            </button>

            <Link to="/dashboard" className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MdAccountBalanceWallet className="text-lg text-white" />
              </div>
              <span className="font-bold text-gray-900">Expense Tracker</span>
            </Link>

            <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-gray-900">
                Welcome back, {userData?.fullname || 'User'}!
              </h2>
              <p className="text-sm text-gray-500">Manage your expenses efficiently</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <MdNotifications className="text-2xl text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {userData?.fullname?.charAt(0) || userData?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">Profile</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)]">
          <Outlet />
        </main>

        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="px-6 text-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} Expense Tracker. Built with React & Tailwind CSS.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
