import React, { useState } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import { TrendingUp, Target, AlertTriangle } from 'lucide-react';

const ProfitChart = ({ data = [], forecastData = [], targets = [], loading = false }) => {
  const [showMargins, setShowMargins] = useState(true);
  const [period, setPeriod] = useState('monthly');

  const formatCurrency = (value) => `₹${(value / 1000).toFixed(1)}K`;
  const formatPercent = (value) => `${value.toFixed(1)}%`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {
              entry.dataKey === 'profitMargin' 
                ? formatPercent(entry.value)
                : formatCurrency(entry.value)
            }
            {entry.payload?.isForecast && <span className="text-xs ml-1">(Forecast)</span>}
          </p>
        ))}
      </div>
    );
  };

  const combinedData = [...data, ...forecastData.map(item => ({ ...item, isForecast: true }))];
  const currentProfit = data[data.length - 1]?.profit || 0;
  const forecastProfit = forecastData[0]?.profit || 0;
  const profitChange = ((forecastProfit - currentProfit) / currentProfit * 100).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Profit Analysis</h3>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowMargins(!showMargins)}
            className={`px-3 py-1 rounded-md text-sm ${showMargins ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
          >
            Show Margins
          </button>
          
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#666" />
            <YAxis yAxisId="left" tickFormatter={formatCurrency} stroke="#666" />
            {showMargins && (
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tickFormatter={formatPercent} 
                stroke="#666" 
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            
            <Bar 
              yAxisId="left"
              dataKey="profit" 
              fill="#3b82f6" 
              opacity={0.8}
              name="Profit"
            />
            
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="forecastProfit"
              stroke="#1d4ed8"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
              name="Forecast Profit"
            />
            
            {showMargins && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="profitMargin"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                name="Profit Margin %"
              />
            )}
            
            {targets.map((target, index) => (
              <ReferenceLine 
                key={index}
                yAxisId="left"
                y={target.value} 
                stroke="#ef4444" 
                strokeDasharray="3 3"
                label={{ value: `Target: ${formatCurrency(target.value)}`, position: 'topRight' }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <p className="text-gray-500">Current Profit</p>
          <p className="font-semibold text-blue-600">
            {formatCurrency(currentProfit)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Forecast Change</p>
          <p className={`font-semibold ${profitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitChange >= 0 ? '+' : ''}{profitChange}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Profit Margin</p>
          <p className="font-semibold text-purple-600">
            {formatPercent(data[data.length - 1]?.profitMargin || 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Target Status</p>
          <div className="flex items-center justify-center gap-1">
            {currentProfit >= (targets[0]?.value || 0) ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            )}
            <span className={`font-semibold ${currentProfit >= (targets[0]?.value || 0) ? 'text-green-600' : 'text-orange-600'}`}>
              {currentProfit >= (targets[0]?.value || 0) ? 'On Track' : 'Below Target'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitChart;