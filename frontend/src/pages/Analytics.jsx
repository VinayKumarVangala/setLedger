import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import FinancialChart from '../components/charts/FinancialChart';
import RevenueChart from '../components/charts/RevenueChart';
import ExpenseChart from '../components/charts/ExpenseChart';
import ProfitChart from '../components/charts/ProfitChart';
import analyticsService from '../services/analyticsService';
import { BarChart3, TrendingUp, Calendar, Download, RefreshCw } from 'lucide-react';

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const [data, setData] = useState({
    financial: [],
    revenue: [],
    expenses: [],
    profit: [],
    forecastData: [],
    expenseCategories: [],
    profitTargets: []
  });

  const fetchAnalyticsData = async () => {
    if (!user?.orgId || !user?.memberId) return;
    
    try {
      setLoading(true);
      const [
        financialData,
        revenueData,
        expenseData,
        profitData,
        forecastData,
        expenseCategories,
        profitTargets
      ] = await Promise.all([
        analyticsService.getFinancialData(user.orgId, user.memberId, { period: dateRange }),
        analyticsService.getRevenueData(user.orgId, user.memberId, dateRange),
        analyticsService.getExpenseData(user.orgId, user.memberId, dateRange),
        analyticsService.getProfitData(user.orgId, user.memberId, dateRange),
        analyticsService.getForecastData(user.orgId, user.memberId, 'all', 30),
        analyticsService.getExpenseCategories(user.orgId, user.memberId, dateRange),
        analyticsService.getProfitTargets(user.orgId, user.memberId)
      ]);

      setData({
        financial: financialData.data || [],
        revenue: revenueData.data || [],
        expenses: expenseData.data || [],
        profit: profitData.data || [],
        forecastData: forecastData.data || [],
        expenseCategories: expenseCategories.data || [],
        profitTargets: profitTargets.data || []
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user?.orgId, user?.memberId, dateRange]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: TrendingUp },
    { id: 'profit', label: 'Profit', icon: TrendingUp }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-gray-600">AI-powered insights and forecasting</p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialChart 
              data={data.financial} 
              forecastData={data.forecastData}
              loading={loading}
            />
            <div className="space-y-6">
              <RevenueChart 
                data={data.revenue} 
                forecastData={data.forecastData}
                loading={loading}
              />
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <RevenueChart 
            data={data.revenue} 
            forecastData={data.forecastData}
            loading={loading}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseChart 
            data={data.expenses} 
            categoryData={data.expenseCategories}
            loading={loading}
          />
        )}

        {activeTab === 'profit' && (
          <ProfitChart 
            data={data.profit} 
            forecastData={data.forecastData}
            targets={data.profitTargets}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default Analytics;