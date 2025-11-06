import React, { useState, useEffect } from 'react';
import { Clock, Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { stockReservationService } from '../services/stock-reservation';
import toast from 'react-hot-toast';

const StockReservationManager = ({ productId, onReservationChange }) => {
  const [reservations, setReservations] = useState([]);
  const [availableStock, setAvailableStock] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showReserveForm, setShowReserveForm] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    quantity: 1,
    holdMinutes: 30,
    reference: ''
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [productId]);

  const loadData = async () => {
    try {
      const [reservationsData, stock] = await Promise.all([
        stockReservationService.getReservations({ productId }),
        stockReservationService.getAvailableStock(productId)
      ]);
      
      setReservations(reservationsData);
      setAvailableStock(stock);
    } catch (error) {
      console.error('Failed to load reservation data:', error);
    }
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await stockReservationService.reserveStock(
        productId,
        parseInt(reserveForm.quantity),
        parseInt(reserveForm.holdMinutes),
        reserveForm.reference || null
      );
      
      toast.success('Stock reserved successfully');
      setShowReserveForm(false);
      setReserveForm({ quantity: 1, holdMinutes: 30, reference: '' });
      loadData();
      onReservationChange?.();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to reserve stock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSale = async (reservationId, quantity) => {
    try {
      await stockReservationService.confirmSale(reservationId, quantity);
      toast.success('Sale confirmed successfully');
      loadData();
      onReservationChange?.();
    } catch (error) {
      toast.error('Failed to confirm sale');
    }
  };

  const handleRelease = async (reservationId) => {
    try {
      await stockReservationService.releaseReservation(reservationId);
      toast.success('Reservation released');
      loadData();
      onReservationChange?.();
    } catch (error) {
      toast.error('Failed to release reservation');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'fulfilled': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const isExpired = (expiresAt) => new Date(expiresAt) <= new Date();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Stock Reservations</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Available: <span className="font-medium text-green-600">{availableStock}</span>
          </span>
          <button
            onClick={() => setShowReserveForm(true)}
            disabled={availableStock === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Reserve Stock
          </button>
        </div>
      </div>

      {showReserveForm && (
        <form onSubmit={handleReserve} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={availableStock}
                value={reserveForm.quantity}
                onChange={(e) => setReserveForm(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hold Duration (minutes)
              </label>
              <select
                value={reserveForm.holdMinutes}
                onChange={(e) => setReserveForm(prev => ({ ...prev, holdMinutes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="1440">24 hours</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference (optional)
              </label>
              <input
                type="text"
                value={reserveForm.reference}
                onChange={(e) => setReserveForm(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Order ID, Quote ID, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Reserving...' : 'Reserve'}
            </button>
            <button
              type="button"
              onClick={() => setShowReserveForm(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className={`p-4 border rounded-lg ${
              isExpired(reservation.expiresAt) && reservation.status === 'active'
                ? 'border-orange-200 bg-orange-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(reservation.status)}
                <div>
                  <div className="font-medium">
                    {reservation.quantity} units - {reservation.status}
                  </div>
                  <div className="text-sm text-gray-500">
                    {reservation.reference && `Ref: ${reservation.reference} • `}
                    Expires: {new Date(reservation.expiresAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {reservation.status === 'active' && !isExpired(reservation.expiresAt) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConfirmSale(reservation.id, reservation.quantity)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Confirm Sale
                  </button>
                  <button
                    onClick={() => handleRelease(reservation.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Release
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {reservations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No reservations found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockReservationManager;