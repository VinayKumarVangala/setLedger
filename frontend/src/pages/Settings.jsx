import React, { useState } from 'react';
import { ArrowLeft, Shield, Users, Database, Bell } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('security');
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    autoBackup: true,
    backupFrequency: 'daily'
  });

  const [teamMembers] = useState([
    { id: 1, name: 'John Doe', email: 'john@company.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'Accountant', status: 'Active' }
  ]);

  const tabs = [
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'team', name: 'Team Management', icon: Users },
    { id: 'backup', name: 'Backup & Sync', icon: Database },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

  const enable2FA = () => {
    setSettings({...settings, twoFactorEnabled: true});
    alert('2FA setup initiated. Please scan QR code with your authenticator app.');
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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        <div className="flex space-x-8">
          {/* Sidebar */}
          <div className="w-64">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                      activeTab === tab.id 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'security' && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <button
                      onClick={enable2FA}
                      className={`px-4 py-2 rounded-lg ${
                        settings.twoFactorEnabled 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      title={settings.twoFactorEnabled ? '2FA is enabled' : 'Enable 2FA for better security'}
                    >
                      {settings.twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
                    </button>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-4">Password Requirements</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Minimum 8 characters</li>
                      <li>• At least one uppercase letter</li>
                      <li>• At least one number</li>
                      <li>• At least one special character</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Team Management</h2>
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    title="Invite new team member"
                  >
                    Invite Member
                  </button>
                </div>

                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teamMembers.map(member => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{member.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{member.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button 
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              title="Edit member permissions"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h2 className="text-xl font-semibold mb-6">Backup & Sync</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Automatic Backup</h3>
                      <p className="text-sm text-gray-600">Automatically backup your data to cloud storage</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoBackup}
                        onChange={(e) => setSettings({...settings, autoBackup: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                    <select
                      value={settings.backupFrequency}
                      onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                      className="px-3 py-2 border rounded-lg"
                    >
                      <option value="hourly">Every Hour</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-4">Manual Actions</h3>
                    <div className="space-x-4">
                      <button 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        title="Create backup now"
                      >
                        Backup Now
                      </button>
                      <button 
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        title="Restore from backup"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive important updates via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-4">Notification Types</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-3" />
                        <span>Low stock alerts</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-3" />
                        <span>GST filing reminders</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-3" />
                        <span>Payment due notifications</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;