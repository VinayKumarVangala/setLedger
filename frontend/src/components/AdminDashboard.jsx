import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import adminService from '../services/adminService';
import { 
  AlertTriangle, Info, AlertCircle, Bug, Server, 
  Trash2, RefreshCw, Download, Filter, Search 
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [crashes, setCrashes] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('logs');
  
  const [filters, setFilters] = useState({
    level: 'all',
    search: '',
    startDate: '',
    endDate: '',
    limit: 50,
    offset: 0
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes, healthRes] = await Promise.all([
        adminService.getLogs(filters),
        adminService.getLogStats(),
        adminService.getSystemHealth()
      ]);
      
      setLogs(logsRes.data.logs || []);
      setStats(statsRes.data);
      setHealth(healthRes.data);
      
      if (activeTab === 'crashes') {
        const crashesRes = await adminService.getCrashReports(filters);
        setCrashes(crashesRes.data.crashes || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async (level = 'all') => {
    if (!confirm(`Clear ${level} logs? This cannot be undone.`)) return;
    
    try {
      await adminService.clearLogs(level);
      fetchData();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const handleTestError = async (level) => {
    try {
      await adminService.testError(`Test ${level} from admin dashboard`, level);
      setTimeout(fetchData, 1000); // Refresh after test
    } catch (error) {
      console.error('Failed to test error:', error);
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warn': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      case 'debug': return <Bug className="h-4 w-4 text-gray-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'bg-red-50 text-red-800 border-red-200';
      case 'warn': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'debug': return 'bg-gray-50 text-gray-800 border-gray-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">Admin privileges required</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Server className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System logs and monitoring</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Info className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{stats.byLevel.error || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.byLevel.warn || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-green-600">
                  {health ? Math.floor(health.uptime / 3600) : 0}h
                </p>
              </div>
              <Server className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['logs', 'crashes', 'health'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search logs..."
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleClearLogs(filters.level)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {activeTab === 'logs' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTestError('info')}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
                >
                  Test Info
                </button>
                <button
                  onClick={() => handleTestError('error')}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm"
                >
                  Test Error
                </button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getLevelColor(log.level)}`}>
                  <div className="flex items-start gap-3">
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.message}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {log.error && (
                        <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">
                          {log.error.stack}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'health' && health && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Memory Usage</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>RSS:</span>
                    <span>{(health.memory.rss / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heap Used:</span>
                    <span>{(health.memory.heapUsed / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heap Total:</span>
                    <span>{(health.memory.heapTotal / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">System Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Node Version:</span>
                    <span>{health.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Environment:</span>
                    <span>{health.environment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span>{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;