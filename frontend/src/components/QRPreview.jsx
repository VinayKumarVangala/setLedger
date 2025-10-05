import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { productService } from '../services/api';

const QRPreview = ({ product, onClose }) => {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState(200);

  useEffect(() => {
    generateQR();
  }, [size]);

  const generateQR = async () => {
    try {
      setLoading(true);
      const response = await productService.generateQR(product.productID, { size });
      setQrCode(response.data.qrCode);
    } catch (error) {
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `${product.sku}_QR.png`;
    link.href = qrCode;
    link.click();
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${product.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
            }
            .qr-container { 
              border: 2px solid #000; 
              padding: 20px; 
              display: inline-block; 
              margin: 20px;
            }
            .product-info { 
              margin-top: 10px; 
              font-size: 14px; 
            }
            @media print {
              body { margin: 0; }
              .qr-container { 
                border: 1px solid #000; 
                page-break-inside: avoid; 
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrCode}" alt="QR Code" />
            <div class="product-info">
              <div><strong>${product.name}</strong></div>
              <div>SKU: ${product.sku}</div>
              <div>Price: ₹${product.pricing.sellingPrice}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">QR Code Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center">
          {/* Product Info */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">{product.name}</h4>
            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
            <p className="text-sm text-gray-600">
              Price: ₹{product.pricing.sellingPrice.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Size Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code Size
            </label>
            <select
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="100">Small (100px)</option>
              <option value="200">Medium (200px)</option>
              <option value="300">Large (300px)</option>
              <option value="400">Extra Large (400px)</option>
            </select>
          </div>

          {/* QR Code Display */}
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <img
                src={qrCode}
                alt="QR Code"
                className="mx-auto"
                style={{ width: `${size}px`, height: `${size}px` }}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3">
            <button
              onClick={downloadQR}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Download
            </button>
            <button
              onClick={printQR}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Print
            </button>
          </div>

          {/* QR Code Info */}
          <div className="mt-4 text-xs text-gray-500">
            <p>Scan this QR code to quickly access product information</p>
            <p>Compatible with any QR code scanner</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPreview;