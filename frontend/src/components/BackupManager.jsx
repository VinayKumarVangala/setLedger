import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { localBackupService } from '../services/localBackup';

const BackupManager = ({ onClose }) => {
  const [backupStatus, setBackupStatus] = useState(null);
  const [backups, setBackups] = useState({ firestore: [], local: [] });
  const [localBackups, setLocalBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchBackupStatus();
    fetchBackups();
    loadLocalBackups();
  }, []);

  const fetchBackupStatus = async () => {
    try {
      const response = await fetch('/api/v1/backup/status', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setBackupStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching backup status:', error);
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/v1/backup/list', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setBackups(data.data);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  const loadLocalBackups = () => {
    const local = localBackupService.getLocalBackups();
    setLocalBackups(local);
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/backup/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Backup created successfully');
        fetchBackups();
        fetchBackupStatus();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Backup creation failed');
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (source, backupId = null) => {
    if (!window.confirm('This will replace all current data. Are you sure?')) {
      return;
    }

    try {
      setRestoring(true);
      const response = await fetch('/api/v1/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ source, backupId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Data restored successfully (${data.data.recordsRestored} records)`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const restoreFromLocal = (backupIndex) => {
    if (!window.confirm('This will restore local data. Continue?')) {
      return;
    }

    try {
      const data = localBackupService.restoreFromLocal(backupIndex);
      // Here you would restore the data to your app state
      toast.success('Local data restored successfully');
    } catch (error) {
      toast.error('Local restore failed');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatSize = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Backup Manager</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Backup Status */}
        {backupStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Backup Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Last Firestore Backup:</span>
                <div className="font-medium">
                  {backupStatus.lastFirestoreBackup ? formatDate(backupStatus.lastFirestoreBackup) : 'Never'}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Last Local Backup:</span>
                <div className="font-medium">
                  {backupStatus.lastLocalBackup ? formatDate(backupStatus.lastLocalBackup) : 'Never'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={createBackup}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Backup'}
          </button>
        </div>

        {/* Backup Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cloud Backups */}
          <div>
            <h3 className="font-semibold mb-3">Cloud Backups (Firestore)</h3>
            <div className="border rounded-lg overflow-hidden">
              {backups.firestore.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No cloud backups found</div>
              ) : (
                <div className="divide-y">
                  {backups.firestore.map((backup) => (
                    <div key={backup.id} className="p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{formatDate(backup.timestamp)}</div>
                        <div className="text-sm text-gray-500">
                          {backup.chunks} chunks • {formatSize(backup.size)}
                        </div>
                      </div>
                      <button
                        onClick={() => restoreBackup('firestore', backup.id)}
                        disabled={restoring}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Local Backups */}
          <div>
            <h3 className="font-semibold mb-3">Local Backups (Browser)</h3>
            <div className="border rounded-lg overflow-hidden">
              {localBackups.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No local backups found</div>
              ) : (
                <div className="divide-y">
                  {localBackups.map((backup, index) => (
                    <div key={index} className="p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{formatDate(backup.timestamp)}</div>
                        <div className="text-sm text-gray-500">
                          {formatSize(backup.size)}
                        </div>
                      </div>
                      <button
                        onClick={() => restoreFromLocal(index)}
                        className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Server Backups */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Server Backups (Local Files)</h3>
          <div className="border rounded-lg overflow-hidden">
            {backups.local.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No server backups found</div>
            ) : (
              <div className="divide-y">
                {backups.local.map((backup) => (
                  <div key={backup.id} className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{backup.filename}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(backup.timestamp)} • {formatSize(backup.size)}
                      </div>
                    </div>
                    <button
                      onClick={() => restoreBackup('local', backup.id)}
                      disabled={restoring}
                      className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;