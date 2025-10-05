import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Line
} from 'recharts';
import { TrendingUp, Calendar, Filter } from 'lucide-react';

const RevenueChart = ({ data = [], forecastData = [], loading = false }) => {
  const [chartType, setChartType] = useState('area');
  const [period, setPeriod] = useState('daily');

  const formatCurrency = (value) => `₹${(value / 1000).toFixed(1)}K`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
            {entry.payload?.isForecast && <span className="text-xs ml-1">(AI Forecast)</span>}
          </p>
        ))}
      </div>
    );
  };

  const combinedData = [...data, ...forecastData.map(item => ({ ...item, isForecast: true }))];

  const renderChart = () => {
    if (chartType === 'area') {
      return (
        <AreaChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#666" />
          <YAxis tickFormatter={formatCurrency} stroke="#666" />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="forecastRevenue"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.1}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </AreaChart>
      );
    }

    return (
      <ComposedChart data={combinedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" stroke="#666" />
        <YAxis tickFormatter={formatCurrency} stroke="#666" />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="revenue" fill="#10b981" opacity={0.8} />
        <Line
          type="monotone"
          dataKey="forecastRevenue"
          stroke="#059669"
          strokeWidth={3}
          strokeDasharray="5 5"
          dot={false}
        />
      </ComposedChart>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Revenue Analysis</h3>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          
          <select 
            value={chartType} 
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          {renderChart()}
        </ResponsiveContainer>
      )}

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="text-gray-500">Current Revenue</p>
          <p className="font-semibold text-green-600">
            {formatCurrency(data[data.length - 1]?.revenue || 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Forecast (Next Period)</p>
          <p className="font-semibold text-blue-600">
            {formatCurrency(forecastData[0]?.forecastRevenue || 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Growth Rate</p>
          <p className="font-semibold text-purple-600">+12.5%</p>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;