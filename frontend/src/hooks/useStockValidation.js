import { useState, useCallback } from 'react';
import { api } from '../services/api';

export const useStockValidation = () => {
  const [validationCache, setValidationCache] = useState(new Map());
  const [isValidating, setIsValidating] = useState(false);

  const validateStock = useCallback(async (productId, requestedQuantity) => {
    const cacheKey = `${productId}_${requestedQuantity}`;
    
    // Check cache first
    if (validationCache.has(cacheKey)) {
      const cached = validationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) { // 30 second cache
        return cached.result;
      }
    }

    setIsValidating(true);
    
    try {
      const response = await api.get(`/stock/available/${productId}`);
      const availableStock = response.data.data.availableStock;
      
      const result = {
        valid: availableStock >= requestedQuantity,
        availableStock,
        requestedQuantity,
        message: availableStock >= requestedQuantity 
          ? 'Stock available' 
          : `Only ${availableStock} units available`
      };
      
      // Cache the result
      setValidationCache(prev => new Map(prev).set(cacheKey, {
        result,
        timestamp: Date.now()
      }));
      
      return result;
    } catch (error) {
      throw new Error('Failed to validate stock');
    } finally {
      setIsValidating(false);
    }
  }, [validationCache]);

  const clearCache = useCallback(() => {
    setValidationCache(new Map());
  }, []);

  const validateMultipleItems = useCallback(async (items) => {
    const validations = await Promise.allSettled(
      items.map(item => validateStock(item.productId, item.quantity))
    );
    
    const results = validations.map((validation, index) => ({
      productId: items[index].productId,
      ...validation.value || { valid: false, message: validation.reason }
    }));
    
    return {
      allValid: results.every(r => r.valid),
      results
    };
  }, [validateStock]);

  return {
    validateStock,
    validateMultipleItems,
    clearCache,
    isValidating
  };
};