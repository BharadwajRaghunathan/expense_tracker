/**
 * Breadcrumb Component
 * Navigation breadcrumb showing current page hierarchy
 */

import { Link, useLocation } from 'react-router-dom';
import { MdChevronRight, MdHome } from 'react-icons/md';

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Mapping of URL segments to display names
  const breadcrumbNameMap = {
    dashboard: 'Dashboard',
    expenses: 'Expenses',
    add: 'Add Expense',
    edit: 'Edit Expense',
    analytics: 'Analytics',
    category: 'Category Breakdown',
    payment: 'Payment Analysis',
    trends: 'Trend Analysis',
    'ai-insights': 'AI Insights',
    export: 'Export Reports',
    profile: 'Profile',
    settings: 'Account Settings',
  };

  // Don't show breadcrumb on home/dashboard or auth pages
  if (pathnames.length === 0 || pathnames[0] === 'login' || pathnames[0] === 'register') {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 px-6 py-4 bg-white border-b border-gray-200">
      {/* Home Link */}
      <Link
        to="/dashboard"
        className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors group"
        aria-label="Home"
      >
        <MdHome className="text-lg group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium hidden sm:inline">Home</span>
      </Link>

      {/* Breadcrumb Items */}
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = breadcrumbNameMap[name] || name.charAt(0).toUpperCase() + name.slice(1);

        // Skip numeric IDs in breadcrumb display
        const isNumeric = !isNaN(name);

        if (isNumeric) {
          return null;
        }

        return (
          <div key={name} className="flex items-center gap-2">
            <MdChevronRight className="text-gray-400 text-lg" />
            {isLast ? (
              <span className="text-sm font-semibold text-gray-900">
                {displayName}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
              >
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
