import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Brush
} from 'recharts';
import { Calendar, TrendingUp, Filter, Download } from 'lucide-react';

const FinancialChart = ({ data = [], forecastData = [], loading = false }) => {
  const [dateRange, setDateRange] = useState('30d');
  const [showForecast, setShowForecast] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'expenses', 'profit']);

  const formatCurrency = (value) => `₹${(value / 1000).toFixed(1)}K`;
  
  const formatTooltip = (value, name) => [formatCurrency(value), name.charAt(0).toUpperCase() + name.slice(1)];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
            {entry.payload?.isForecast && <span className="text-xs ml-1">(Forecast)</span>}
          </p>
        ))}
      </div>
    );
  };

  const combinedData = [...data, ...forecastData.map(item => ({ ...item, isForecast: true }))];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Financial Trends</h3>
        
        <div className="flex gap-3">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="1y">1 Year</option>
          </select>
          
          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`px-3 py-1 rounded-md text-sm ${showForecast ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
          >
            AI Forecast
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {['revenue', 'expenses', 'profit'].map(metric => (
          <button
            key={metric}
            onClick={() => {
              setSelectedMetrics(prev => 
                prev.includes(metric) 
                  ? prev.filter(m => m !== metric)
                  : [...prev, metric]
              );
            }}
            className={`px-3 py-1 rounded-md text-sm capitalize ${
              selectedMetrics.includes(metric) 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100'
            }`}
          >
            {metric}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#666" />
            <YAxis tickFormatter={formatCurrency} stroke="#666" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {selectedMetrics.includes('revenue') && (
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                strokeDasharray={showForecast ? "0" : "0"}
              />
            )}
            
            {selectedMetrics.includes('expenses') && (
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
            )}
            
            {selectedMetrics.includes('profit') && (
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            )}

            {showForecast && forecastData.length > 0 && (
              <ReferenceLine 
                x={data[data.length - 1]?.date} 
                stroke="#666" 
                strokeDasharray="2 2" 
              />
            )}
            
            <Brush dataKey="date" height={30} stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default FinancialChart;