import React, { useState } from 'react';
import { ArrowLeft, FileText, Download, AlertCircle } from 'lucide-react';

const GST = () => {
  const [gstData, setGstData] = useState({
    gstin: '',
    period: '',
    reportType: 'GSTR-1'
  });
  const [reports, setReports] = useState([
    { id: 1, type: 'GSTR-1', period: '2024-01', status: 'Filed', amount: 25000 },
    { id: 2, type: 'GSTR-3B', period: '2024-01', status: 'Pending', amount: 18000 }
  ]);

  const generateReport = () => {
    const newReport = {
      id: Date.now(),
      type: gstData.reportType,
      period: gstData.period,
      status: 'Generated',
      amount: Math.floor(Math.random() * 50000) + 10000
    };
    setReports([newReport, ...reports]);
    alert(`${gstData.reportType} report generated for ${gstData.period}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <button 
            onClick={() => window.history.back()} 
            className="p-2 hover:bg-gray-200 rounded-lg"
            title="Go back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">GST Compliance</h1>
        </div>

        {/* GST Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <FileText className="text-blue-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-600">Total GST Collected</p>
                <p className="text-2xl font-bold text-gray-900">₹1,25,000</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <AlertCircle className="text-orange-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-600">Pending Returns</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Download className="text-green-500 mr-3" size={24} />
              <div>
                <p className="text-sm text-gray-600">Filed This Month</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Report Form */}
        <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate GST Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="GSTIN Number"
              value={gstData.gstin}
              onChange={(e) => setGstData({...gstData, gstin: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            />
            <select
              value={gstData.reportType}
              onChange={(e) => setGstData({...gstData, reportType: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="GSTR-1">GSTR-1 (Outward Supplies)</option>
              <option value="GSTR-3B">GSTR-3B (Monthly Return)</option>
              <option value="GSTR-9">GSTR-9 (Annual Return)</option>
            </select>
            <input
              type="month"
              value={gstData.period}
              onChange={(e) => setGstData({...gstData, period: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            />
            <button
              onClick={generateReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              title="Generate GST report for selected period"
            >
              Generate Report
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">GST Reports</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map(report => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{report.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{report.period}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{report.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      report.status === 'Filed' ? 'bg-green-100 text-green-800' : 
                      report.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button 
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="Download report as PDF"
                    >
                      Download
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-800 text-sm"
                      title="File this return online"
                    >
                      File
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GST;