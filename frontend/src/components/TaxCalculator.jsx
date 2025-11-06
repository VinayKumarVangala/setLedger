import React, { useState, useEffect } from 'react';
import { Calculator, Info, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const TaxCalculator = ({ invoiceLines, customerState, onTaxCalculated }) => {
  const [taxCalculation, setTaxCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (invoiceLines?.length > 0) {
      calculateTax();
    }
  }, [invoiceLines, customerState]);

  const calculateTax = async () => {
    setIsCalculating(true);
    try {
      const response = await api.post('/tax/calculate', {
        invoiceLines,
        customerState
      });
      
      const taxCalc = response.data.data;
      setTaxCalculation(taxCalc);
      onTaxCalculated?.(taxCalc);
    } catch (error) {
      console.error('Tax calculation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  if (!taxCalculation) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calculator className="w-4 h-4" />
          <span className="text-sm">
            {isCalculating ? 'Calculating taxes...' : 'Add items to calculate taxes'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium">Tax Calculation</h3>
        </div>
        
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
        >
          <Info className="w-4 h-4" />
          {showBreakdown ? 'Hide' : 'Show'} Breakdown
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-600">Taxable Amount</div>
          <div className="font-medium">₹{taxCalculation.totalBaseAmount.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Tax</div>
          <div className="font-medium text-blue-600">₹{taxCalculation.totalTaxAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Tax Type Indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-1 text-xs rounded-full ${
          taxCalculation.isInterState 
            ? 'bg-orange-100 text-orange-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {taxCalculation.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
        </span>
      </div>

      {/* Tax Breakdown */}
      {showBreakdown && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Tax Breakdown</h4>
          
          {taxCalculation.isInterState ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>IGST ({taxCalculation.lineCalculations[0]?.gstRate || 0}%)</span>
                <span>₹{taxCalculation.totalIGST.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CGST ({(taxCalculation.lineCalculations[0]?.gstRate || 0) / 2}%)</span>
                <span>₹{taxCalculation.totalCGST.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST ({(taxCalculation.lineCalculations[0]?.gstRate || 0) / 2}%)</span>
                <span>₹{taxCalculation.totalSGST.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          {/* Line-wise breakdown */}
          <div className="mt-4">
            <h5 className="text-sm font-medium mb-2">Item-wise Tax</h5>
            <div className="space-y-2">
              {taxCalculation.lineCalculations.map((line, index) => (
                <div key={index} className="flex justify-between text-xs text-gray-600">
                  <span>Item {index + 1} ({line.gstRate}%)</span>
                  <span>₹{line.totalTax.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exemptions Notice */}
      {taxCalculation.lineCalculations.some(line => line.exemptFromGST) && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Some items are exempt from GST
            </span>
          </div>
        </div>
      )}

      {/* Grand Total */}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Grand Total</span>
          <span className="text-lg font-bold text-green-600">
            ₹{taxCalculation.grandTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaxCalculator;