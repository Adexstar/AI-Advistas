import React from 'react';
import { Calendar, Bell, Menu, ChevronDown } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-sm">
          <Calendar size={18} />
          <span>May 12 - May 18, 2025</span>
          <ChevronDown size={16} />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition duration-200 relative">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition duration-200">
          <Menu size={20} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default Header;
