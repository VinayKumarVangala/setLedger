import React, { useState } from 'react';
import gstService from '../services/gstService';
import { Search, CheckCircle, XCircle, Loader2, Building } from 'lucide-react';

const GSTValidation = ({ onValidation }) => {
  const [gstin, setGstin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const validateGSTIN = async () => {
    if (!gstin || gstin.length !== 15) {
      setResult({ valid: false, error: 'GSTIN must be 15 characters' });
      return;
    }

    try {
      setLoading(true);
      const response = await gstService.validateGSTIN(gstin);
      setResult(response.data);
      
      if (onValidation) {
        onValidation(response.data);
      }
    } catch (error) {
      setResult({ valid: false, error: 'Validation failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 15) {
      setGstin(value);
      setResult(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">GSTIN Validation</h3>
      
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={gstin}
            onChange={handleInputChange}
            placeholder="Enter 15-digit GSTIN (e.g., 07AABCU9603R1ZX)"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={15}
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: 2 digits (State) + 10 digits (PAN) + 1 digit (Entity) + 1 digit (Z) + 1 digit (Check)
          </p>
        </div>
        
        <button
          onClick={validateGSTIN}
          disabled={loading || gstin.length !== 15}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Validate
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-lg border ${
          result.valid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result.valid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={`font-medium ${
              result.valid ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.valid ? 'Valid GSTIN' : 'Invalid GSTIN'}
            </span>
          </div>
          
          {result.valid && result.data && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Business Name:</span>
                <span>{result.data.lgnm || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Trade Name:</span>
                <span className="ml-2">{result.data.tradeNam || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  result.data.sts === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {result.data.sts || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="font-medium">Registration Date:</span>
                <span className="ml-2">{result.data.rgdt || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Business Type:</span>
                <span className="ml-2">{result.data.ctb || 'N/A'}</span>
              </div>
            </div>
          )}
          
          {result.error && (
            <p className="text-red-700 text-sm">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GSTValidation;