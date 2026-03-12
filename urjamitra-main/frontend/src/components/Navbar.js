import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  const links = [
    { path: '/dashboard', label: '⚡ Dashboard' },
    { path: '/marketplace', label: '🏪 Marketplace' },
    { path: '/map', label: '🗺️ Map' },
    { path: '/transactions', label: '📊 Transactions' },
  ];

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-yellow-500">⚡</span>
        <span className="text-xl font-bold text-gray-800">Urjamitra</span>
        <span className="text-xs text-gray-500 ml-1">ऊर्जा मित्र</span>
      </div>
      <div className="flex gap-6">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-sm font-medium px-3 py-2 rounded-lg transition-all ${
              location.pathname === link.path
                ? 'bg-yellow-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {JSON.parse(localStorage.getItem('user'))?.name || 'User'}
        </span>
        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {JSON.parse(localStorage.getItem('user'))?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;