import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const JournalEntry = ({ onClose, onSave }) => {
  const [accounts, setAccounts] = useState([]);
  const [entry, setEntry] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    entries: [
      { accountID: '', accountName: '', debit: '', credit: '', description: '' },
      { accountID: '', accountName: '', debit: '', credit: '', description: '' }
    ]
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/v1/accounting/accounts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const addEntry = () => {
    setEntry(prev => ({
      ...prev,
      entries: [...prev.entries, { accountID: '', accountName: '', debit: '', credit: '', description: '' }]
    }));
  };

  const removeEntry = (index) => {
    if (entry.entries.length > 2) {
      setEntry(prev => ({
        ...prev,
        entries: prev.entries.filter((_, i) => i !== index)
      }));
    }
  };

  const updateEntry = (index, field, value) => {
    setEntry(prev => ({
      ...prev,
      entries: prev.entries.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          
          // Auto-fill account name when account is selected
          if (field === 'accountID') {
            const account = accounts.find(acc => acc.accountID === value);
            updated.accountName = account ? account.name : '';
          }
          
          // Clear opposite field when entering debit/credit
          if (field === 'debit' && value) updated.credit = '';
          if (field === 'credit' && value) updated.debit = '';
          
          return updated;
        }
        return item;
      })
    }));
  };

  const calculateTotals = () => {
    const totalDebit = entry.entries.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);
    const totalCredit = entry.entries.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0);
    return { totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { totalDebit, totalCredit, balanced } = calculateTotals();
    
    if (!balanced) {
      toast.error('Journal entry must be balanced (debits = credits)');
      return;
    }
    
    if (totalDebit === 0) {
      toast.error('Journal entry must have at least one debit and credit');
      return;
    }

    try {
      const response = await fetch('/api/v1/accounting/journal-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(entry)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Journal entry created successfully');
        onSave?.(data.data);
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to create journal entry');
    }
  };

  const { totalDebit, totalCredit, balanced } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create Journal Entry</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              value={entry.date}
              onChange={(e) => setEntry(prev => ({ ...prev, date: e.target.value }))}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={entry.description}
              onChange={(e) => setEntry(prev => ({ ...prev, description: e.target.value }))}
              className="border rounded px-3 py-2"
              required
            />
          </div>

          {/* Entries */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Account</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Debit</th>
                  <th className="px-4 py-2 text-right">Credit</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {entry.entries.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">
                      <select
                        value={item.accountID}
                        onChange={(e) => updateEntry(index, 'accountID', e.target.value)}
                        className="w-full border rounded px-2 py-1"
                        required
                      >
                        <option value="">Select Account</option>
                        {accounts.map(account => (
                          <option key={account.accountID} value={account.accountID}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Entry description"
                        value={item.description}
                        onChange={(e) => updateEntry(index, 'description', e.target.value)}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.debit}
                        onChange={(e) => updateEntry(index, 'debit', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.credit}
                        onChange={(e) => updateEntry(index, 'credit', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeEntry(index)}
                        disabled={entry.entries.length <= 2}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="2" className="px-4 py-2 font-semibold">Totals:</td>
                  <td className="px-4 py-2 text-right font-semibold">₹{totalDebit.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-semibold">₹{totalCredit.toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-sm ${balanced ? 'text-green-600' : 'text-red-600'}`}>
                      {balanced ? '✓ Balanced' : '✗ Unbalanced'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={addEntry}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Add Entry
            </button>
            
            <div className="space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!balanced}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Create Entry
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JournalEntry;