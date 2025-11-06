import React, { useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

const ConflictDialog = ({ conflict, onResolve, onClose }) => {
  const [resolution, setResolution] = useState('use_server');
  const [mergedData, setMergedData] = useState({});

  const handleResolve = () => {
    let resolvedData;
    
    switch (resolution) {
      case 'use_local':
        resolvedData = conflict.localData;
        break;
      case 'use_server':
        resolvedData = conflict.serverData;
        break;
      case 'merge':
        resolvedData = { ...conflict.serverData, ...mergedData };
        break;
      default:
        resolvedData = conflict.serverData;
    }
    
    onResolve(conflict.id, resolution, { table: conflict.table, resolvedData });
  };

  const renderDataComparison = () => {
    const fields = Object.keys({ ...conflict.localData, ...conflict.serverData });
    
    return fields.map(field => {
      const localValue = conflict.localData[field];
      const serverValue = conflict.serverData[field];
      const isDifferent = localValue !== serverValue;
      
      return (
        <div key={field} className={`p-2 rounded ${isDifferent ? 'bg-yellow-50' : 'bg-gray-50'}`}>
          <div className="font-medium text-sm text-gray-700 mb-1">{field}</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Local: </span>
              <span>{JSON.stringify(localValue)}</span>
            </div>
            <div>
              <span className="text-green-600 font-medium">Server: </span>
              <span>{JSON.stringify(serverValue)}</span>
            </div>
          </div>
          
          {resolution === 'merge' && isDifferent && (
            <div className="mt-2">
              <label className="block text-xs text-gray-600 mb-1">Merged value:</label>
              <input
                type="text"
                className="w-full px-2 py-1 text-xs border rounded"
                defaultValue={serverValue}
                onChange={(e) => setMergedData(prev => ({ ...prev, [field]: e.target.value }))}
              />
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Data Conflict Detected</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              A conflict was detected while syncing {conflict.table}. 
              The data has been modified both locally and on the server.
            </p>
          </div>
          
          <div className="space-y-3 mb-6">
            {renderDataComparison()}
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Choose resolution:</h3>
            
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="resolution"
                value="use_server"
                checked={resolution === 'use_server'}
                onChange={(e) => setResolution(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm">Use server version (recommended)</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="resolution"
                value="use_local"
                checked={resolution === 'use_local'}
                onChange={(e) => setResolution(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm">Use local version</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="resolution"
                value="merge"
                checked={resolution === 'merge'}
                onChange={(e) => setResolution(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm">Merge manually</span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>Resolve Conflict</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictDialog;