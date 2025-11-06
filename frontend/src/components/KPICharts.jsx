import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3, Calendar, RefreshCw } from 'lucide-react';

const KPICharts = () => {
  const [kpiData, setKpiData] = useState([]);
  const [timeframe, setTimeframe] = useState('monthly');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [drillDown, setDrillDown] = useState(null);

  useEffect(() => {
    fetchKPIData();
  }, [timeframe]);

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/financial/kpis?timeframe=${timeframe}&limit=12`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setKpiData(data.data);
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshViews = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch('/api/v1/financial/refresh-views', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchKPIData();
    } catch (error) {
      console.error('Error refreshing views:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatPeriod = (dateStr) => {
    const date = new Date(dateStr);
    return timeframe === 'quarterly' 
      ? `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`
      : date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const handleBarClick = (data) => {
    setDrillDown({
      period: data.period,
      data: data
    });
  };

  const chartData = kpiData.map(item => ({
    ...item,
    period: formatPeriod(item.period),
    profitMargin: item.revenue > 0 ? ((item.netProfit / item.revenue) * 100).toFixed(1) : 0
  }));

  const taxBreakdown = drillDown ? [
    { name: 'CGST', value: drillDown.data.cgst, color: '#8884d8' },
    { name: 'SGST', value: drillDown.data.sgst, color: '#82ca9d' },
    { name: 'IGST', value: drillDown.data.igst, color: '#ffc658' }
  ].filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="revenue">Revenue</option>
                <option value="netProfit">Net Profit</option>
                <option value="expenses">Expenses</option>
                <option value="taxCollected">Tax Collected</option>
              </select>
            </div>
          </div>
          <button
            onClick={refreshViews}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 capitalize">{selectedMetric} Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), selectedMetric]}
                labelStyle={{ color: '#374151' }}
              />
              <Bar 
                dataKey={selectedMetric} 
                fill={selectedMetric === 'netProfit' ? '#10b981' : '#3b82f6'}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Margin Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Profit Margin %</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Profit Margin']}
                labelStyle={{ color: '#374151' }}
              />
              <Line 
                type="monotone" 
                dataKey="profitMargin" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drill-down Modal */}
      {drillDown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Details for {formatPeriod(drillDown.period)}
              </h3>
              <button
                onClick={() => setDrillDown(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Metrics */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-medium">{formatCurrency(drillDown.data.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expenses:</span>
                  <span className="font-medium">{formatCurrency(drillDown.data.expenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Profit:</span>
                  <span className={`font-medium ${drillDown.data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(drillDown.data.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoices:</span>
                  <span className="font-medium">{drillDown.data.invoiceCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-medium">{drillDown.data.paidCount}</span>
                </div>
              </div>

              {/* Tax Breakdown Chart */}
              {taxBreakdown.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tax Breakdown</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={taxBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      >
                        {taxBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPICharts;