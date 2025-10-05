import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const LowStockAlert = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    checkLowStock();
    
    // Register for FCM notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      registerForNotifications();
    }
    
    // Check every 30 minutes
    const interval = setInterval(checkLowStock, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkLowStock = async () => {
    try {
      const response = await fetch('/api/v1/stock/low-stock', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setLowStockProducts(data.data);
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  };

  const registerForNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
      });

      // Send FCM token to backend
      const response = await fetch('/api/v1/stock/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ token: subscription.endpoint })
      });

      if (response.ok) {
        console.log('FCM token registered successfully');
      }
    } catch (error) {
      console.error('Failed to register for notifications:', error);
    }
  };

  const dismissAlert = () => {
    setShowAlert(false);
  };

  const dismissProduct = (productID) => {
    setLowStockProducts(prev => prev.filter(p => p.productID !== productID));
    if (lowStockProducts.length === 1) {
      setShowAlert(false);
    }
  };

  if (!showAlert || lowStockProducts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-start">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Low Stock Alert
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-2">{lowStockProducts.length} products are running low:</p>
                <ul className="space-y-1">
                  {lowStockProducts.slice(0, 3).map((product) => (
                    <li key={product.productID} className="flex justify-between items-center">
                      <span>
                        {product.name} ({product.sku})
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-yellow-200 px-2 py-1 rounded">
                          {product.inventory.currentStock} left
                        </span>
                        <button
                          onClick={() => dismissProduct(product.productID)}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <li className="text-xs text-yellow-600">
                      +{lowStockProducts.length - 3} more products
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <button
            onClick={dismissAlert}
            className="text-yellow-400 hover:text-yellow-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowStockAlert;