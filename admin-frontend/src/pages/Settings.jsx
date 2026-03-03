// src/pages/Settings.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HiSave, HiUserCircle, HiShieldCheck, HiBell, HiLockClosed } from 'react-icons/hi';

const Settings = () => {
  const { admin } = useAuth();
  const [settings, setSettings] = useState({
    siteName: 'Elderly Community',
    siteDescription: 'Connecting seniors through technology',
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true,
    contentModeration: 'auto'
  });

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <HiShieldCheck className="w-5 h-5 text-blue-600" />
              <span>General Settings</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Description
                </label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <HiLockClosed className="w-5 h-5 text-blue-600" />
              <span>System Settings</span>
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-gray-500">Take the site offline for maintenance</p>
                </div>
                <button
                  onClick={() => handleToggle('maintenanceMode')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow New Registrations</p>
                  <p className="text-sm text-gray-500">Allow new users to register</p>
                </div>
                <button
                  onClick={() => handleToggle('allowRegistrations')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.allowRegistrations ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.allowRegistrations ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Moderation
                </label>
                <select
                  value={settings.contentModeration}
                  onChange={(e) => setSettings({...settings, contentModeration: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="auto">Automatic Moderation</option>
                  <option value="manual">Manual Review</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Admin Profile */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <HiUserCircle className="w-5 h-5 text-blue-600" />
              <span>Admin Profile</span>
            </h2>
            <div className="text-center mb-4">
              <img
                src={admin?.profileImage || 'https://via.placeholder.com/100'}
                alt={admin?.fullName}
                className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
              />
              <p className="font-semibold text-lg">{admin?.fullName}</p>
              <p className="text-sm text-gray-500 capitalize">{admin?.role?.replace('_', ' ')}</p>
              <p className="text-sm text-gray-500 mt-1">{admin?.email}</p>
            </div>
            <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
              Edit Profile
            </button>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <HiBell className="w-5 h-5 text-blue-600" />
              <span>Notifications</span>
            </h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleToggle('emailNotifications')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">Email Notifications</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={true}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">Report Alerts</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={false}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">New User Registrations</span>
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow p-6 border-2 border-red-200">
            <h2 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
                Clear All Caches
              </button>
              <button className="w-full px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 rounded-lg transition">
                Purge Old Data
              </button>
              <button className="w-full px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 rounded-lg transition">
                Export All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center space-x-2"
        >
          <HiSave className="w-5 h-5" />
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;