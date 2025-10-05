import React, { useState, useRef } from 'react';
import BarcodeReader from 'react-barcode-reader';

const QRScanner = ({ onScan, onClose, isActive }) => {
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');

  const handleScan = (data) => {
    if (data) {
      onScan(data);
      setError('');
    }
  };

  const handleError = (err) => {
    setError('Camera access denied or not available');
    console.error('Scanner error:', err);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scan Product</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera Scanner */}
        <div className="mb-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            {error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : (
              <BarcodeReader
                onError={handleError}
                onScan={handleScan}
                style={{ width: '100%' }}
              />
            )}
          </div>
        </div>

        {/* Manual Input */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">Or enter manually:</p>
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter SKU or barcode"
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add
            </button>
          </form>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Point camera at QR code or barcode
        </div>
      </div>
    </div>
  );
};

export default QRScanner;