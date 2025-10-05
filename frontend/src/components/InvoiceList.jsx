import React, { useState } from 'react';
import { toast } from 'react-toastify';

const InvoiceList = ({ invoices, onEdit, onViewPDF, onUpdatePayment, loading }) => {
  const [filter, setFilter] = useState({ status: '', customer: '' });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handlePaymentUpdate = async (invoiceId, status) => {
    try {
      await onUpdatePayment(invoiceId, { status });
      toast.success('Payment status updated');
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = !filter.status || invoice.status === filter.status;
    const matchesCustomer = !filter.customer || 
      invoice.customer.name.toLowerCase().includes(filter.customer.toLowerCase());
    return matchesStatus && matchesCustomer;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="border rounded px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="text"
            placeholder="Search customer..."
            value={filter.customer}
            onChange={(e) => setFilter(prev => ({ ...prev, customer: e.target.value }))}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Invoice List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Invoice #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.invoiceID} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{invoice.customer.name}</div>
                  {invoice.customer.email && (
                    <div className="text-sm text-gray-500">{invoice.customer.email}</div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Due: {new Date(invoice.payment.dueDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ₹{invoice.totals.grandTotal.toFixed(2)}
                  </div>
                  {invoice.payment.paidAmount > 0 && (
                    <div className="text-sm text-gray-500">
                      Paid: ₹{invoice.payment.paidAmount.toFixed(2)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <select
                    value={invoice.payment.status}
                    onChange={(e) => handlePaymentUpdate(invoice.invoiceID, e.target.value)}
                    className={`text-xs rounded px-2 py-1 border-0 ${getPaymentStatusColor(invoice.payment.status)}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(invoice)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onViewPDF(invoice.invoiceID)}
                      className="text-green-600 hover:text-green-900"
                    >
                      PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No invoices found</div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;