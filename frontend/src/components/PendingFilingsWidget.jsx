import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import taxReminderService from '../services/taxReminderService';
import { AlertTriangle, Clock, CheckCircle, Calendar, Bell } from 'lucide-react';

const PendingFilingsWidget = () => {
  const { user } = useAuth();
  const [pendingFilings, setPendingFilings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingFilings();
  }, [user?.orgId, user?.memberId]);

  const fetchPendingFilings = async () => {
    if (!user?.orgId || !user?.memberId) return;
    
    try {
      setLoading(true);
      const response = await taxReminderService.getPendingFilings(user.orgId, user.memberId);
      setPendingFilings(response.data || []);
    } catch (error) {
      console.error('Error fetching pending filings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'urgent':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <Calendar className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'urgent':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const formatDaysLeft = (daysLeft) => {
    if (daysLeft < 0) {
      return `${Math.abs(daysLeft)} days overdue`;
    } else if (daysLeft === 0) {
      return 'Due today';
    } else {
      return `${daysLeft} days left`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Pending Tax Filings</h3>
        <Bell className="h-5 w-5 text-gray-400" />
      </div>

      {pendingFilings.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">All filings are up to date!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingFilings.slice(0, 5).map((filing, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getStatusColor(filing.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(filing.status)}
                  <div>
                    <p className="font-medium text-sm">{filing.description}</p>
                    <p className="text-xs opacity-75">
                      Due: {new Date(filing.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium">
                    {formatDaysLeft(filing.daysLeft)}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    filing.priority === 'high' 
                      ? 'bg-red-100 text-red-800'
                      : filing.priority === 'medium'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {filing.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {pendingFilings.length > 5 && (
            <div className="text-center pt-2">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View all {pendingFilings.length} pending filings
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <button
          onClick={fetchPendingFilings}
          className="w-full text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Last updated: {new Date().toLocaleTimeString()}
        </button>
      </div>
    </div>
  );
};

export default PendingFilingsWidget;