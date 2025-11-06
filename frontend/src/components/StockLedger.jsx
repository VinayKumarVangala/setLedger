import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RotateCcw, FileText, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const StockLedger = ({ productId, productName }) => {
  const [ledger, setLedger] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    moveType: '',
    startDate: '',
    endDate: '',
    limit: 50
  });

  useEffect(() => {
    if (productId) {
      loadLedger();
      loadReconciliation();
    }
  }, [productId, filters]);

  const loadLedger = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/stock/ledger', {
        params: { productId, ...filters }
      });
      setLedger(response.data.data);
    } catch (error) {
      toast.error('Failed to load stock ledger');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReconciliation = async () => {
    try {
      const response = await api.get(`/stock/reconcile/${productId}`);
      setReconciliation(response.data.data);
    } catch (error) {
      console.error('Failed to load reconciliation:', error);
    }
  };

  const getMoveIcon = (moveType) => {
    switch (moveType) {
      case 'in': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'out': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'adjustment': return <RotateCcw className="w-4 h-4 text-blue-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMoveColor = (moveType) => {
    switch (moveType) {
      case 'in': return 'text-green-600 bg-green-50';
      case 'out': return 'text-red-600 bg-red-50';
      case 'adjustment': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatQuantity = (moveType, quantity) => {
    if (moveType === 'in') return `+${quantity}`;
    if (moveType === 'out') return `-${quantity}`;
    return quantity.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Stock Ledger</h3>
            {productName && (
              <p className="text-sm text-gray-600">{productName}</p>
            )}
          </div>
          
          {reconciliation && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              reconciliation.isReconciled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {reconciliation.isReconciled ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Reconciled</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Variance: {reconciliation.variance}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.moveType}
            onChange={(e) => setFilters(prev => ({ ...prev, moveType: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Movements</option>
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
            <option value="adjustment">Adjustments</option>
          </select>
          
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Start Date"
          />
          
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="End Date"
          />
          
          <select
            value={filters.limit}
            onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="25">25 records</option>
            <option value="50">50 records</option>
            <option value="100">100 records</option>
            <option value="200">200 records</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Movement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Running Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ledger.map((move) => {
              const metadata = JSON.parse(move.metadata || '{}');
              return (
                <tr key={move.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(move.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getMoveIcon(move.moveType)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMoveColor(move.moveType)}`}>
                        {move.moveType.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    <span className={
                      move.moveType === 'in' ? 'text-green-600' :
                      move.moveType === 'out' ? 'text-red-600' : 'text-blue-600'
                    }>
                      {formatQuantity(move.moveType, move.quantity)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {move.reference || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {move.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium">
                    {metadata.newStock || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {ledger.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No stock movements found</p>
          </div>
        )}
        
        {isLoading && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p>Loading stock ledger...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockLedger;