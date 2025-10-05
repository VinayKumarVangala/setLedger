import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import QRScanner from './QRScanner';
import OfflineIndicator from './OfflineIndicator';
import SalesHistory from './SalesHistory';
import { indexedDBService } from '../services/indexedDB';
import { syncService } from '../services/syncService';

const POSInterface = () => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadProducts = async () => {
    try {
      const localProducts = await indexedDBService.getProducts();
      setProducts(localProducts);
      
      if (isOnline) {
        syncService.syncData();
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleScan = async (scannedData) => {
    try {
      // Try to parse as JSON (QR code) or use as SKU (barcode)
      let productData;
      try {
        productData = JSON.parse(scannedData);
      } catch {
        // Not JSON, treat as SKU
        const product = await indexedDBService.getProductBySKU(scannedData);
        if (product) {
          addToCart(product);
        } else {
          toast.error('Product not found');
        }
        setShowScanner(false);
        return;
      }

      // Handle QR code data
      if (productData.productID || productData.sku) {
        const product = products.find(p => 
          p.productID === productData.productID || p.sku === productData.sku
        );
        if (product) {
          addToCart(product);
        } else {
          toast.error('Product not found');
        }
      }
    } catch (error) {
      toast.error('Invalid scan data');
    }
    setShowScanner(false);
  };

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productID === product.productID);
      if (existing) {
        return prev.map(item =>
          item.productID === product.productID
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const updateQuantity = (productID, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productID);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productID === productID ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productID) => {
    setCart(prev => prev.filter(item => item.productID !== productID));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.quantity * item.price;
      const tax = (itemTotal * (item.taxRate || 18)) / 100;
      return total + itemTotal + tax;
    }, 0);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      const saleData = {
        items: cart,
        total: calculateTotal(),
        customer: customer.name ? customer : null
      };

      await indexedDBService.saveSale(saleData);
      
      setCart([]);
      setCustomer({ name: '', phone: '' });
      
      toast.success(isOnline ? 'Sale completed and synced' : 'Sale saved offline');
      
      if (isOnline) {
        syncService.syncData();
      }
    } catch (error) {
      toast.error('Failed to process sale');
      console.error('Sale error:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <OfflineIndicator />
      {/* Product Selection */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow h-full flex flex-col">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Products</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  History
                </button>
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={() => setShowScanner(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Scan
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.productID}
                  onClick={() => addToCart(product)}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-sm">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.sku}</p>
                  <p className="text-lg font-bold text-blue-600">₹{product.price}</p>
                  <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="w-96 p-4">
        <div className="bg-white rounded-lg shadow h-full flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Cart</h2>
          </div>
          
          {/* Customer Info */}
          <div className="p-4 border-b">
            <input
              type="text"
              placeholder="Customer Name (Optional)"
              value={customer.name}
              onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded px-3 py-2 mb-2"
            />
            <input
              type="tel"
              placeholder="Phone (Optional)"
              value={customer.phone}
              onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                Cart is empty
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.productID} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <button
                        onClick={() => removeFromCart(item.productID)}
                        className="text-red-500 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.productID, item.quantity - 1)}
                          className="w-6 h-6 bg-gray-200 rounded text-xs"
                        >
                          -
                        </button>
                        <span className="text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productID, item.quantity + 1)}
                          className="w-6 h-6 bg-gray-200 rounded text-xs"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold">₹{(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Total & Checkout */}
          {cart.length > 0 && (
            <div className="p-4 border-t">
              <div className="mb-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <button
                onClick={processSale}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600"
              >
                Complete Sale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isActive={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
      />
      
      {/* Sales History Modal */}
      <SalesHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
};

export default POSInterface;