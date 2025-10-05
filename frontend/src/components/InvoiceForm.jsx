import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const InvoiceForm = ({ onSubmit, onCancel, products = [] }) => {
  const [formData, setFormData] = useState({
    customer: {
      name: '',
      email: '',
      phone: '',
      address: '',
      gstin: ''
    },
    items: [{ productID: '', productName: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 }],
    payment: {
      method: 'cash',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      terms: 'Net 30'
    },
    notes: ''
  });

  const [totals, setTotals] = useState({
    subtotal: 0,
    totalTax: 0,
    totalDiscount: 0,
    grandTotal: 0
  });

  // Auto-calculate totals when items change
  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    formData.items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const discountAmount = (itemTotal * item.discount) / 100;
      const taxableAmount = itemTotal - discountAmount;
      const taxAmount = (taxableAmount * item.taxRate) / 100;

      subtotal += itemTotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    setTotals({
      subtotal,
      totalTax,
      totalDiscount,
      grandTotal: subtotal - totalDiscount + totalTax
    });
  };

  const handleCustomerChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      customer: { ...prev.customer, [field]: value }
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill product details when product is selected
    if (field === 'productID' && value) {
      const product = products.find(p => p.productID === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productName: product.name,
          unitPrice: product.pricing.sellingPrice,
          taxRate: product.tax.gstRate
        };
      }
    }

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productID: '', productName: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.customer.name) {
      toast.error('Customer name is required');
      return;
    }

    if (formData.items.some(item => !item.productName || item.quantity <= 0)) {
      toast.error('All items must have valid product and quantity');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create Invoice</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Customer Name *"
              value={formData.customer.name}
              onChange={(e) => handleCustomerChange('name', e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.customer.email}
              onChange={(e) => handleCustomerChange('email', e.target.value)}
              className="border rounded px-3 py-2"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.customer.phone}
              onChange={(e) => handleCustomerChange('phone', e.target.value)}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="GSTIN"
              value={formData.customer.gstin}
              onChange={(e) => handleCustomerChange('gstin', e.target.value)}
              className="border rounded px-3 py-2"
            />
            <textarea
              placeholder="Address"
              value={formData.customer.address}
              onChange={(e) => handleCustomerChange('address', e.target.value)}
              className="border rounded px-3 py-2 md:col-span-2"
              rows="2"
            />
          </div>
        </div>

        {/* Items */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Item
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Qty</th>
                  <th className="text-left p-2">Rate</th>
                  <th className="text-left p-2">Discount%</th>
                  <th className="text-left p-2">Tax%</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => {
                  const itemTotal = item.quantity * item.unitPrice;
                  const discountAmount = (itemTotal * item.discount) / 100;
                  const taxableAmount = itemTotal - discountAmount;
                  const taxAmount = (taxableAmount * item.taxRate) / 100;
                  const totalAmount = taxableAmount + taxAmount;

                  return (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        <select
                          value={item.productID}
                          onChange={(e) => handleItemChange(index, 'productID', e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.productID} value={product.productID}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                        {!item.productID && (
                          <input
                            type="text"
                            placeholder="Product Name"
                            value={item.productName}
                            onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                            className="border rounded px-2 py-1 w-full mt-1"
                          />
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="border rounded px-2 py-1 w-20"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="border rounded px-2 py-1 w-24"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="border rounded px-2 py-1 w-20"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="border rounded px-2 py-1 w-20"
                        />
                      </td>
                      <td className="p-2 font-semibold">
                        ₹{totalAmount.toFixed(2)}
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={formData.items.length === 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Totals</h3>
          <div className="space-y-2 max-w-sm ml-auto">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>₹{totals.totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>₹{totals.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Grand Total:</span>
              <span>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Payment Terms</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={formData.payment.method}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                payment: { ...prev.payment, method: e.target.value }
              }))}
              className="border rounded px-3 py-2"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
              <option value="credit">Credit</option>
            </select>
            <input
              type="date"
              value={formData.payment.dueDate}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                payment: { ...prev.payment, dueDate: e.target.value }
              }))}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Payment Terms"
              value={formData.payment.terms}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                payment: { ...prev.payment, terms: e.target.value }
              }))}
              className="border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Notes</h3>
          <textarea
            placeholder="Additional notes..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="border rounded px-3 py-2 w-full"
            rows="3"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;