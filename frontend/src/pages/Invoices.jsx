import React, { useState } from 'react';
import { ArrowLeft, Plus, FileText } from 'lucide-react';

const Invoices = () => {
  const [invoices, setInvoices] = useState([
    { id: 1, customer: 'John Doe', amount: 1500, date: '2024-01-15', status: 'Paid' }
  ]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ 
    customer: '', mobile: '', paymentMethod: 'Cash', items: [] 
  });
  const [scannedProduct, setScannedProduct] = useState('');
  const [manualProduct, setManualProduct] = useState({ name: '', price: '', quantity: 1 });
  const [showScanner, setShowScanner] = useState(false);

  const calculateTotal = () => {
    return newInvoice.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const addManualItem = () => {
    if (manualProduct.name && manualProduct.price) {
      setNewInvoice({
        ...newInvoice,
        items: [...newInvoice.items, { ...manualProduct, id: Date.now() }]
      });
      setManualProduct({ name: '', price: '', quantity: 1 });
    }
  };

  const removeItem = (itemId) => {
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter(item => item.id !== itemId)
    });
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const { v4: uuidv4 } = require('uuid');
    const total = calculateTotal();
    const invoice = {
      uuid: uuidv4(),
      displayId: `INV${Date.now().toString().slice(-6)}`,
      customer: newInvoice.customer,
      mobile: newInvoice.mobile,
      paymentMethod: newInvoice.paymentMethod,
      items: newInvoice.items,
      amount: total,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    setInvoices([...invoices, invoice]);
    setNewInvoice({ customer: '', mobile: '', paymentMethod: 'Cash', items: [] });
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.history.back()} 
              className="p-2 hover:bg-gray-200 rounded-lg"
              title="Go back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            title="Create a new invoice for a customer"
          >
            <Plus size={20} />
            <span>Create Invoice</span>
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Create New Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={newInvoice.customer}
                  onChange={(e) => setNewInvoice({...newInvoice, customer: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={newInvoice.mobile}
                  onChange={(e) => setNewInvoice({...newInvoice, mobile: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={newInvoice.paymentMethod}
                  onChange={(e) => setNewInvoice({...newInvoice, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online Payment</option>
                  <option value="Card">Card Payment</option>
                </select>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Add Items</h3>
                
                <div className="flex space-x-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setShowScanner(!showScanner)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    title="Scan product QR code to add item"
                  >
                    {showScanner ? 'Hide Scanner' : 'Scan QR'}
                  </button>
                </div>

                {showScanner && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Scan QR code or enter product data"
                      value={scannedProduct}
                      onChange={(e) => setScannedProduct(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const productData = JSON.parse(scannedProduct);
                          setNewInvoice({
                            ...newInvoice,
                            items: [...newInvoice.items, { ...productData, quantity: 1 }]
                          });
                          setScannedProduct('');
                        } catch (e) {
                          alert('Invalid QR code format');
                        }
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      title="Add scanned product to invoice"
                    >
                      Add Scanned Item
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Item Name"
                    value={manualProduct.name}
                    onChange={(e) => setManualProduct({...manualProduct, name: e.target.value})}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={manualProduct.price}
                    onChange={(e) => setManualProduct({...manualProduct, price: e.target.value})}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={manualProduct.quantity}
                    onChange={(e) => setManualProduct({...manualProduct, quantity: parseInt(e.target.value)})}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={addManualItem}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    title="Add manual item to invoice"
                  >
                    Add
                  </button>
                </div>

                {newInvoice.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Items Added:</h4>
                    <div className="space-y-2">
                      {newInvoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span>{item.name} x {item.quantity}</span>
                          <div className="flex items-center space-x-2">
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                              title="Remove this item"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t font-bold">
                      Total: ₹{calculateTotal().toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  title="Generate and save this invoice"
                  disabled={newInvoice.items.length === 0}
                >
                  Create Invoice (₹{calculateTotal().toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  title="Cancel and close the form"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map(invoice => (
                <tr key={invoice.uuid || invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="text-blue-500 mr-2" size={16} />
                      {invoice.displayId || `INV-${invoice.id}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{invoice.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{invoice.mobile || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">₹{invoice.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      invoice.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {invoice.paymentMethod || 'Cash'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{invoice.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="View invoice details and download PDF"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;