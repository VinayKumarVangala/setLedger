import React, { useState, useEffect } from 'react';
import { CartProvider } from '../contexts/CartContext';
import ProductGrid from './ProductGrid';
import POSCart from './POSCart';
import { invoiceService } from '../services/invoice';
import { posOfflineService } from '../services/pos-offline';
import { Wifi, WifiOff, Sync } from 'lucide-react';
import toast from 'react-hot-toast';

const POSInterface = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingSales();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    loadPendingCount();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const loadPendingCount = async () => {
    const count = await posOfflineService.getPendingSyncCount();
    setPendingSyncCount(count);
  };
  
  const syncPendingSales = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const results = await posOfflineService.syncPendingSales();
      const syncedCount = results.filter(r => r.status === 'synced').length;
      
      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} offline sales`);
        await loadPendingCount();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleCheckout = async (invoiceData) => {
    const userId = localStorage.getItem('userId');
    const orgId = localStorage.getItem('orgId');
    
    try {
      let invoice;
      
      if (isOnline) {
        // Online: Use regular invoice service
        invoice = await invoiceService.createInvoice({
          ...invoiceData,
          inputMethod: 'pos'
        });
      } else {
        // Offline: Use offline POS service
        const result = await posOfflineService.processSaleOffline(
          invoiceData,
          userId,
          orgId
        );
        invoice = result.invoice;
        await loadPendingCount();
      }
      
      toast.success(`Invoice ${invoice.displayId} created ${isOnline ? '' : '(offline)'}`);
      
    } catch (error) {
      toast.error('Failed to create invoice');
      console.error('Checkout error:', error);
    }
  };

  return (
    <CartProvider>
      <div className="h-screen bg-gray-100 p-4">
        {/* Status Bar */}
        <div className="mb-4 flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            
            {pendingSyncCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                <span>{pendingSyncCount} pending sync</span>
              </div>
            )}
          </div>
          
          {isOnline && pendingSyncCount > 0 && (
            <button
              onClick={syncPendingSales}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Sync className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
        
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100% - 80px)' }}>
          {/* Product Grid - Takes 2/3 of space on large screens */}
          <div className="lg:col-span-2">
            <ProductGrid />
          </div>
          
          {/* Cart - Takes 1/3 of space on large screens */}
          <div className="lg:col-span-1">
            <POSCart onCheckout={handleCheckout} />
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default POSInterface;