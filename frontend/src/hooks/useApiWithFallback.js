import { useState, useEffect } from 'react';
import { errorHandler } from '../services/errorHandler';

// Custom hook for API calls with fallback data
export const useApiWithFallback = (apiCall, fallbackKey, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromFallback, setFromFallback] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiCall();
        
        if (response.success) {
          setData(response.data);
          setFromFallback(response.fromFallback || false);
        } else {
          setError(response.error);
          setFromFallback(response.fromFallback || false);
        }
      } catch (err) {
        const fallbackResponse = errorHandler.handleApiError(err, fallbackKey);
        
        if (fallbackResponse.success) {
          setData(fallbackResponse.data);
          setFromFallback(true);
        } else {
          setError(fallbackResponse.error);
          setFromFallback(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  const refetch = () => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiCall();
        
        if (response.success) {
          setData(response.data);
          setFromFallback(false);
          setError(null);
        }
      } catch (err) {
        errorHandler.handleApiError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  };

  return { data, loading, error, fromFallback, refetch };
};

// Hook for network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      errorHandler.showInfo('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      errorHandler.showWarning('You are offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};