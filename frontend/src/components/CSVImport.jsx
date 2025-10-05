import React, { useState } from 'react';
import { toast } from 'react-toastify';

const CSVImport = ({ onClose, onImport }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResults(null);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch('/api/v1/accounting/import-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.data);
        toast.success(data.message);
        onImport?.(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `date,description,debitAccountCode,debitAccount,debitAccountType,debitAmount,creditAccountCode,creditAccount,creditAccountType,creditAmount
2024-01-01,Sample Transaction,1000,Cash,asset,1000.00,4000,Sales Revenue,revenue,1000.00`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'journal_entry_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Import Transactions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold mb-2">CSV Format</h3>
            <p className="text-sm text-gray-600 mb-3">
              Download the template to see the required format for importing transactions.
            </p>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Download Template
            </button>
          </div>

          {/* File Upload */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Upload CSV File</h3>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full border rounded px-3 py-2"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Results */}
          {results && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Import Results</h3>
              <div className="space-y-2">
                <p className="text-green-600">✓ Successfully imported: {results.success} transactions</p>
                {results.errors.length > 0 && (
                  <div>
                    <p className="text-red-600">✗ Errors: {results.errors.length}</p>
                    <div className="max-h-32 overflow-y-auto bg-red-50 p-2 rounded text-sm">
                      {results.errors.map((error, index) => (
                        <div key={index} className="text-red-700">{error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImport;