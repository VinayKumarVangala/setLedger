import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import JournalEntry from '../components/JournalEntry';
import CSVImport from '../components/CSVImport';

const Accounting = () => {
  const [activeTab, setActiveTab] = useState('journal');
  const [journalEntries, setJournalEntries] = useState([]);
  const [trialBalance, setTrialBalance] = useState(null);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'journal') {
      fetchJournalEntries();
    } else if (activeTab === 'trial') {
      fetchTrialBalance();
    }
  }, [activeTab]);

  const fetchJournalEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/accounting/journal-entries', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setJournalEntries(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/accounting/trial-balance', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setTrialBalance(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch trial balance');
    } finally {
      setLoading(false);
    }
  };

  const handleJournalSaved = () => {
    fetchJournalEntries();
  };

  const handleImportComplete = () => {
    if (activeTab === 'journal') {
      fetchJournalEntries();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCSVImport(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowJournalForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            New Entry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'journal', name: 'Journal Entries' },
            { id: 'trial', name: 'Trial Balance' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Journal Entries Tab */}
          {activeTab === 'journal' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Entry #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Debit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Credit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {journalEntries.map((entry) => (
                      <tr key={entry.entryID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.entryNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entry.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ₹{entry.totalDebit.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ₹{entry.totalCredit.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.reference?.type} {entry.reference?.number}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {journalEntries.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No journal entries found
                </div>
              )}
            </div>
          )}

          {/* Trial Balance Tab */}
          {activeTab === 'trial' && trialBalance && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Account Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Account Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Debit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trialBalance.accounts.map((account, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {account.accountCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {account.accountName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {account.accountType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {account.debit > 0 ? `₹${account.debit.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {account.credit > 0 ? `₹${account.credit.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-sm font-bold text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                        ₹{trialBalance.totals.debits.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                        ₹{trialBalance.totals.credits.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="5" className="px-6 py-2 text-center">
                        <span className={`text-sm font-medium ${
                          trialBalance.totals.balanced ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trialBalance.totals.balanced ? '✓ Trial Balance is Balanced' : '✗ Trial Balance is NOT Balanced'}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showJournalForm && (
        <JournalEntry
          onClose={() => setShowJournalForm(false)}
          onSave={handleJournalSaved}
        />
      )}

      {showCSVImport && (
        <CSVImport
          onClose={() => setShowCSVImport(false)}
          onImport={handleImportComplete}
        />
      )}
    </div>
  );
};

export default Accounting;