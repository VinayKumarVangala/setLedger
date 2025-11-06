import React, { useState } from 'react';
import { Download, Printer, Package } from 'lucide-react';
import { qrPDFService } from '../services/qr-pdf';
import toast from 'react-hot-toast';

const QRLabelGenerator = ({ products = [], selectedProducts = [] }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState(selectedProducts);

  const handleSingleGenerate = async (productId) => {
    setIsGenerating(true);
    try {
      await qrPDFService.generateSingleQRPDF(productId);
      toast.success('QR label downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate QR label');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select products to generate labels');
      return;
    }

    setIsGenerating(true);
    try {
      await qrPDFService.generateBulkQRPDF(selectedIds);
      toast.success(`Generated ${selectedIds.length} QR labels`);
    } catch (error) {
      toast.error('Failed to generate bulk QR labels');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelection = (productId) => {
    setSelectedIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    setSelectedIds(products.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">QR Label Generator</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
          >
            Clear
          </button>
          <button
            onClick={handleBulkGenerate}
            disabled={isGenerating || selectedIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Generate Bulk ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className={`border rounded-lg p-4 transition-colors ${
              selectedIds.includes(product.id) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                <p className="text-sm font-medium text-green-600">₹{product.price}</p>
              </div>
              
              <input
                type="checkbox"
                checked={selectedIds.includes(product.id)}
                onChange={() => toggleSelection(product.id)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSingleGenerate(product.id)}
                disabled={isGenerating}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
                Single
              </button>
              
              {product.isPerishable && product.expiryDate && (
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                  Exp: {new Date(product.expiryDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No products available for QR label generation</p>
        </div>
      )}
    </div>
  );
};

export default QRLabelGenerator;