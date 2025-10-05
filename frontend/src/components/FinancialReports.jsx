import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import financialReportService from '../services/financialReportService';
import { 
  FileText, Download, Calendar, TrendingUp, TrendingDown, 
  DollarSign, BarChart3, PieChart, Loader2 
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const FinancialReports = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('profit-loss');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const reports = [
    { id: 'profit-loss', name: 'Profit & Loss', icon: TrendingUp },
    { id: 'balance-sheet', name: 'Balance Sheet', icon: BarChart3 },
    { id: 'cash-flow', name: 'Cash Flow', icon: DollarSign }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  useEffect(() => {
    generateReport();
  }, [activeReport, user?.orgId, user?.memberId]);

  const generateReport = async () => {
    if (!user?.orgId || !user?.memberId) return;

    try {
      setLoading(true);
      let response;

      if (activeReport === 'profit-loss') {
        response = await financialReportService.generateProfitLoss(
          user.orgId, user.memberId, dateRange.startDate, dateRange.endDate
        );
      } else if (activeReport === 'balance-sheet') {
        response = await financialReportService.generateBalanceSheet(
          user.orgId, user.memberId, dateRange.endDate
        );
      } else if (activeReport === 'cash-flow') {
        response = await financialReportService.generateCashFlow(
          user.orgId, user.memberId, dateRange.startDate, dateRange.endDate
        );
      }

      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    if (!reportData) return;

    try {
      const reportName = reports.find(r => r.id === activeReport)?.name;
      await financialReportService.exportReport(reportData, reportName, format);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const renderProfitLossChart = () => {
    if (!reportData) return null;

    const chartData = [
      { name: 'Revenue', value: reportData.revenue.total, color: COLORS[0] },
      { name: 'Expenses', value: reportData.expenses.total, color: COLORS[3] },
      { name: 'Net Profit', value: reportData.netProfit, color: COLORS[1] }
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold mb-4">Revenue vs Expenses</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold mb-4">Expense Breakdown</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={Object.entries(reportData.expenses.breakdown || {}).map(([name, value], index) => ({
                  name, value, fill: COLORS[index % COLORS.length]
                }))}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {Object.entries(reportData.expenses.breakdown || {}).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderBalanceSheetChart = () => {
    if (!reportData) return null;

    const chartData = [
      { category: 'Assets', current: reportData.assets.current, nonCurrent: reportData.assets.nonCurrent },
      { category: 'Liabilities', current: reportData.liabilities.current, nonCurrent: reportData.liabilities.nonCurrent }
    ];

    return (
      <div>
        <h4 className="text-lg font-semibold mb-4">Assets vs Liabilities</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="current" stackId="a" fill="#3B82F6" name="Current" />
            <Bar dataKey="nonCurrent" stackId="a" fill="#10B981" name="Non-Current" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderCashFlowChart = () => {
    if (!reportData) return null;

    const chartData = [
      { name: 'Operating', value: reportData.operating.net, color: COLORS[0] },
      { name: 'Investing', value: reportData.investing.net, color: COLORS[1] },
      { name: 'Financing', value: reportData.financing.net, color: COLORS[2] }
    ];

    return (
      <div>
        <h4 className="text-lg font-semibold mb-4">Cash Flow by Activity</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderReportData = () => {
    if (!reportData) return null;

    if (activeReport === 'profit-loss') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">Total Revenue</h4>
              <p className="text-2xl font-bold text-green-600">₹{reportData.revenue.total.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800">Total Expenses</h4>
              <p className="text-2xl font-bold text-red-600">₹{reportData.expenses.total.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Net Profit</h4>
              <p className="text-2xl font-bold text-blue-600">₹{reportData.netProfit.toLocaleString()}</p>
              <p className="text-sm text-blue-600">{reportData.margins.net.toFixed(1)}% margin</p>
            </div>
          </div>
          {renderProfitLossChart()}
        </div>
      );
    }

    if (activeReport === 'balance-sheet') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Total Assets</h4>
              <p className="text-2xl font-bold text-blue-600">₹{reportData.assets.total.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800">Total Liabilities</h4>
              <p className="text-2xl font-bold text-orange-600">₹{reportData.liabilities.total.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800">Total Equity</h4>
              <p className="text-2xl font-bold text-purple-600">₹{reportData.equity.total.toLocaleString()}</p>
            </div>
          </div>
          {renderBalanceSheetChart()}
        </div>
      );
    }

    if (activeReport === 'cash-flow') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">Net Cash Flow</h4>
              <p className="text-2xl font-bold text-green-600">₹{reportData.netCashFlow.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Closing Balance</h4>
              <p className="text-2xl font-bold text-blue-600">₹{reportData.closingBalance.toLocaleString()}</p>
            </div>
          </div>
          {renderCashFlowChart()}
        </div>
      );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">Generate comprehensive financial statements</p>
        </div>
        
        <div className="flex gap-3">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          />
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Generate
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeReport === report.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {report.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {reports.find(r => r.id === activeReport)?.name}
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={() => exportReport('pdf')}
              disabled={!reportData}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              disabled={!reportData}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Excel
            </button>
            <button
              onClick={() => exportReport('csv')}
              disabled={!reportData}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Generating report...</span>
          </div>
        ) : (
          renderReportData()
        )}
      </div>
    </div>
  );
};

export default FinancialReports;