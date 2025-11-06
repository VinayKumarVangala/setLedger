import { api } from './api';
import { dbService } from './db';

class QRSyncService {
  constructor() {
    this.wsConnection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  // Initialize WebSocket connection for real-time sync
  initializeWebSocket(orgUUID) {
    const wsUrl = `ws://localhost:5000/ws?org=${orgUUID}`;
    this.wsConnection = new WebSocket(wsUrl);
    
    this.wsConnection.onopen = () => {
      console.log('QR sync WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.wsConnection.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'QR_METADATA_UPDATE') {
        await this.handleRemoteQRUpdate(message);
      }
    };
    
    this.wsConnection.onclose = () => {
      console.log('QR sync WebSocket disconnected');
      this.attemptReconnect(orgUUID);
    };
    
    this.wsConnection.onerror = (error) => {
      console.error('QR sync WebSocket error:', error);
    };
  }
  
  attemptReconnect(orgUUID) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      
      setTimeout(() => {
        console.log(`Attempting QR sync reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.initializeWebSocket(orgUUID);
      }, delay);
    }
  }
  
  async handleRemoteQRUpdate(message) {
    const { productId, metadata } = message;
    
    try {
      // Update local IndexedDB
      await dbService.updateProduct(productId, metadata);
      
      // Trigger UI update
      window.dispatchEvent(new CustomEvent('qr-metadata-updated', {
        detail: { productId, metadata }
      }));
      
      console.log('QR metadata synced from remote:', productId);
    } catch (error) {
      console.error('Failed to handle remote QR update:', error);
    }
  }
  
  async updateQRMetadata(productId, metadata) {
    try {
      // Update server
      const response = await api.put(`/qr/metadata/${productId}`, metadata);
      
      // Update local IndexedDB
      await dbService.updateProduct(productId, metadata);
      
      return response.data;
    } catch (error) {
      // Store in outbox for retry
      await dbService.addToOutbox({
        type: 'QR_METADATA_UPDATE',
        productId,
        data: metadata,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  async getQRMetadata(productId) {
    try {
      // Try server first
      const response = await api.get(`/qr/metadata/${productId}`);
      return response.data.data;
    } catch (error) {
      // Fallback to local data
      const product = await dbService.getProduct(productId);
      return product;
    }
  }
  
  async getSyncHistory() {
    try {
      const response = await api.get('/qr/sync-history');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch sync history:', error);
      return [];
    }
  }
  
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }
}

export const qrSyncService = new QRSyncService();