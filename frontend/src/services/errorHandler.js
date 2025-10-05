import { toast } from 'react-toastify';
import { localBackupService } from './localBackup';

class ErrorHandler {
  constructor() {
    this.fallbackData = {};
    this.loadFallbackData();
  }

  // Load fallback data from local backup
  loadFallbackData() {
    try {
      const backups = localBackupService.getLocalBackups();
      if (backups.length > 0) {
        this.fallbackData = backups[0].data;
      }
    } catch (error) {
      console.error('Failed to load fallback data:', error);
    }
  }

  // Handle API errors with fallback
  handleApiError(error, fallbackKey = null) {
    const errorMessage = this.getErrorMessage(error);
    
    // Show error toast
    toast.error(errorMessage, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true
    });

    // Log error for debugging
    console.error('API Error:', {
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });

    // Return fallback data if available
    if (fallbackKey && this.fallbackData[fallbackKey]) {
      toast.info('Using offline data', { autoClose: 3000 });
      return {
        success: true,
        data: this.fallbackData[fallbackKey],
        fromFallback: true
      };
    }

    return {
      success: false,
      error: errorMessage,
      fromFallback: false
    };
  }

  // Extract error message from different error types
  getErrorMessage(error) {
    if (error.response) {
      // Server responded with error status
      const { data, status } = error.response;
      
      if (data?.error?.message) {
        return data.error.message;
      }
      
      if (data?.message) {
        return data.message;
      }
      
      return this.getStatusMessage(status);
    }
    
    if (error.request) {
      // Network error
      return 'Network error. Please check your connection.';
    }
    
    // Other errors
    return error.message || 'An unexpected error occurred';
  }

  // Get user-friendly status messages
  getStatusMessage(status) {
    const messages = {
      400: 'Invalid request. Please check your input.',
      401: 'Authentication required. Please log in.',
      403: 'Access denied. You don\'t have permission.',
      404: 'Resource not found.',
      409: 'Conflict. Resource already exists.',
      422: 'Validation failed. Please check your input.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      502: 'Service unavailable. Please try again later.',
      503: 'Service temporarily unavailable.',
      504: 'Request timeout. Please try again.'
    };
    
    return messages[status] || `Error ${status}: Something went wrong`;
  }

  // Handle network connectivity
  handleNetworkError() {
    toast.warn('You are offline. Using cached data.', {
      position: 'top-center',
      autoClose: 3000
    });
    
    return this.fallbackData;
  }

  // Show success message
  showSuccess(message) {
    toast.success(message, {
      position: 'top-right',
      autoClose: 3000
    });
  }

  // Show warning message
  showWarning(message) {
    toast.warn(message, {
      position: 'top-right',
      autoClose: 4000
    });
  }

  // Show info message
  showInfo(message) {
    toast.info(message, {
      position: 'top-right',
      autoClose: 3000
    });
  }

  // Update fallback data
  updateFallbackData(key, data) {
    this.fallbackData[key] = data;
    localBackupService.autoBackup(this.fallbackData);
  }
}

export const errorHandler = new ErrorHandler();
export default errorHandler;