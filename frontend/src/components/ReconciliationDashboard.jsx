import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Filter } from 'lucide-react';
import { api } from '../services/api';
import ConflictResolutionModal from './ConflictResolutionModal';
import toast from 'react-hot-toast';

const ReconciliationDashboard = () => {
  const [conflicts, setConflicts] = useState([]);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending',
    severity: '',
    entityType: ''
  });

  useEffect(() => {
    loadConflicts();
  }, [filters]);

  const loadConflicts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/conflicts', { params: filters });
      setConflicts(response.data.data);
    } catch (error) {
      toast.error('Failed to load conflicts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveConflict = async (conflictId, resolution) => {
    try {
      await api.post(`/conflicts/${conflictId}/resolve`, resolution);
      loadConflicts();
    } catch (error) {
      throw error;
    }
  };

  const handleAutoResolve = async () => {
    try {
      const response = await api.post('/conflicts/auto-resolve');
      toast.success(`Auto-resolved ${response.data.data.resolvedCount} conflicts`);
      loadConflicts();
    } catch (error) {
      toast.error('Auto-resolve failed');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const pendingCount = conflicts.filter(c => c.status === 'pending').length;
  const criticalCount = conflicts.filter(c => c.severity === 'CRITICAL').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Reconciliation</h1>
            <p className="text-gray-600">Resolve sync conflicts and data inconsistencies</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadConflicts}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            {pendingCount > 0 && (
              <button
                onClick={handleAutoResolve}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Auto-Resolve Low Priority
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
                <div className="text-sm text-gray-600">Pending Conflicts</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                <div className="text-sm text-gray-600">Critical Issues</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {conflicts.filter(c => c.status === 'resolved').length}
                </div>
                <div className="text-sm text-gray-600">Resolved Today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
            
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Severity</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            
            <select
              value={filters.entityType}
              onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              <option value="PRODUCT">Products</option>
              <option value="INVOICE">Invoices</option>
              <option value="STOCK">Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Conflicts ({conflicts.length})</h2>
        </div>
        
        <div className="divide-y">
          {conflicts.map((conflict) => (
            <div key={conflict.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(conflict.status)}
                  
                  <div>
                    <div className="font-medium">
                      {conflict.entityType} Conflict - {conflict.type}
                    </div>
                    <div className="text-sm text-gray-600">
                      Entity ID: {conflict.entityId} • 
                      Created: {new Date(conflict.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(conflict.severity)}`}>
                    {conflict.severity}
                  </span>
                  
                  {conflict.status === 'pending' && (
                    <button
                      onClick={() => setSelectedConflict(conflict)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {conflicts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No conflicts found</p>
              <p className="text-sm">All data is synchronized</p>
            </div>
          )}
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      {selectedConflict && (
        <ConflictResolutionModal
          conflict={selectedConflict}
          onResolve={handleResolveConflict}
          onClose={() => setSelectedConflict(null)}
        />
      )}
    </div>
  );
};

export default ReconciliationDashboard;