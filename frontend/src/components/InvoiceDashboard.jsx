import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const InvoiceDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState('pdf');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/data');
      setDashboardData(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/export/invoices/${exportFormat}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extensions = { pdf: 'pdf', excel: 'xlsx', csv: 'csv' };
      link.download = `invoices-report.${extensions[exportFormat]}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${exportFormat.toUpperCase()} exported successfully`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'bank': return '🏦';
      default: return '💰';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Dashboard</h1>
          <p className="text-gray-600">Overview of your invoice management</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData?.summary?.totalInvoices || 0}
              </div>
              <div className="text-sm text-gray-600">Total Invoices</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ₹{dashboardData?.summary?.totalAmount?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData?.summary?.overdueCount || 0}
              </div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {dashboardData?.paymentStats?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Payment Methods</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Recent Invoices</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData?.recentInvoices?.map((invoice) => (
                <div key={invoice.displayId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium">{invoice.displayId}</div>
                      <div className="text-sm text-gray-600">
                        {invoice.customerName || 'Walk-in Customer'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">₹{invoice.total}</div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                      <span className="text-xs">
                        {getPaymentMethodIcon(invoice.paymentMethod)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold">Overdue Invoices</h2>
            </div>
          </div>
          <div className="p-6">
            {dashboardData?.overdueInvoices?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.overdueInvoices.map((invoice) => (
                  <div key={invoice.displayId} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{invoice.displayId}</div>
                      <div className="text-sm text-gray-600">
                        {invoice.customerName || 'Walk-in Customer'}
                      </div>
                      <div className="text-xs text-red-600">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-red-600">₹{invoice.total}</div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No overdue invoices</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {dashboardData?.paymentStats?.length > 0 && (
        <div className="mt-6 bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Payment Methods (This Month)</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {dashboardData.paymentStats.map((stat) => (
                <div key={stat.paymentMethod} className="text-center">
                  <div className="text-2xl mb-2">
                    {getPaymentMethodIcon(stat.paymentMethod)}
                  </div>
                  <div className="font-medium capitalize">{stat.paymentMethod}</div>
                  <div className="text-sm text-gray-600">
                    {stat._count.paymentMethod} invoices
                  </div>
                  <div className="text-sm font-medium">
                    ₹{stat._sum.total?.toFixed(2) || '0.00'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDashboard;