import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const StockReconciliation = () => {
  const [summary, setSummary] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVariancesOnly, setShowVariancesOnly] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [selectedDate]);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/stock/summary', {
        params: { asOfDate: selectedDate }
      });
      setSummary(response.data.data);
    } catch (error) {
      toast.error('Failed to load stock summary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockAdjustment = async (productId, currentStock, calculatedStock) => {
    const reason = prompt('Enter reason for stock adjustment:');
    if (!reason) return;

    try {
      await api.post('/stock/adjust', {
        productId,
        newStock: calculatedStock,
        reason
      });
      
      toast.success('Stock adjusted successfully');
      loadSummary();
    } catch (error) {
      toast.error('Failed to adjust stock');
    }
  };

  const filteredSummary = showVariancesOnly 
    ? summary.filter(item => item.variance !== 0)
    : summary;

  const totalVariances = summary.filter(item => item.variance !== 0).length;
  const criticalVariances = summary.filter(item => Math.abs(item.variance) > 10).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Reconciliation</h1>
            <p className="text-gray-600">Compare calculated vs actual stock levels</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showVariancesOnly}
                onChange={(e) => setShowVariancesOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Show variances only</span>
            </label>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.length - totalVariances}
                </div>
                <div className="text-sm text-gray-600">Reconciled Products</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{totalVariances}</div>
                <div className="text-sm text-gray-600">Total Variances</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{criticalVariances}</div>
                <div className="text-sm text-gray-600">Critical Variances (>10)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">
            Stock Reconciliation Report ({filteredSummary.length} items)
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Calculated Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Variance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Movements
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Movement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSummary.map((item) => (
                <tr key={item.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-500">{item.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">
                    {item.currentStock}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">
                    {item.calculatedStock}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {item.variance === 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className={`w-4 h-4 ${
                          Math.abs(item.variance) > 10 ? 'text-red-500' : 'text-orange-500'
                        }`} />
                      )}
                      <span className={`font-mono text-sm ${
                        item.variance === 0 ? 'text-green-600' :
                        item.variance > 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {item.variance > 0 ? '+' : ''}{item.variance}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>{item.totalIn}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-600">
                        <TrendingDown className="w-3 h-3" />
                        <span>{item.totalOut}</span>
                      </div>
                      {item.adjustments > 0 && (
                        <div className="text-blue-600 text-xs">
                          {item.adjustments} adj.
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.lastMovement 
                      ? new Date(item.lastMovement).toLocaleDateString()
                      : 'No movements'
                    }
                  </td>
                  <td className="px-6 py-4">
                    {item.variance !== 0 && (
                      <button
                        onClick={() => handleStockAdjustment(
                          item.productId,
                          item.currentStock,
                          item.calculatedStock
                        )}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Adjust
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSummary.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>
                {showVariancesOnly 
                  ? 'No stock variances found' 
                  : 'No products found'
                }
              </p>
            </div>
          )}
          
          {isLoading && (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p>Loading reconciliation data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockReconciliation;