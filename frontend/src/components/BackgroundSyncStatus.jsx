import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RotateCcw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import syncService from '../services/sync';

const BackgroundSyncStatus = () => {
  const [syncState, setSyncState] = useState({
    isOnline: navigator.onLine,
    pendingCount: 0,
    lastSync: null,
    backgroundSyncSupported: false,
    retryQueue: []
  });

  useEffect(() => {
    const checkBackgroundSyncSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
      setSyncState(prev => ({ ...prev, backgroundSyncSupported: supported }));
    };

    const updateSyncState = async () => {
      const status = await syncService.getSyncStatus();
      const conflicts = await syncService.getConflicts();
      
      setSyncState(prev => ({
        ...prev,
        pendingCount: status.pendingCount,
        lastSync: status.lastSync,
        conflictCount: conflicts.length
      }));
    };

    const handleOnline = () => setSyncState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkBackgroundSyncSupport();
    updateSyncState();

    const interval = setInterval(updateSyncState, 10000); // Update every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const getStatusIcon = () => {
    if (!syncState.isOnline) {
      return <CloudOff className="w-4 h-4 text-red-500" />;
    }
    
    if (syncState.pendingCount > 0) {
      return <RotateCcw className="w-4 h-4 text-yellow-500 animate-spin" />;
    }
    
    if (syncState.conflictCount > 0) {
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
    
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!syncState.isOnline) {
      return 'Offline';
    }
    
    if (syncState.pendingCount > 0) {
      return `Syncing ${syncState.pendingCount} items`;
    }
    
    if (syncState.conflictCount > 0) {
      return `${syncState.conflictCount} conflicts`;
    }
    
    return 'All synced';
  };

  const getLastSyncText = () => {
    if (!syncState.lastSync) return 'Never';
    
    const now = new Date();
    const lastSync = new Date(syncState.lastSync);
    const diffMinutes = Math.floor((now - lastSync) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleManualSync = async () => {
    if (syncState.isOnline) {
      await syncService.forcSync();
    }
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getStatusText()}
        </span>
      </div>
      
      {syncState.backgroundSyncSupported && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Cloud className="w-3 h-3" />
          <span>BG</span>
        </div>
      )}
      
      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
        <Clock className="w-3 h-3" />
        <span>{getLastSyncText()}</span>
      </div>
      
      {syncState.isOnline && syncState.pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Force sync now"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default BackgroundSyncStatus;