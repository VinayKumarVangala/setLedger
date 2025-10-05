import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { productService } from '../services/api';

const BulkQRExport = ({ productIds, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [options, setOptions] = useState({
    size: 200,
    includeLabels: true,
    layout: 'grid' // grid, list
  });

  const generateBulkQR = async () => {
    try {
      setLoading(true);
      const response = await productService.bulkQRExport({
        productIds,
        size: options.size,
        includeLabels: options.includeLabels
      });
      
      setQrCodes(response.data.qrCodes);
      toast.success(`Generated ${response.data.count} QR codes successfully`);
    } catch (error) {
      toast.error('Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  const downloadAll = () => {
    qrCodes.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `${item.sku}_QR.png`;
        link.href = item.qrCode;
        link.click();
      }, index * 100); // Stagger downloads
    });
  };

  const printAll = () => {
    const printWindow = window.open('', '_blank');
    const qrGrid = qrCodes.map(item => `
      <div class="qr-item">
        <img src="${item.qrCode}" alt="QR Code" />
        ${options.includeLabels ? `
          <div class="product-info">
            <div><strong>${item.name}</strong></div>
            <div>SKU: ${item.sku}</div>
            <div>Price: ₹${item.price}</div>
          </div>
        ` : ''}
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Bulk QR Codes</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              margin: 0;
            }
            .qr-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
              gap: 20px; 
            }
            .qr-item { 
              border: 1px solid #000; 
              padding: 15px; 
              text-align: center; 
              page-break-inside: avoid;
            }
            .qr-item img { 
              width: ${options.size}px; 
              height: ${options.size}px; 
            }
            .product-info { 
              margin-top: 10px; 
              font-size: 12px; 
            }
            @media print {
              body { margin: 0; }
              .qr-grid { gap: 10px; }
              .qr-item { 
                border: 1px solid #000; 
                break-inside: avoid; 
              }
            }
          </style>
        </head>
        <body>
          <h1>Product QR Codes</h1>
          <div class="qr-grid">
            ${qrGrid}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const exportPDF = () => {
    // This would integrate with a PDF library like jsPDF
    toast.info('PDF export feature coming soon!');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Bulk QR Export ({productIds.length} products)
          </h3>
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

        {/* Export Options */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Export Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Size
              </label>
              <select
                value={options.size}
                onChange={(e) => setOptions(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="100">Small (100px)</option>
                <option value="150">Medium (150px)</option>
                <option value="200">Large (200px)</option>
                <option value="250">Extra Large (250px)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layout
              </label>
              <select
                value={options.layout}
                onChange={(e) => setOptions(prev => ({ ...prev, layout: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="grid">Grid Layout</option>
                <option value="list">List Layout</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeLabels"
                checked={options.includeLabels}
                onChange={(e) => setOptions(prev => ({ ...prev, includeLabels: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="includeLabels" className="text-sm font-medium text-gray-700">
                Include Product Labels
              </label>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={generateBulkQR}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate QR Codes'}
            </button>
          </div>
        </div>

        {/* Generated QR Codes */}
        {qrCodes.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">
                Generated QR Codes ({qrCodes.length})
              </h4>
              <div className="space-x-2">
                <button
                  onClick={downloadAll}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Download All
                </button>
                <button
                  onClick={printAll}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                >
                  Print All
                </button>
                <button
                  onClick={exportPDF}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Export PDF
                </button>
              </div>
            </div>

            {/* QR Codes Grid */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              <div className={`grid gap-4 ${
                options.layout === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {qrCodes.map((item, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-3 text-center">
                    <img
                      src={item.qrCode}
                      alt={`QR Code for ${item.name}`}
                      className="mx-auto mb-2"
                      style={{ width: `${Math.min(options.size, 150)}px`, height: `${Math.min(options.size, 150)}px` }}
                    />
                    {options.includeLabels && (
                      <div className="text-xs text-gray-600">
                        <div className="font-medium truncate">{item.name}</div>
                        <div>SKU: {item.sku}</div>
                        <div>₹{item.price}</div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `${item.sku}_QR.png`;
                        link.href = item.qrCode;
                        link.click();
                      }}
                      className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="text-sm font-medium text-blue-800 mb-2">Instructions:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Select your preferred QR code size and layout options</li>
            <li>• Click "Generate QR Codes" to create QR codes for all selected products</li>
            <li>• Use "Download All" to save all QR codes as individual PNG files</li>
            <li>• Use "Print All" to print all QR codes in a grid layout</li>
            <li>• Each QR code contains product ID, name, SKU, and price information</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BulkQRExport;