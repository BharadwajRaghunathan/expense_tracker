/**
 * Footer Component
 * Reusable footer with copyright and links
 */

import { Link } from 'react-router-dom';
import {
  MdFavorite,
  MdPrivacyTip,
  MdGavel,
  MdHelp,
  MdEmail,
} from 'react-icons/md';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ET</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Expense Tracker</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Manage your personal finances with ease. Track expenses, analyze
              spending patterns, and get AI-powered insights to make better
              financial decisions.
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>Made with</span>
              <MdFavorite className="text-red-500" />
              <span>using React & Tailwind CSS</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/expenses"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2"
                >
                  Expenses
                </Link>
              </li>
              <li>
                <Link
                  to="/analytics"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2"
                >
                  Analytics
                </Link>
              </li>
              <li>
                <Link
                  to="/ai-insights"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2"
                >
                  AI Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <MdHelp className="text-base" />
                  Help Center
                </button>
              </li>
              <li>
                <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <MdEmail className="text-base" />
                  Contact Us
                </button>
              </li>
              <li>
                <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <MdPrivacyTip className="text-base" />
                  Privacy Policy
                </button>
              </li>
              <li>
                <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <MdGavel className="text-base" />
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              © {currentYear} Expense Tracker. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">Version 1.0.0</span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-gray-600">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
