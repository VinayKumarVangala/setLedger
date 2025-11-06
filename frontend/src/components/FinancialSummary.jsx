import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Calculator, Calendar } from 'lucide-react';

const FinancialSummary = () => {
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('current_month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [period]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/financial/summary?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatPeriod = (period) => {
    const periods = {
      'current_month': 'This Month',
      'last_month': 'Last Month',
      'current_year': 'This Year'
    };
    return periods[period] || period;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const isProfit = summary.netProfit >= 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Financial Summary</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="current_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="current_year">This Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Net Profit */}
        <div className={`p-4 rounded-lg ${isProfit ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netProfit)}
              </p>
            </div>
            {isProfit ? (
              <TrendingUp className="h-8 w-8 text-green-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-600" />
            )}
          </div>
        </div>

        {/* Revenue */}
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.revenue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Expenses */}
        <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.expenses)}
              </p>
            </div>
            <Receipt className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        {/* Total Tax */}
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tax</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(summary.taxSummary.totalTax)}
              </p>
            </div>
            <Calculator className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tax Breakdown */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Tax Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">CGST:</span>
            <span className="ml-2 font-medium">{formatCurrency(summary.taxSummary.cgst)}</span>
          </div>
          <div>
            <span className="text-gray-600">SGST:</span>
            <span className="ml-2 font-medium">{formatCurrency(summary.taxSummary.sgst)}</span>
          </div>
          <div>
            <span className="text-gray-600">IGST:</span>
            <span className="ml-2 font-medium">{formatCurrency(summary.taxSummary.igst)}</span>
          </div>
          <div>
            <span className="text-gray-600">Cess:</span>
            <span className="ml-2 font-medium">{formatCurrency(summary.taxSummary.cess)}</span>
          </div>
        </div>
      </div>

      {/* Period Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Data for {formatPeriod(period)} • 
        {summary.dateRange && (
          <span className="ml-1">
            {new Date(summary.dateRange.startDate).toLocaleDateString()} - {new Date(summary.dateRange.endDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default FinancialSummary;