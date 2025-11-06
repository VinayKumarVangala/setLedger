import React, { useState, useEffect } from 'react';
import { Percent, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

const ProductTaxForm = ({ productData, onChange }) => {
  const [taxRates, setTaxRates] = useState([]);
  const [gstValidation, setGstValidation] = useState(null);

  useEffect(() => {
    loadTaxRates();
  }, []);

  const loadTaxRates = async () => {
    try {
      const response = await api.get('/tax/rates');
      setTaxRates(response.data.data);
    } catch (error) {
      console.error('Failed to load tax rates:', error);
    }
  };

  const validateGST = async (gstNumber) => {
    if (!gstNumber) {
      setGstValidation(null);
      return;
    }

    try {
      const response = await api.post('/tax/validate-gst', { gstNumber });
      setGstValidation({
        valid: response.data.data.valid,
        message: response.data.data.valid ? 'Valid GST number' : 'Invalid GST number format'
      });
    } catch (error) {
      setGstValidation({ valid: false, message: 'GST validation failed' });
    }
  };

  const handleFieldChange = (field, value) => {
    const updatedData = { ...productData, [field]: value };
    onChange(updatedData);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Percent className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-medium">Tax Configuration</h3>
      </div>

      {/* GST Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          GST Rate
        </label>
        <select
          value={productData.gstRate || 18}
          onChange={(e) => handleFieldChange('gstRate', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          disabled={productData.exemptFromGST}
        >
          {taxRates.map((rate) => (
            <option key={rate.code} value={rate.rate}>
              {rate.display}
            </option>
          ))}
        </select>
      </div>

      {/* HSN Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          HSN/SAC Code
        </label>
        <input
          type="text"
          value={productData.hsnCode || ''}
          onChange={(e) => handleFieldChange('hsnCode', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Enter HSN/SAC code"
        />
        <p className="text-xs text-gray-500 mt-1">
          Harmonized System of Nomenclature code for tax classification
        </p>
      </div>

      {/* Tax Options */}
      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={productData.isGSTInclusive || false}
            onChange={(e) => handleFieldChange('isGSTInclusive', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
            disabled={productData.exemptFromGST}
          />
          <div>
            <div className="font-medium">GST Inclusive Pricing</div>
            <div className="text-sm text-gray-600">
              Price includes GST (tax will be extracted from price)
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={productData.exemptFromGST || false}
            onChange={(e) => handleFieldChange('exemptFromGST', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <div>
            <div className="font-medium">Exempt from GST</div>
            <div className="text-sm text-gray-600">
              This product is exempt from GST charges
            </div>
          </div>
        </label>
      </div>

      {/* Price Preview */}
      {productData.price && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Price Preview</h4>
          <div className="space-y-2 text-sm">
            {productData.exemptFromGST ? (
              <div className="flex justify-between">
                <span>Final Price (GST Exempt)</span>
                <span className="font-medium">₹{productData.price}</span>
              </div>
            ) : productData.isGSTInclusive ? (
              <>
                <div className="flex justify-between">
                  <span>Price (incl. GST)</span>
                  <span>₹{productData.price}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Base Price</span>
                  <span>₹{(productData.price / (1 + (productData.gstRate || 18) / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST ({productData.gstRate || 18}%)</span>
                  <span>₹{(productData.price - (productData.price / (1 + (productData.gstRate || 18) / 100))).toFixed(2)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Base Price</span>
                  <span>₹{productData.price}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST ({productData.gstRate || 18}%)</span>
                  <span>₹{((productData.price * (productData.gstRate || 18)) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Final Price</span>
                  <span>₹{(productData.price * (1 + (productData.gstRate || 18) / 100)).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* GST Number Validation (for reference) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Test GST Number (Optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter GST number to validate format"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            onChange={(e) => validateGST(e.target.value)}
          />
          {gstValidation && (
            <div className="flex items-center px-3">
              {gstValidation.valid ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          )}
        </div>
        {gstValidation && (
          <p className={`text-xs mt-1 ${gstValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
            {gstValidation.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductTaxForm;