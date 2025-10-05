import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PlayIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const SecurityDashboard = () => {
  const [securityStatus, setSecurityStatus] = useState(null);
  const [auditResults, setAuditResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const response = await api.get('/security/status');
      setSecurityStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch security status:', error);
    }
  };

  const runSecurityAudit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/security/audit');
      setAuditResults(response.data);
    } catch (error) {
      console.error('Security audit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAuthTest = async () => {
    setLoading(true);
    try {
      const response = await api.post('/security/test-auth', {
        baseURL: window.location.origin + '/api/v1'
      });
      setTestResults(response.data);
    } catch (error) {
      console.error('Authentication test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await api.get('/security/report');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const getStatusColor = (status) => {
    if (status === true || status === 'GOOD') return 'text-green-600';
    if (status === 'WARNING') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor and audit application security</p>
        </div>
        
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runAuthTest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <PlayIcon className="h-4 w-4" />
            Test Auth
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runSecurityAudit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            {loading ? 'Running...' : 'Run Audit'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadReport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download Report
          </motion.button>
        </div>
      </div>

      {/* Security Status */}
      {securityStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Security Configuration</h4>
              <div className="space-y-2">
                {Object.entries(securityStatus.security).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(value)}`}>
                      {value ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Monitoring</h4>
              <div className="space-y-2">
                {Object.entries(securityStatus.monitoring).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(value)}`}>
                      {value ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Compliance</h4>
              <div className="space-y-2">
                {Object.entries(securityStatus.compliance).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(value)}`}>
                      {value ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Audit Results */}
      {auditResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">OWASP Audit Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{auditResults.summary.owaspScore}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">OWASP Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{auditResults.summary.totalVulnerabilities}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Vulnerabilities</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(auditResults.summary.environmentStatus)}`}>
                {auditResults.summary.environmentStatus}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Environment Status</div>
            </div>
          </div>

          {auditResults.owasp.vulnerabilities.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Vulnerabilities Found</h4>
              <div className="space-y-2">
                {auditResults.owasp.vulnerabilities.map((vuln, index) => (
                  <div key={index} className={`p-3 rounded-lg ${getSeverityColor(vuln.severity)}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{vuln.issue}</div>
                        <div className="text-sm opacity-75">{vuln.description}</div>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded">
                        {vuln.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {auditResults.summary.recommendations.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Recommendations</h4>
              <ul className="space-y-1">
                {auditResults.summary.recommendations.slice(0, 5).map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Authentication Test Results */}
      {testResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Authentication Test Results</h3>
          
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{testResults.summary.passed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{testResults.summary.failed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testResults.summary.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
          </div>

          <div className="space-y-2">
            {testResults.tests.map((test, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                test.status === 'PASS' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{test.name}</span>
                  <span className="text-sm">{test.status === 'PASS' ? '✓' : '✗'}</span>
                </div>
                <div className="text-sm opacity-75">{test.message}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SecurityDashboard;