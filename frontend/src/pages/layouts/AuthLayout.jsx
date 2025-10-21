/**
 * AuthLayout Component
 * Layout for authentication pages
 */

import { Outlet } from 'react-router-dom';
import { MdAccountBalanceWallet } from 'react-icons/md';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 relative">
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MdAccountBalanceWallet className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Expense Tracker</h1>
              <p className="text-xs text-gray-500">Manage your finances smartly</p>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center pt-20 pb-20">
        <Outlet />
      </main>

      <footer className="absolute bottom-0 left-0 right-0 py-6">
        <div className="text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Expense Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
