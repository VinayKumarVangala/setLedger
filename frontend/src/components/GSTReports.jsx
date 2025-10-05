import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import gstService from '../services/gstService';
import { FileText, Download, Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const GSTReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchReports();
  }, [user?.orgId, user?.memberId]);

  const fetchReports = async () => {
    if (!user?.orgId || !user?.memberId) return;
    
    try {
      setLoading(true);
      const response = await gstService.getReports(user.orgId, user.memberId);
      setReports(response.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    try {
      setGenerating(reportType);
      
      let response;
      if (reportType === 'GSTR1') {
        response = await gstService.generateGSTR1(
          user.orgId, 
          user.memberId, 
          selectedPeriod.month, 
          selectedPeriod.year
        );
      } else if (reportType === 'GSTR3B') {
        response = await gstService.generateGSTR3B(
          user.orgId, 
          user.memberId, 
          selectedPeriod.month, 
          selectedPeriod.year
        );
      }
      
      if (response.success) {
        await fetchReports();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = async (reportId, format = 'pdf') => {
    try {
      await gstService.downloadReport(reportId, format);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GST Reports</h1>
          <p className="text-gray-600">Generate and manage GST compliance reports</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedPeriod.month}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, month: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedPeriod.year}
              onChange={(e) => setSelectedPeriod(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => generateReport('GSTR1')}
            disabled={generating === 'GSTR1'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {generating === 'GSTR1' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Generate GSTR-1
          </button>
          
          <button
            onClick={() => generateReport('GSTR3B')}
            disabled={generating === 'GSTR3B'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {generating === 'GSTR3B' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Generate GSTR-3B
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Generated Reports</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600 mt-2">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reports generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{report.reportType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {months[report.period.month - 1]} {report.period.year}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {report.status === 'filed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className={`capitalize ${
                          report.status === 'filed' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>
                        <div>Invoices: {report.summary?.totalInvoices || 0}</div>
                        <div>Value: ₹{(report.summary?.totalTaxableValue || 0).toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadReport(report._id, 'pdf')}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </button>
                        <button
                          onClick={() => downloadReport(report._id, 'json')}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          <Download className="h-3 w-3" />
                          JSON
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GSTReports;