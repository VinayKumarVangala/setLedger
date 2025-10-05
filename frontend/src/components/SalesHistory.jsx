import React, { useState, useEffect } from 'react';
import { indexedDBService } from '../services/indexedDB';

const SalesHistory = ({ isOpen, onClose }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSales();
    }
  }, [isOpen]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const salesData = await indexedDBService.getSales();
      setSales(salesData);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sales History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-96">
            {sales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sales recorded
              </div>
            ) : (
              <div className="space-y-4">
                {sales.map((sale) => (
                  <div key={sale.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">Sale #{sale.saleID}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(sale.timestamp).toLocaleString()}
                        </p>
                        {sale.customer && (
                          <p className="text-sm text-gray-600">
                            Customer: {sale.customer.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{sale.total.toFixed(2)}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          sale.synced ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sale.synced ? 'Synced' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <p className="font-medium mb-1">Items:</p>
                      <ul className="space-y-1">
                        {sale.items.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>{item.name} x {item.quantity}</span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesHistory;