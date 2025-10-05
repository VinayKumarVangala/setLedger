import React from 'react';
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react';

const Reports = () => {
  const reportData = {
    revenue: 125000,
    expenses: 85000,
    profit: 40000,
    products: 25,
    sales: [
      { month: 'Jan', amount: 15000 },
      { month: 'Feb', amount: 18000 },
      { month: 'Mar', amount: 22000 },
      { month: 'Apr', amount: 25000 },
      { month: 'May', amount: 28000 },
      { month: 'Jun', amount: 17000 }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <button 
            onClick={() => window.history.back()} 
            className="p-2 hover:bg-gray-200 rounded-lg"
            title="Go back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{reportData.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">₹{reportData.expenses.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-gray-900">₹{reportData.profit.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.products}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
          <h2 className="text-xl font-semibold mb-4">Monthly Sales</h2>
          <div className="h-64 flex items-end space-x-4">
            {reportData.sales.map((sale, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-blue-500 w-full rounded-t"
                  style={{ height: `${(sale.amount / 30000) * 200}px` }}
                ></div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{sale.month}</p>
                  <p className="text-xs text-gray-600">₹{sale.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Export Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
              title="Download detailed sales report with transaction history"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium">Sales Report</div>
                <div className="text-sm text-gray-600">Export as PDF/Excel</div>
              </div>
            </button>
            <button 
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
              title="Generate profit & loss statement for financial analysis"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📈</div>
                <div className="font-medium">Financial Report</div>
                <div className="text-sm text-gray-600">P&L Statement</div>
              </div>
            </button>
            <button 
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
              title="View inventory levels and stock movement analysis"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📋</div>
                <div className="font-medium">Inventory Report</div>
                <div className="text-sm text-gray-600">Stock Analysis</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;