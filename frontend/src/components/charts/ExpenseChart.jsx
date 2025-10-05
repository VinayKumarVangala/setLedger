import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingDown, PieChart as PieIcon } from 'lucide-react';

const ExpenseChart = ({ data = [], categoryData = [], loading = false }) => {
  const [viewType, setViewType] = useState('category');
  const [timeframe, setTimeframe] = useState('month');

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#8b5cf6'];

  const formatCurrency = (value) => `₹${(value / 1000).toFixed(1)}K`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  const renderCategoryChart = () => (
    <PieChart>
      <Pie
        data={categoryData}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        outerRadius={120}
        fill="#8884d8"
        dataKey="amount"
      >
        {categoryData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value) => formatCurrency(value)} />
    </PieChart>
  );

  const renderTrendChart = () => (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="date" stroke="#666" />
      <YAxis tickFormatter={formatCurrency} stroke="#666" />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="expenses" fill="#ef4444" opacity={0.8} />
      <Bar dataKey="forecastExpenses" fill="#dc2626" opacity={0.5} />
    </BarChart>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Expense Analysis</h3>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={viewType} 
            onChange={(e) => setViewType(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="category">By Category</option>
            <option value="trend">Trend Analysis</option>
          </select>
          
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          {viewType === 'category' ? renderCategoryChart() : renderTrendChart()}
        </ResponsiveContainer>
      )}

      {viewType === 'category' && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {categoryData.slice(0, 6).map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-600">{item.name}</span>
              <span className="text-sm font-medium ml-auto">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm border-t pt-4">
        <div className="text-center">
          <p className="text-gray-500">Total Expenses</p>
          <p className="font-semibold text-red-600">
            {formatCurrency(categoryData.reduce((sum, item) => sum + item.amount, 0))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Largest Category</p>
          <p className="font-semibold text-orange-600">
            {categoryData[0]?.name || 'N/A'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Monthly Change</p>
          <p className="font-semibold text-purple-600">-5.2%</p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseChart;