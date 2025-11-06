import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ConflictResolutionModal = ({ conflict, onResolve, onClose }) => {
  const [resolution, setResolution] = useState('USE_SERVER');
  const [mergedData, setMergedData] = useState({});
  const [isResolving, setIsResolving] = useState(false);

  if (!conflict) return null;

  const localData = JSON.parse(conflict.localData);
  const serverData = JSON.parse(conflict.serverData);

  const handleResolve = async () => {
    setIsResolving(true);
    
    try {
      const resolutionData = {
        action: resolution,
        reason: `User resolved ${conflict.type}`,
        ...(resolution === 'MANUAL_MERGE' && { mergedData })
      };
      
      await onResolve(conflict.id, resolutionData);
      toast.success('Conflict resolved successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to resolve conflict');
    } finally {
      setIsResolving(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderDataComparison = (field, localValue, serverValue) => {
    const isDifferent = localValue !== serverValue;
    
    return (
      <div key={field} className={`p-3 rounded-lg ${isDifferent ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
        <div className="text-sm font-medium text-gray-700 mb-2">{field}</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Local Value</div>
            <div className={`font-mono text-sm ${isDifferent ? 'text-red-700' : 'text-gray-700'}`}>
              {JSON.stringify(localValue)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Server Value</div>
            <div className={`font-mono text-sm ${isDifferent ? 'text-green-700' : 'text-gray-700'}`}>
              {JSON.stringify(serverValue)}
            </div>
          </div>
        </div>
        
        {resolution === 'MANUAL_MERGE' && isDifferent && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Merged Value</div>
            <input
              type="text"
              value={mergedData[field] || ''}
              onChange={(e) => setMergedData(prev => ({ ...prev, [field]: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              placeholder="Enter merged value"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-semibold">Resolve Data Conflict</h2>
                <p className="text-sm text-gray-600">
                  {conflict.entityType} • {conflict.type}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(conflict.severity)}`}>
                {conflict.severity}
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Data Comparison</h3>
            <div className="space-y-4">
              {Object.keys(localData).map(field => 
                renderDataComparison(field, localData[field], serverData[field])
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Resolution Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resolution"
                  value="USE_SERVER"
                  checked={resolution === 'USE_SERVER'}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">Use Server Data</div>
                  <div className="text-sm text-gray-600">
                    Accept the server version and discard local changes
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resolution"
                  value="USE_LOCAL"
                  checked={resolution === 'USE_LOCAL'}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">Use Local Data</div>
                  <div className="text-sm text-gray-600">
                    Keep local changes and overwrite server data
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="resolution"
                  value="MANUAL_MERGE"
                  checked={resolution === 'MANUAL_MERGE'}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">Manual Merge</div>
                  <div className="text-sm text-gray-600">
                    Manually combine values from both versions
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={isResolving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isResolving ? (
                'Resolving...'
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Resolve Conflict
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;