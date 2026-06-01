import React from 'react';
import Header from '../components/advista/Header';
import MetricCard from '../components/advista/MetricCard';
import PerformanceChart from '../components/advista/PerformanceChart';
import Sidebar from '../components/advista/Sidebar';
import { Activity, ShoppingCart, Users, TrendingUp, Zap } from 'lucide-react';

const AdvistaDashboard: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 ml-64">
          <Header title="Welcome back, John! 👋" subtitle="Here's what's happening with your campaigns today." />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <MetricCard icon={<Activity className="w-6 h-6" />} label="Total Spend" value="$12,540.50" change="+18.6%" period="vs last 7 days" />
            <MetricCard icon={<ShoppingCart className="w-6 h-6" />} label="Conversions" value="1,253" change="+24.8%" period="vs last 7 days" />
            <MetricCard icon={<Users className="w-6 h-6" />} label="Reach" value="356,789" change="+18.2%" period="vs last 7 days" />
            <MetricCard icon={<TrendingUp className="w-6 h-6" />} label="CTR" value="3.45%" change="+8.1%" period="vs last 7 days" />
            <MetricCard icon={<Zap className="w-6 h-6" />} label="ROAS" value="4.21x" change="+22.4%" period="vs last 7 days" />
          </div>

          <PerformanceChart />
        </div>
      </div>
    </div>
  );
};

export default AdvistaDashboard;
