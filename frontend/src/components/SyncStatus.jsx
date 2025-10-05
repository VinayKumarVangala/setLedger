import React, { useState, useEffect } from 'react';
import syncService from '../services/syncService';
import { 
  Wifi, WifiOff, Cloud, CloudOff, RefreshCw, 
  CheckCircle, AlertCircle, Clock 
} from 'lucide-react';

const SyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState(syncService.getSyncStatus());
  const [queuedCount, setQueuedCount] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [syncEvents, setSyncEvents] = useState([]);

  useEffect(() => {
    updateQueuedCount();
    
    const unsubscribe = syncService.addListener((event, data) => {
      handleSyncEvent(event, data);
    });

    return unsubscribe;
  }, []);

  const updateQueuedCount = async () => {
    const count = await syncService.getQueuedRequestsCount();
    setQueuedCount(count);
  };

  const handleSyncEvent = (event, data) => {
    setSyncStatus(syncService.getSyncStatus());
    
    const eventData = {
      id: Date.now(),
      type: event,
      data,
      timestamp: new Date()
    };
    
    setSyncEvents(prev => [eventData, ...prev.slice(0, 4)]);
    
    switch (event) {
      case 'online':
        setLastSync(new Date());
        break;
      case 'request-queued':
        updateQueuedCount();
        break;
      case 'request-synced':
        updateQueuedCount();
        setLastSync(new Date());
        break;
    }
  };

  const handleForceSync = async () => {
    await syncService.forcSync();
    updateQueuedCount();
  };

  const handleClearQueue = async () => {
    if (confirm('Clear all queued requests? This cannot be undone.')) {
      await syncService.clearQueue();
      updateQueuedCount();
      setSyncEvents([]);
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-600" />;
    }
    
    if (queuedCount > 0) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    }
    
    if (queuedCount > 0) {
      return `${queuedCount} pending`;
    }
    
    return 'Synced';
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'text-red-600 bg-red-50';
    if (queuedCount > 0) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-gray-900">Sync Status</span>
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Connection:</span>
          <div className="flex items-center gap-1">
            {syncStatus.isOnline ? (
              <Wifi className="h-3 w-3 text-green-600" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-600" />
            )}
            <span className={syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Service Worker Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Background Sync:</span>
          <div className="flex items-center gap-1">
            {syncStatus.hasBackgroundSync ? (
              <Cloud className="h-3 w-3 text-blue-600" />
            ) : (
              <CloudOff className="h-3 w-3 text-gray-400" />
            )}
            <span className={syncStatus.hasBackgroundSync ? 'text-blue-600' : 'text-gray-400'}>
              {syncStatus.hasBackgroundSync ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Last Sync */}
        {lastSync && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last Sync:</span>
            <span className="text-gray-900">
              {lastSync.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Queued Requests */}
        {queuedCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {queuedCount} request{queuedCount !== 1 ? 's' : ''} queued
                </p>
                <p className="text-xs text-yellow-600">
                  Will sync when connection is restored
                </p>
              </div>
              <button
                onClick={handleForceSync}
                className="text-yellow-700 hover:text-yellow-900"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Recent Events */}
        {syncEvents.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Recent Activity</p>
            <div className="space-y-1">
              {syncEvents.map(event => (
                <div key={event.id} className="flex items-center gap-2 text-xs">
                  {event.type === 'request-synced' && (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  )}
                  {event.type === 'request-queued' && (
                    <Clock className="h-3 w-3 text-yellow-600" />
                  )}
                  {event.type === 'request-failed' && (
                    <AlertCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span className="text-gray-600">
                    {event.type === 'request-synced' && 'Request synced'}
                    {event.type === 'request-queued' && 'Request queued'}
                    {event.type === 'request-failed' && 'Sync failed'}
                    {event.type === 'online' && 'Connection restored'}
                    {event.type === 'offline' && 'Connection lost'}
                  </span>
                  <span className="text-gray-400 ml-auto">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <button
            onClick={handleForceSync}
            disabled={!syncStatus.isOnline}
            className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
          >
            Force Sync
          </button>
          {queuedCount > 0 && (
            <button
              onClick={handleClearQueue}
              className="flex-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              Clear Queue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncStatus;