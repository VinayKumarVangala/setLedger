import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, QrCode, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import QRScanner from './QRScanner';

const POSCart = ({ onCheckout }) => {
  const { items, totals, customer, updateQuantity, removeItem, clearCart, setCustomer, scanQRCode } = useCart();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', mobile: '' });

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleQRScan = (qrData) => {
    scanQRCode(qrData);
    setShowQRScanner(false);
  };

  const handleCustomerSave = () => {
    setCustomer(customerForm);
    setShowCustomerForm(false);
    setCustomerForm({ name: '', mobile: '' });
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    
    const invoiceData = {
      customerName: customer?.name || 'Walk-in Customer',
      customerMobile: customer?.mobile,
      lines: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }))
    };
    
    onCheckout(invoiceData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Cart ({totals.itemCount})</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQRScanner(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Scan QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowCustomerForm(true)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Add Customer"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer Info */}
      {customer && (
        <div className="p-3 bg-green-50 border-b">
          <div className="text-sm">
            <div className="font-medium">{customer.name}</div>
            {customer.mobile && (
              <div className="text-gray-600">{customer.mobile}</div>
            )}
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Cart is empty</p>
            <p className="text-sm">Scan QR or add items manually</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-gray-600">
                    ₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                  {item.gstRate > 0 && !item.exemptFromGST && (
                    <div className="text-xs text-blue-600">
                      GST {item.gstRate}% {item.isGSTInclusive ? '(incl.)' : '(excl.)'}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  
                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded hover:bg-green-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-600 rounded hover:bg-gray-200 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.totalTax > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₹{totals.totalTax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>₹{totals.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={clearCart}
              className="flex-1 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              Clear
            </button>
            <button
              onClick={handleCheckout}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Add Customer</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter customer name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={customerForm.mobile}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter mobile number"
                />
              </div>
            </div>
            
            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => setShowCustomerForm(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomerSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSCart;