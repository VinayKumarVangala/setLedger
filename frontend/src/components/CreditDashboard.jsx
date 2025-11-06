import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard, AlertTriangle, Clock, TrendingUp, Bell } from 'lucide-react';
import ReminderLogTab from './ReminderLogTab';

const CreditDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCreditSummary();
  }, []);

  const fetchCreditSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/credit/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching credit summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRiskColor = (score) => {
    if (score < 30) return '#10b981'; // Green
    if (score < 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getRiskLevel = (score) => {
    if (score < 30) return 'Low Risk';
    if (score < 70) return 'Moderate Risk';
    return 'High Risk';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const pieData = [
    { name: 'Current', value: summary.totalReceivables.amount - summary.overdueAmounts.amount, color: '#3b82f6' },
    { name: 'Overdue', value: summary.overdueAmounts.amount, color: '#ef4444' }
  ];

  const barData = [
    { name: 'Total Receivables', amount: summary.totalReceivables.amount },
    { name: 'Overdue Amounts', amount: summary.overdueAmounts.amount },
    { name: 'Upcoming Payments', amount: summary.upcomingPayments.amount }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="h-4 w-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reminders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="h-4 w-4 inline mr-2" />
              Reminder Logs
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'reminders' ? (
        <ReminderLogTab />
      ) : (
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Receivables */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Receivables</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalReceivables.amount)}
              </p>
              <p className="text-xs text-gray-500">{summary.totalReceivables.count} invoices</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Overdue Amounts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Amounts</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.overdueAmounts.amount)}
              </p>
              <p className="text-xs text-gray-500">{summary.overdueAmounts.count} overdue</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Payments</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.upcomingPayments.amount)}
              </p>
              <p className="text-xs text-gray-500">{summary.upcomingPayments.count} due soon</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        {/* Average Risk Score */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Risk Score</p>
              <p className="text-2xl font-bold" style={{ color: getRiskColor(summary.averageRiskScore) }}>
                {summary.averageRiskScore}
              </p>
              <p className="text-xs text-gray-500">{getRiskLevel(summary.averageRiskScore)}</p>
            </div>
            <TrendingUp className="h-8 w-8" style={{ color: getRiskColor(summary.averageRiskScore) }} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receivables Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Receivables Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Credit Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{summary.totalCustomers}</p>
            <p className="text-sm text-gray-600">Total Customers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round((summary.totalReceivables.amount - summary.overdueAmounts.amount) / summary.totalReceivables.amount * 100) || 0}%
            </p>
            <p className="text-sm text-gray-600">Collection Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {Math.round(summary.overdueAmounts.amount / summary.totalReceivables.amount * 100) || 0}%
            </p>
            <p className="text-sm text-gray-600">Overdue Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalReceivables.amount / summary.totalReceivables.count || 0)}
            </p>
            <p className="text-sm text-gray-600">Avg Invoice Value</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default CreditDashboard;