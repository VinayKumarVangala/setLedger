import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import syncService from '../services/sync';

const SyncStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ hasPendingItems: false, pendingCount: 0 });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const updateSyncStatus = async () => {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 30000); // Check every 30s

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || syncing) return;
    
    setSyncing(true);
    try {
      await syncService.forcSync();
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    if (syncing) return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    if (syncStatus.hasPendingItems) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncing) return 'Syncing...';
    if (syncStatus.hasPendingItems) return `${syncStatus.pendingCount} pending`;
    return 'Synced';
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm">
      {getStatusIcon()}
      <span className="text-gray-700 dark:text-gray-300">{getStatusText()}</span>
      
      {isOnline && syncStatus.hasPendingItems && !syncing && (
        <button
          onClick={handleManualSync}
          className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Sync now"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default SyncStatus;