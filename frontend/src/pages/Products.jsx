import React, { useState } from 'react';
import { ArrowLeft, Plus, Package } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([
    { id: 1, name: 'Sample Product', price: 299, stock: 50, sku: 'SP001' }
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: '', price: '', stock: '', sku: '', 
    isPerishable: false, mfdDate: '', expiryDate: '' 
  });

  const generateQRData = (product) => {
    return JSON.stringify({
      uuid: product.uuid,
      displayId: product.displayId,
      name: product.name,
      price: product.price,
      sku: product.sku,
      isPerishable: product.isPerishable,
      mfdDate: product.mfdDate,
      expiryDate: product.expiryDate
    });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const { v4: uuidv4 } = require('uuid');
    
    const product = {
      uuid: uuidv4(),
      displayId: `PRD${Date.now().toString().slice(-6)}`,
      ...newProduct,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock)
    };
    product.qrData = generateQRData(product);
    setProducts([...products, product]);
    setNewProduct({ 
      name: '', price: '', stock: '', sku: '', 
      isPerishable: false, mfdDate: '', expiryDate: '' 
    });
    setShowAddForm(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            title="Add a new product to your inventory"
          >
            <Plus size={20} />
            <span>Add Product</span>
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                className="px-3 py-2 border rounded-lg"
                required
              />
              <div className="relative">
                <input
                  type="text"
                  placeholder="SKU (Stock Keeping Unit)"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  className="px-3 py-2 border rounded-lg w-full"
                  title="SKU: Unique identifier for inventory tracking (e.g., ABC123)"
                  required
                />
              </div>
              <input
                type="number"
                placeholder="Price (₹)"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                className="px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                placeholder="Stock Quantity"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                className="px-3 py-2 border rounded-lg"
                required
              />
              
              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newProduct.isPerishable}
                    onChange={(e) => setNewProduct({...newProduct, isPerishable: e.target.checked})}
                    className="rounded"
                  />
                  <span>Perishable Good</span>
                </label>
              </div>
              
              {newProduct.isPerishable && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Manufacturing Date</label>
                    <input
                      type="date"
                      value={newProduct.mfdDate}
                      onChange={(e) => setNewProduct({...newProduct, mfdDate: e.target.value})}
                      className="px-3 py-2 border rounded-lg w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={newProduct.expiryDate}
                      onChange={(e) => setNewProduct({...newProduct, expiryDate: e.target.value})}
                      className="px-3 py-2 border rounded-lg w-full"
                      required
                    />
                  </div>
                </>
              )}
              <div className="col-span-2 flex space-x-3">
                <button 
                  type="submit" 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  title="Save this product to your inventory"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  title="Cancel and close the form"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.uuid || product.id} className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center space-x-3 mb-4">
                <Package className="text-blue-500" size={24} />
                <h3 className="text-lg font-semibold">{product.name}</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600">SKU: {product.sku}</p>
                <p className="text-gray-600">Price: ₹{product.price}</p>
                <p className="text-gray-600">Stock: {product.stock} units</p>
                {product.isPerishable && (
                  <>
                    <p className="text-orange-600 text-sm">⚠️ Perishable</p>
                    <p className="text-gray-600 text-sm">MFD: {product.mfdDate}</p>
                    <p className="text-gray-600 text-sm">Exp: {product.expiryDate}</p>
                  </>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="w-20 h-20 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs font-mono bg-white p-1 rounded">
                      {product.displayId || product.sku}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">QR Code</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;