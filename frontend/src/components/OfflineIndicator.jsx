import React, { useState, useEffect } from 'react';
import syncService from '../services/syncService';
import { WifiOff, Wifi, Clock } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    const unsubscribe = syncService.addListener((event, data) => {
      if (event === 'online') {
        setIsOnline(true);
      } else if (event === 'offline') {
        setIsOnline(false);
      }
      
      updateQueuedCount();
    });

    updateQueuedCount();
    return unsubscribe;
  }, []);

  const updateQueuedCount = async () => {
    const count = await syncService.getQueuedRequestsCount();
    setQueuedCount(count);
  };

  if (isOnline && queuedCount === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
      isOnline ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
    }`}>
      {isOnline ? (
        <>
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            {queuedCount} request{queuedCount !== 1 ? 's' : ''} syncing...
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">
            Offline - {queuedCount} request{queuedCount !== 1 ? 's' : ''} queued
          </span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;