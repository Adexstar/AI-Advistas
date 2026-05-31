import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  Zap,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/advista' },
    { icon: Megaphone, label: 'Campaigns', path: '/advista/campaigns' },
    { icon: Zap, label: 'Ads', path: '/advista/ads' },
    { icon: BarChart3, label: 'Analytics', path: '/advista/analytics' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AV</span>
          </div>
          <span className="font-bold text-xl text-gray-900">AdVista</span>
        </div>
      </div>

      <div className="p-6 border-b border-gray-200">
        <button className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg">
          <Plus size={20} />
          Create Ad
        </button>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
              isActive(item.path)
                ? 'bg-purple-50 text-purple-600 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-gray-200 space-y-2">
        <Link to="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200">
          <Settings size={18} />
          <span>Settings</span>
        </Link>
        <Link to="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200">
          <HelpCircle size={18} />
          <span>Help & Support</span>
        </Link>
      </div>

      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">JD</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">John Doe</p>
            <p className="text-xs text-gray-500 truncate">Pro Plan</p>
          </div>
        </div>
        <button className="flex items-center justify-center w-full gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 py-2 px-3 rounded-lg transition duration-200 text-sm">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
