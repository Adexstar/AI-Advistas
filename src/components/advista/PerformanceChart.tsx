import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { date: 'May 12', spend: 2100, conversions: 140 },
  { date: 'May 13', spend: 2500, conversions: 160 },
  { date: 'May 14', spend: 2200, conversions: 155 },
  { date: 'May 15', spend: 2800, conversions: 200 },
  { date: 'May 16', spend: 2600, conversions: 180 },
  { date: 'May 17', spend: 2400, conversions: 170 },
  { date: 'May 18', spend: 2100, conversions: 145 },
];

const PerformanceChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState('Daily');

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Performance Overview</h2>
        <div className="flex gap-2">
          <select className="px-3 py-1 border border-gray-200 rounded text-sm hover:border-gray-300 focus:outline-none focus:border-purple-400">
            <option>Spend</option>
            <option>Conversions</option>
            <option>CTR</option>
          </select>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-1 border border-gray-200 rounded text-sm hover:border-gray-300 focus:outline-none focus:border-purple-400"
          >
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#9ca3af" />
          <YAxis yAxisId="left" stroke="#9ca3af" />
          <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="spend"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: '#8B5CF6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="conversions"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm border-t border-gray-200 pt-4">
        <div>
          <span className="text-gray-600">Spend: </span>
          <span className="font-semibold text-gray-900">$1,880.60</span>
        </div>
        <div>
          <span className="text-gray-600">Conversions: </span>
          <span className="font-semibold text-gray-900">186</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
