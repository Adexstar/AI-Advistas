import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  period: string;
  trend?: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, change, period, trend = 'up' }) => {
  const isPositive = trend === 'up';

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-600 text-sm font-medium">{label}</span>
        <div className="text-purple-600">{icon}</div>
      </div>
      <div className="mb-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp size={16} className="text-green-600" />
          ) : (
            <TrendingDown size={16} className="text-red-600" />
          )}
          <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </span>
        </div>
        <span className="text-gray-500 text-xs">{period}</span>
      </div>
    </div>
  );
};

export default MetricCard;
