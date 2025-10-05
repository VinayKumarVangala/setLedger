import React from 'react';
import { toast } from 'react-toastify';
import { localBackupService } from '../services/localBackup';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Show error toast
    toast.error('Something went wrong. Please refresh the page.', {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false
    });

    // Try to save current state to local backup
    try {
      const currentData = this.props.fallbackData || {};
      localBackupService.createLocalBackup(currentData);
    } catch (backupError) {
      console.error('Failed to create emergency backup:', backupError);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRestore = () => {
    try {
      const backups = localBackupService.getLocalBackups();
      if (backups.length > 0) {
        // Restore from latest backup
        const latestBackup = backups[0];
        this.props.onRestore?.(latestBackup.data);
        this.setState({ hasError: false, error: null });
        toast.success('Data restored from local backup');
      } else {
        toast.error('No backup data available');
      }
    } catch (error) {
      toast.error('Failed to restore from backup');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h1 className="text-xl font-semibold text-center text-gray-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              An unexpected error occurred. You can try reloading the page or restore from a local backup.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Reload Page
              </button>
              
              <button
                onClick={this.handleRestore}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Restore from Backup
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;