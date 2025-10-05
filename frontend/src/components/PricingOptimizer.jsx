import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { aiService } from '../services/aiService';

const PricingOptimizer = ({ productId, onClose, onPriceUpdate }) => {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualPrice, setManualPrice] = useState('');
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  useEffect(() => {
    if (productId) {
      fetchPricingOptimization();
    }
  }, [productId]);

  const fetchPricingOptimization = async () => {
    try {
      setLoading(true);
      const orgId = 'ORG_123'; // Should come from context
      
      const response = await aiService.optimizePricing(orgId, productId, true);
      
      if (response.success) {
        setPricing(response.data);
        setManualPrice(response.data.pricing.current_price.toString());
      } else {
        toast.error('Failed to optimize pricing');
      }
    } catch (error) {
      toast.error('Pricing optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const applyPricing = async (price, strategy = null) => {
    try {
      // Here you would call your product update API
      const updatedPrice = parseFloat(price);
      
      if (isNaN(updatedPrice) || updatedPrice <= 0) {
        toast.error('Invalid price value');
        return;
      }
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onPriceUpdate?.(productId, updatedPrice, strategy);
      toast.success(`Price updated to ₹${updatedPrice.toFixed(2)}`);
      onClose();
      
    } catch (error) {
      toast.error('Failed to update price');
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getElasticityInterpretation = (elasticity) => {
    if (elasticity > -0.5) return 'Inelastic - Price changes have minimal impact';
    if (elasticity > -1.5) return 'Moderately elastic - Price changes moderately affect demand';
    return 'Highly elastic - Price changes significantly impact demand';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="text-center">
            <p className="text-gray-500">No pricing data available</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">AI Pricing Optimizer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">{pricing.product_name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Price:</span>
                <div className="font-medium">₹{pricing.pricing.current_price.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">Cost Price:</span>
                <div className="font-medium">₹{pricing.pricing.factors.cost_price.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">Current Margin:</span>
                <div className="font-medium">{pricing.pricing.factors.margin_percent.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-gray-600">Sales Data:</span>
                <div className="font-medium">{pricing.sales_data_points} points</div>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">AI Recommendation</h3>
                <p className="text-sm text-gray-600">Based on {pricing.pricing.method} analysis</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{pricing.pricing.recommended_price.toFixed(2)}
                </div>
                <div className={`text-sm ${getConfidenceColor(pricing.pricing.confidence)}`}>
                  {Math.round(pricing.pricing.confidence * 100)}% confidence
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-600">Price Change:</span>
                <div className={`font-medium ${
                  pricing.pricing.recommended_price > pricing.pricing.current_price 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {pricing.pricing.recommended_price > pricing.pricing.current_price ? '+' : ''}
                  ₹{(pricing.pricing.recommended_price - pricing.pricing.current_price).toFixed(2)}
                  ({((pricing.pricing.recommended_price - pricing.pricing.current_price) / pricing.pricing.current_price * 100).toFixed(1)}%)
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Demand Elasticity:</span>
                <div className="font-medium">{pricing.pricing.elasticity}</div>
                <div className="text-xs text-gray-500">
                  {getElasticityInterpretation(pricing.pricing.elasticity)}
                </div>
              </div>
            </div>

            <button
              onClick={() => applyPricing(pricing.pricing.recommended_price, 'ai_recommendation')}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Apply AI Recommendation
            </button>
          </div>

          {/* Competitor Prices */}
          {pricing.competitor_prices.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Competitor Analysis</h3>
              <div className="space-y-2">
                {pricing.competitor_prices.map((competitor, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <span className="font-medium">{competitor.source}</span>
                    <span className="text-lg">₹{competitor.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Average Competitor Price:</span>
                  <span>₹{pricing.pricing.factors.avg_competitor_price?.toFixed(2) || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Strategies */}
          {pricing.pricing.strategies && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Alternative Strategies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pricing.pricing.strategies.map((strategy, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedStrategy === index ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedStrategy(index)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{strategy.name}</h4>
                      <span className="text-lg font-bold">₹{strategy.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{strategy.description}</p>
                    {selectedStrategy === index && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          applyPricing(strategy.price, strategy.name);
                        }}
                        className="mt-2 w-full bg-green-500 text-white py-1 rounded text-sm hover:bg-green-600"
                      >
                        Apply This Strategy
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Override */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Manual Override</h3>
              <button
                onClick={() => setShowManualOverride(!showManualOverride)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showManualOverride ? 'Hide' : 'Show'} Manual Input
              </button>
            </div>
            
            {showManualOverride && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium">Custom Price:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="border rounded px-3 py-1 w-32"
                  />
                  <span className="text-sm text-gray-600">
                    (Min: ₹{pricing.pricing.price_bounds?.min_price.toFixed(2)}, 
                     Max: ₹{pricing.pricing.price_bounds?.max_price.toFixed(2)})
                  </span>
                </div>
                <button
                  onClick={() => applyPricing(manualPrice, 'manual_override')}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                  Apply Manual Price
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingOptimizer;