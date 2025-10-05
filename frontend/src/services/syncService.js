class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.listeners = new Set();
    this.init();
  }

  init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
          this.registration = registration;
          
          // Listen for messages from SW
          navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this));
        })
        .catch(error => console.error('SW registration failed:', error));
    }

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('background-sync');
      });
    }
  }

  handleOnline() {
    this.isOnline = true;
    this.notifyListeners('online');
    
    // Notify service worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'ONLINE' });
    }
  }

  handleOffline() {
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  handleSWMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'request-queued':
        this.notifyListeners('request-queued', data);
        break;
      case 'request-synced':
        this.notifyListeners('request-synced', data);
        break;
      case 'request-failed':
        this.notifyListeners('request-failed', data);
        break;
    }
  }

  // Add listener for sync events
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }

  // Force sync queued requests
  async forcSync() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'FORCE_SYNC' });
    }
  }

  // Get queued requests count
  async getQueuedRequestsCount() {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) {
        resolve(0);
        return;
      }

      const request = indexedDB.open('offline-requests', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction(['requests'], 'readonly');
        const store = tx.objectStore('requests');
        const countRequest = store.count();
        
        countRequest.onsuccess = () => {
          resolve(countRequest.result);
        };
        
        countRequest.onerror = () => {
          resolve(0);
        };
      };
      
      request.onerror = () => {
        resolve(0);
      };
    });
  }

  // Clear all queued requests
  async clearQueue() {
    return new Promise((resolve) => {
      const request = indexedDB.open('offline-requests', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction(['requests'], 'readwrite');
        const store = tx.objectStore('requests');
        
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve(true);
        clearRequest.onerror = () => resolve(false);
      };
      
      request.onerror = () => resolve(false);
    });
  }
}

export default new SyncService();