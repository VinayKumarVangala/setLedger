import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import cloudSyncService from '../services/cloudSyncService';
import { 
  Cloud, CloudOff, Download, Upload, RefreshCw, 
  Shield, AlertTriangle, CheckCircle, Loader2, Trash2 
} from 'lucide-react';

const CloudSyncSettings = () => {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState(null);

  useEffect(() => {
    fetchSyncStatus();
  }, [user?.orgId, user?.memberId]);

  const fetchSyncStatus = async () => {
    if (!user?.orgId || !user?.memberId) return;
    
    try {
      setLoading(true);
      const response = await cloudSyncService.getSyncStatus(user.orgId, user.memberId);
      setSyncStatus(response.data);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setOperation('sync');
      const response = await cloudSyncService.syncToCloud(user.orgId, user.memberId);
      
      if (response.success) {
        await fetchSyncStatus();
        alert('Data synced to cloud successfully!');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setOperation(null);
    }
  };

  const handleRestore = async () => {
    if (!confirm('This will overwrite your local data with cloud backup. Continue?')) {
      return;
    }
    
    try {
      setOperation('restore');
      const response = await cloudSyncService.restoreFromCloud(user.orgId, user.memberId);
      
      if (response.success) {
        await fetchSyncStatus();
        alert('Data restored from cloud successfully!');
        window.location.reload(); // Refresh to show restored data
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert('Restore failed. Please try again.');
    } finally {
      setOperation(null);
    }
  };

  const handleDeleteBackup = async () => {
    if (!confirm('This will permanently delete your cloud backup. Continue?')) {
      return;
    }
    
    try {
      setOperation('delete');
      await cloudSyncService.deleteBackup(user.orgId);
      await fetchSyncStatus();
      alert('Cloud backup deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed. Please try again.');
    } finally {
      setOperation(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const getStatusIcon = () => {
    if (!syncStatus) return <CloudOff className="h-5 w-5 text-gray-400" />;
    
    if (syncStatus.cloudBackupExists) {
      return syncStatus.isUpToDate 
        ? <CheckCircle className="h-5 w-5 text-green-600" />
        : <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
    
    return <CloudOff className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (!syncStatus) return 'Loading...';
    
    if (!syncStatus.cloudBackupExists) return 'No cloud backup';
    
    return syncStatus.isUpToDate 
      ? 'Up to date' 
      : 'Backup outdated';
  };

  if (loading && !syncStatus) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Cloud className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cloud Sync & Backup</h3>
          <p className="text-sm text-gray-600">Secure cloud storage with end-to-end encryption</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium text-gray-900">Backup Status</span>
            </div>
            <span className={`text-sm px-2 py-1 rounded-full ${
              syncStatus?.isUpToDate 
                ? 'bg-green-100 text-green-800'
                : syncStatus?.cloudBackupExists
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {getStatusText()}
            </span>
          </div>
          
          {syncStatus && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Last Sync:</span>
                <p className="font-medium">{formatDate(syncStatus.lastSync)}</p>
              </div>
              <div>
                <span className="text-gray-600">Synced By:</span>
                <p className="font-medium">{syncStatus.syncedBy || 'N/A'}</p>
              </div>
            </div>
          )}
          
          {syncStatus?.recordCount && (
            <div className="mt-3 pt-3 border-t">
              <span className="text-gray-600 text-sm">Records in backup:</span>
              <div className="flex gap-4 mt-1 text-xs">
                <span>Products: {syncStatus.recordCount.products}</span>
                <span>Invoices: {syncStatus.recordCount.invoices}</span>
                <span>Transactions: {syncStatus.recordCount.transactions}</span>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Data Security</h4>
              <p className="text-sm text-blue-700 mt-1">
                All sensitive data is encrypted before upload. Your encryption keys never leave your device.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleSync}
            disabled={operation === 'sync'}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {operation === 'sync' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Sync to Cloud
          </button>
          
          <button
            onClick={handleRestore}
            disabled={!syncStatus?.cloudBackupExists || operation === 'restore'}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {operation === 'restore' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Restore from Cloud
          </button>
          
          <button
            onClick={handleDeleteBackup}
            disabled={!syncStatus?.cloudBackupExists || operation === 'delete'}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {operation === 'delete' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete Backup
          </button>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center pt-4 border-t">
          <button
            onClick={fetchSyncStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloudSyncSettings;