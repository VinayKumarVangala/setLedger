import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { aiService } from '../services/aiService';

const StockPredictionDashboard = ({ orgId }) => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    if (orgId) {
      fetchStockTrends();
    }
  }, [orgId]);

  const fetchStockTrends = async () => {
    try {
      setLoading(true);
      const response = await aiService.getStockTrends(orgId);
      
      if (response.success) {
        setTrends(response.data);
      } else {
        toast.error('Failed to fetch stock trends');
      }
    } catch (error) {
      toast.error('AI service unavailable');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductPrediction = async (productId) => {
    try {
      const response = await aiService.predictStockDepletion(orgId, productId);
      
      if (response.success) {
        setPrediction(response.data);
        setSelectedProduct(productId);
      } else {
        toast.error('Failed to get prediction');
      }
    } catch (error) {
      toast.error('Prediction failed');
    }
  };

  const formatDaysRemaining = (days) => {
    if (days === null || days === undefined) return 'Unknown';
    if (days === Infinity) return 'No depletion expected';
    if (days < 1) return 'Critical - Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const getStatusColor = (days) => {
    if (days === null || days === undefined) return 'bg-gray-100 text-gray-800';
    if (days < 7) return 'bg-red-100 text-red-800';
    if (days <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No stock trend data available</p>
        <button
          onClick={fetchStockTrends}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{trends.summary.critical_count}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Critical Stock</p>
              <p className="text-xs text-red-600">< 7 days remaining</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{trends.summary.low_count}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">Low Stock</p>
              <p className="text-xs text-yellow-600">7-30 days remaining</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{trends.summary.healthy_count}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Healthy Stock</p>
              <p className="text-xs text-green-600">> 30 days remaining</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{trends.summary.no_data_count}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">No Data</p>
              <p className="text-xs text-gray-600">Insufficient history</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert */}
      {trends.trends.critical_stock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-3">🚨 Critical Stock Alert</h3>
          <div className="space-y-2">
            {trends.trends.critical_stock.slice(0, 5).map((product) => (
              <div key={product.product_id} className="flex justify-between items-center">
                <span className="font-medium">{product.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {product.current_stock} units • {formatDaysRemaining(product.days_remaining)}
                  </span>
                  <button
                    onClick={() => fetchProductPrediction(product.product_id)}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Trends Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Stock Depletion Predictions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Remaining</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...trends.trends.critical_stock, ...trends.trends.low_stock, ...trends.trends.healthy_stock.slice(0, 10)]
                .map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.current_stock} units</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDaysRemaining(product.days_remaining)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.days_remaining)}`}>
                      {product.days_remaining < 7 ? 'Critical' : product.days_remaining <= 30 ? 'Low' : 'Healthy'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => fetchProductPrediction(product.product_id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prediction Details Modal */}
      {prediction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Stock Prediction Details</h3>
              <button
                onClick={() => setPrediction(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{prediction.product_name}</h4>
                <p className="text-sm text-gray-600">Current Stock: {prediction.current_stock} units</p>
              </div>
              
              {prediction.prediction.success ? (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Depletion Date</p>
                      <p className="text-lg">
                        {prediction.prediction.depletion_date 
                          ? new Date(prediction.prediction.depletion_date).toLocaleDateString()
                          : 'No depletion expected'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Days Remaining</p>
                      <p className="text-lg">{formatDaysRemaining(prediction.prediction.days_remaining)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Confidence</p>
                      <p className="text-lg">{Math.round(prediction.prediction.confidence * 100)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Method</p>
                      <p className="text-lg capitalize">{prediction.prediction.method}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-red-800">Prediction failed: {prediction.prediction.error}</p>
                </div>
              )}
              
              {prediction.insights.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Insights</h5>
                  <div className="space-y-2">
                    {prediction.insights.map((insight, index) => (
                      <div key={index} className={`p-2 rounded text-sm ${
                        insight.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                        insight.type === 'info' ? 'bg-blue-50 text-blue-800' :
                        'bg-gray-50 text-gray-800'
                      }`}>
                        {insight.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPredictionDashboard;