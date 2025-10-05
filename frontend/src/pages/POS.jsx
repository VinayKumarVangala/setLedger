import React, { useState } from 'react';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';

const POS = () => {
  const [products] = useState([
    { id: 1, name: 'Sample Product', price: 299, stock: 50 },
    { id: 2, name: 'Another Item', price: 199, stock: 30 }
  ]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setTotal(total + product.price);
  };

  const removeFromCart = (productId) => {
    const item = cart.find(item => item.id === productId);
    if (item.quantity === 1) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    }
    setTotal(total - item.price);
  };

  const processSale = () => {
    alert(`Sale processed! Total: ₹${total}`);
    setCart([]);
    setTotal(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <button 
            onClick={() => window.history.back()} 
            className="p-2 hover:bg-gray-200 rounded-lg"
            title="Go back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-lg p-4 shadow-sm border">
                  <h3 className="font-medium mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-2">₹{product.price}</p>
                  <p className="text-sm text-gray-500 mb-3">Stock: {product.stock}</p>
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    title={`Add ${product.name} to your cart`}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-lg p-6 shadow-sm border h-fit">
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingCart size={20} />
              <h2 className="text-xl font-semibold">Cart</h2>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">₹{item.price} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Remove one item from cart"
                        >
                          <Minus size={16} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Add one more item to cart"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold">₹{total}</span>
                  </div>
                  <button
                    onClick={processSale}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
                    title="Complete the transaction and process payment"
                  >
                    Process Sale
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;