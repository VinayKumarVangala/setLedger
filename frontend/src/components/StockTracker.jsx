import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const StockTracker = ({ productId, onClose, onUpdate }) => {
  const [movements, setMovements] = useState([]);
  const [adjustment, setAdjustment] = useState({ quantity: '', reason: '' });
  const [restock, setRestock] = useState({ quantity: '', unitPrice: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchMovements();
    }
  }, [productId]);

  const fetchMovements = async () => {
    try {
      const response = await fetch(`/api/v1/stock/movements?productID=${productId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setMovements(data.data);
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustment.quantity || !adjustment.reason) {
      toast.error('Quantity and reason are required');
      return;
    }

    try {
      const response = await fetch(`/api/v1/stock/adjust/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(adjustment)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Stock adjusted successfully');
        setAdjustment({ quantity: '', reason: '' });
        fetchMovements();
        onUpdate?.(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to adjust stock');
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restock.quantity) {
      toast.error('Quantity is required');
      return;
    }

    try {
      const response = await fetch(`/api/v1/stock/add/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(restock)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Stock added successfully');
        setRestock({ quantity: '', unitPrice: '' });
        fetchMovements();
        onUpdate?.(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to add stock');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Stock Tracker</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Actions */}
          <div className="space-y-6">
            {/* Manual Adjustment */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Manual Adjustment</h3>
              <form onSubmit={handleAdjustment} className="space-y-3">
                <input
                  type="number"
                  placeholder="Quantity (+/-)"
                  value={adjustment.quantity}
                  onChange={(e) => setAdjustment(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Reason for adjustment"
                  value={adjustment.reason}
                  onChange={(e) => setAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
                >
                  Adjust Stock
                </button>
              </form>
            </div>

            {/* Restock */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Add Stock</h3>
              <form onSubmit={handleRestock} className="space-y-3">
                <input
                  type="number"
                  placeholder="Quantity to add"
                  value={restock.quantity}
                  onChange={(e) => setRestock(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Unit price (optional)"
                  value={restock.unitPrice}
                  onChange={(e) => setRestock(prev => ({ ...prev, unitPrice: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                >
                  Add Stock
                </button>
              </form>
            </div>
          </div>

          {/* Stock Movements */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Stock Movements</h3>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {movements.map((movement) => (
                  <div key={movement._id} className="border-b pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-sm font-medium ${
                          movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {movement.transactionType}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Balance: {movement.balanceAfter}
                      {movement.reason && ` • ${movement.reason}`}
                    </div>
                  </div>
                ))}
                {movements.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No stock movements found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTracker;