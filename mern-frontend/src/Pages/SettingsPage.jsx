// frontend/src/Pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
  Eye,
  Globe,
  Moon,
  Sun,
  Lock,
  Mail,
  Phone,
  MapPin,
  Heart,
  Users,
  HelpCircle,
  LogOut,
  Trash2,
  Save,
  Camera,
  X,
  Check,
  AlertTriangle,
  Loader,
  Key,
  Smartphone,
  Clock,
  Languages,
  Volume2,
  Vibrate,
  MessageCircle,
  BookOpen,
  Award,
  Star
} from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContact: '',
    emergencyPhone: '',
    bio: '',
    hobbies: [],
    helpNeeded: [],
    mobility: 'independent'
  });

  const [privacyForm, setPrivacyForm] = useState({
    profileVisibility: 'public',
    showEmail: 'friends',
    showPhone: 'friends',
    showLocation: 'public',
    showBirthday: 'friends',
    showHobbies: 'public',
    allowFriendRequests: true,
    allowMessages: 'everyone',
    allowTags: true,
    allowComments: true,
    showOnlineStatus: true,
    showLastSeen: true
  });

  const [notificationForm, setNotificationForm] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    friendRequests: true,
    messages: true,
    postLikes: true,
    postComments: true,
    helpRequests: true,
    itemExchange: true,
    friendUpdates: true,
    mentionNotifications: true,
    dailyDigest: false,
    weeklyDigest: true,
    notificationSound: true,
    notificationVibrate: true,
    quietHours: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  });

  const [securityForm, setSecurityForm] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30',
    activeSessions: []
  });

  const [preferencesForm, setPreferencesForm] = useState({
    theme: 'dark',
    language: 'en',
    fontSize: 'medium',
    reduceAnimations: false,
    highContrast: false,
    fontSize: 'medium',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    showEmoji: true,
    compactMode: false,
    sidebarCollapsed: false
  });

  const [hobbyInput, setHobbyInput] = useState('');
  const [helpInput, setHelpInput] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('elderlyToken');
    const userData = localStorage.getItem('elderlyUser');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setCurrentUser(parsedUser);
      fetchUserSettings(parsedUser.id);
    } catch (err) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchUserSettings = async (userId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/elderly/profile/${userId}`);
      if (response.data.success) {
        const user = response.data.user;
        
        // Load saved settings from localStorage or use defaults
        const savedSettings = JSON.parse(localStorage.getItem(`settings_${userId}`) || '{}');
        
        setProfileForm({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
          address: user.address || '',
          city: user.city || '',
          state: user.state || '',
          zipCode: user.zipCode || '',
          emergencyContact: user.emergencyContact || '',
          emergencyPhone: user.emergencyPhone || '',
          bio: user.bio || '',
          hobbies: user.hobbies || [],
          helpNeeded: user.helpNeeded || [],
          mobility: user.mobility || 'independent'
        });

        setPrivacyForm(savedSettings.privacy || privacyForm);
        setNotificationForm(savedSettings.notifications || notificationForm);
        setSecurityForm(savedSettings.security || securityForm);
        setPreferencesForm(savedSettings.preferences || preferencesForm);
      }
    } catch (err) {
      console.error('Error fetching user settings:', err);
      setErrorMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveAllSettings = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      
      const settings = {
        privacy: privacyForm,
        notifications: notificationForm,
        security: securityForm,
        preferences: preferencesForm
      };

      // Save to localStorage
      localStorage.setItem(`settings_${currentUser.id}`, JSON.stringify(settings));

      // Update profile if changed
      if (profileForm.firstName !== currentUser.firstName ||
          profileForm.lastName !== currentUser.lastName ||
          profileForm.phone !== currentUser.phone ||
          profileForm.bio !== currentUser.bio ||
          profileForm.city !== currentUser.city ||
          profileForm.state !== currentUser.state ||
          profileForm.hobbies !== currentUser.hobbies ||
          profileForm.helpNeeded !== currentUser.helpNeeded ||
          profileForm.mobility !== currentUser.mobility) {
        
        const response = await axiosInstance.put(`/elderly/profile/${currentUser.id}`, profileForm);
        if (response.data.success) {
          // Update local storage user data
          const updatedUser = { ...currentUser, ...profileForm };
          localStorage.setItem('elderlyUser', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        }
      }

      // Apply theme preference
      if (preferencesForm.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setErrorMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddHobby = () => {
    if (hobbyInput.trim() && !profileForm.hobbies.includes(hobbyInput.trim())) {
      setProfileForm({
        ...profileForm,
        hobbies: [...profileForm.hobbies, hobbyInput.trim()]
      });
      setHobbyInput('');
    }
  };

  const handleRemoveHobby = (hobby) => {
    setProfileForm({
      ...profileForm,
      hobbies: profileForm.hobbies.filter(h => h !== hobby)
    });
  };

  const handleAddHelp = () => {
    if (helpInput.trim() && !profileForm.helpNeeded.includes(helpInput.trim())) {
      setProfileForm({
        ...profileForm,
        helpNeeded: [...profileForm.helpNeeded, helpInput.trim()]
      });
      setHelpInput('');
    }
  };

  const handleRemoveHelp = (help) => {
    setProfileForm({
      ...profileForm,
      helpNeeded: profileForm.helpNeeded.filter(h => h !== help)
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await axiosInstance.delete(`/elderly/profile/${currentUser.id}`);
        localStorage.clear();
        navigate('/register');
      } catch (err) {
        console.error('Error deleting account:', err);
        setErrorMessage('Failed to delete account');
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'account', label: 'Account', icon: Lock }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex h-screen">
        <Sidebar user={currentUser} onLogout={handleLogout} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar user={currentUser} />
          
          <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <button
                  onClick={saveAllSettings}
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>

              {/* Success/Error Messages */}
              {successMessage && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  {successMessage}
                </div>
              )}
              
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  {errorMessage}
                </div>
              )}

              {/* Settings Tabs */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-cyan-500 text-cyan-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-5 w-5 mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* Profile Settings */}
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <img
                            src={currentUser?.profilePhoto || '/default-avatar.png'}
                            alt="Profile"
                            className="h-24 w-24 rounded-full object-cover border-4 border-cyan-500"
                          />
                          <button className="absolute bottom-0 right-0 p-2 bg-cyan-500 rounded-full text-white hover:bg-cyan-600">
                            <Camera className="h-4 w-4" />
                          </button>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {profileForm.firstName} {profileForm.lastName}
                          </h2>
                          <p className="text-gray-500">{profileForm.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Birth Date
                          </label>
                          <input
                            type="date"
                            value={profileForm.birthDate}
                            onChange={(e) => setProfileForm({...profileForm, birthDate: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mobility Status
                          </label>
                          <select
                            value={profileForm.mobility}
                            onChange={(e) => setProfileForm({...profileForm, mobility: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          >
                            <option value="independent">Independent</option>
                            <option value="limited">Limited Mobility</option>
                            <option value="wheelchair">Wheelchair User</option>
                            <option value="bedridden">Bedridden</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            value={profileForm.state}
                            onChange={(e) => setProfileForm({...profileForm, state: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zip Code
                          </label>
                          <input
                            type="text"
                            value={profileForm.zipCode}
                            onChange={(e) => setProfileForm({...profileForm, zipCode: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                          rows="4"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="Tell us a little about yourself..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hobbies & Interests
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {profileForm.hobbies.map((hobby, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm flex items-center"
                            >
                              {hobby}
                              <button
                                onClick={() => handleRemoveHobby(hobby)}
                                className="ml-2 text-cyan-700 hover:text-cyan-900"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={hobbyInput}
                            onChange={(e) => setHobbyInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddHobby()}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Add a hobby..."
                          />
                          <button
                            onClick={handleAddHobby}
                            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Help Needed
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {profileForm.helpNeeded.map((help, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center"
                            >
                              {help}
                              <button
                                onClick={() => handleRemoveHelp(help)}
                                className="ml-2 text-orange-700 hover:text-orange-900"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={helpInput}
                            onChange={(e) => setHelpInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddHelp()}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="What help do you need?"
                          />
                          <button
                            onClick={handleAddHelp}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Emergency Contact Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.emergencyContact}
                            onChange={(e) => setProfileForm({...profileForm, emergencyContact: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Emergency Contact Phone
                          </label>
                          <input
                            type="tel"
                            value={profileForm.emergencyPhone}
                            onChange={(e) => setProfileForm({...profileForm, emergencyPhone: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Privacy Settings */}
                  {activeTab === 'privacy' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Visibility</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Profile Visibility
                            </label>
                            <select
                              value={privacyForm.profileVisibility}
                              onChange={(e) => setPrivacyForm({...privacyForm, profileVisibility: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="public">Public - Everyone can see</option>
                              <option value="friends">Friends Only</option>
                              <option value="private">Private - Only me</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Visibility
                            </label>
                            <select
                              value={privacyForm.showEmail}
                              onChange={(e) => setPrivacyForm({...privacyForm, showEmail: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="public">Public</option>
                              <option value="friends">Friends Only</option>
                              <option value="private">Private</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Visibility
                            </label>
                            <select
                              value={privacyForm.showPhone}
                              onChange={(e) => setPrivacyForm({...privacyForm, showPhone: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="public">Public</option>
                              <option value="friends">Friends Only</option>
                              <option value="private">Private</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Location Visibility
                            </label>
                            <select
                              value={privacyForm.showLocation}
                              onChange={(e) => setPrivacyForm({...privacyForm, showLocation: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="public">Public</option>
                              <option value="friends">Friends Only</option>
                              <option value="private">Private</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Birthday Visibility
                            </label>
                            <select
                              value={privacyForm.showBirthday}
                              onChange={(e) => setPrivacyForm({...privacyForm, showBirthday: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="public">Public</option>
                              <option value="friends">Friends Only</option>
                              <option value="private">Private</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Hobbies & Interests Visibility
                            </label>
                            <select
                              value={privacyForm.showHobbies}
                              onChange={(e) => setPrivacyForm({...privacyForm, showHobbies: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="public">Public</option>
                              <option value="friends">Friends Only</option>
                              <option value="private">Private</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Interaction Settings</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Allow Friend Requests</span>
                            <button
                              onClick={() => setPrivacyForm({...privacyForm, allowFriendRequests: !privacyForm.allowFriendRequests})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                privacyForm.allowFriendRequests ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  privacyForm.allowFriendRequests ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Who can message you
                            </label>
                            <select
                              value={privacyForm.allowMessages}
                              onChange={(e) => setPrivacyForm({...privacyForm, allowMessages: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="everyone">Everyone</option>
                              <option value="friends">Friends Only</option>
                              <option value="none">No one</option>
                            </select>
                          </div>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Allow others to tag you</span>
                            <button
                              onClick={() => setPrivacyForm({...privacyForm, allowTags: !privacyForm.allowTags})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                privacyForm.allowTags ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  privacyForm.allowTags ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Allow comments on your posts</span>
                            <button
                              onClick={() => setPrivacyForm({...privacyForm, allowComments: !privacyForm.allowComments})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                privacyForm.allowComments ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  privacyForm.allowComments ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Show online status</span>
                            <button
                              onClick={() => setPrivacyForm({...privacyForm, showOnlineStatus: !privacyForm.showOnlineStatus})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                privacyForm.showOnlineStatus ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  privacyForm.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Show last seen</span>
                            <button
                              onClick={() => setPrivacyForm({...privacyForm, showLastSeen: !privacyForm.showLastSeen})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                privacyForm.showLastSeen ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  privacyForm.showLastSeen ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notification Settings */}
                  {activeTab === 'notifications' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Methods</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Email Notifications</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, emailNotifications: !notificationForm.emailNotifications})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.emailNotifications ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Push Notifications</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, pushNotifications: !notificationForm.pushNotifications})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.pushNotifications ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">SMS Notifications</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, smsNotifications: !notificationForm.smsNotifications})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.smsNotifications ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">What to Notify</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Friend Requests</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, friendRequests: !notificationForm.friendRequests})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.friendRequests ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.friendRequests ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Messages</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, messages: !notificationForm.messages})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.messages ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.messages ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Post Likes</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, postLikes: !notificationForm.postLikes})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.postLikes ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.postLikes ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Post Comments</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, postComments: !notificationForm.postComments})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.postComments ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.postComments ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Help Requests</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, helpRequests: !notificationForm.helpRequests})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.helpRequests ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.helpRequests ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Item Exchange Updates</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, itemExchange: !notificationForm.itemExchange})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.itemExchange ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.itemExchange ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Mentions</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, mentionNotifications: !notificationForm.mentionNotifications})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.mentionNotifications ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.mentionNotifications ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Notification Sound</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, notificationSound: !notificationForm.notificationSound})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.notificationSound ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.notificationSound ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Vibrate</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, notificationVibrate: !notificationForm.notificationVibrate})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.notificationVibrate ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.notificationVibrate ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Daily Digest</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, dailyDigest: !notificationForm.dailyDigest})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.dailyDigest ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.dailyDigest ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Weekly Digest</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, weeklyDigest: !notificationForm.weeklyDigest})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.weeklyDigest ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Quiet Hours</span>
                            <button
                              onClick={() => setNotificationForm({...notificationForm, quietHours: !notificationForm.quietHours})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                notificationForm.quietHours ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  notificationForm.quietHours ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          {notificationForm.quietHours && (
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                                <input
                                  type="time"
                                  value={notificationForm.quietHoursStart}
                                  onChange={(e) => setNotificationForm({...notificationForm, quietHoursStart: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">End Time</label>
                                <input
                                  type="time"
                                  value={notificationForm.quietHoursEnd}
                                  onChange={(e) => setNotificationForm({...notificationForm, quietHoursEnd: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security Settings */}
                  {activeTab === 'security' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Password & Authentication</h3>
                        <button className="flex items-center text-cyan-600 hover:text-cyan-700 mb-4">
                          <Key className="h-5 w-5 mr-2" />
                          Change Password
                        </button>

                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Two-Factor Authentication</span>
                            <button
                              onClick={() => setSecurityForm({...securityForm, twoFactorAuth: !securityForm.twoFactorAuth})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                securityForm.twoFactorAuth ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  securityForm.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Login Alerts</span>
                            <button
                              onClick={() => setSecurityForm({...securityForm, loginAlerts: !securityForm.loginAlerts})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                securityForm.loginAlerts ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  securityForm.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Management</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Session Timeout (minutes)
                            </label>
                            <select
                              value={securityForm.sessionTimeout}
                              onChange={(e) => setSecurityForm({...securityForm, sessionTimeout: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="15">15 minutes</option>
                              <option value="30">30 minutes</option>
                              <option value="60">1 hour</option>
                              <option value="120">2 hours</option>
                              <option value="240">4 hours</option>
                            </select>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-3">Active Sessions</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Smartphone className="h-5 w-5 text-gray-400 mr-3" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Current Session</p>
                                    <p className="text-xs text-gray-500">Chrome on Windows • Now</p>
                                  </div>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  Current
                                </span>
                              </div>
                            </div>
                            <button className="mt-3 text-sm text-red-600 hover:text-red-700">
                              Sign out all other sessions
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preferences Settings */}
                  {activeTab === 'preferences' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Theme
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                              <button
                                onClick={() => setPreferencesForm({...preferencesForm, theme: 'light'})}
                                className={`p-3 border rounded-lg flex flex-col items-center ${
                                  preferencesForm.theme === 'light' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200'
                                }`}
                              >
                                <Sun className="h-6 w-6 mb-1" />
                                <span className="text-sm">Light</span>
                              </button>
                              <button
                                onClick={() => setPreferencesForm({...preferencesForm, theme: 'dark'})}
                                className={`p-3 border rounded-lg flex flex-col items-center ${
                                  preferencesForm.theme === 'dark' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200'
                                }`}
                              >
                                <Moon className="h-6 w-6 mb-1" />
                                <span className="text-sm">Dark</span>
                              </button>
                              <button
                                onClick={() => setPreferencesForm({...preferencesForm, theme: 'system'})}
                                className={`p-3 border rounded-lg flex flex-col items-center ${
                                  preferencesForm.theme === 'system' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200'
                                }`}
                              >
                                <Smartphone className="h-6 w-6 mb-1" />
                                <span className="text-sm">System</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Language
                            </label>
                            <select
                              value={preferencesForm.language}
                              onChange={(e) => setPreferencesForm({...preferencesForm, language: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="en">English</option>
                              <option value="es">Español</option>
                              <option value="fr">Français</option>
                              <option value="de">Deutsch</option>
                              <option value="zh">中文</option>
                              <option value="hi">हिन्दी</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Font Size
                            </label>
                            <select
                              value={preferencesForm.fontSize}
                              onChange={(e) => setPreferencesForm({...preferencesForm, fontSize: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                              <option value="xlarge">Extra Large</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Date Format
                            </label>
                            <select
                              value={preferencesForm.dateFormat}
                              onChange={(e) => setPreferencesForm({...preferencesForm, dateFormat: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Time Format
                            </label>
                            <select
                              value={preferencesForm.timeFormat}
                              onChange={(e) => setPreferencesForm({...preferencesForm, timeFormat: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                              <option value="12h">12-hour (AM/PM)</option>
                              <option value="24h">24-hour</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Accessibility</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Reduce Animations</span>
                            <button
                              onClick={() => setPreferencesForm({...preferencesForm, reduceAnimations: !preferencesForm.reduceAnimations})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                preferencesForm.reduceAnimations ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  preferencesForm.reduceAnimations ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">High Contrast</span>
                            <button
                              onClick={() => setPreferencesForm({...preferencesForm, highContrast: !preferencesForm.highContrast})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                preferencesForm.highContrast ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  preferencesForm.highContrast ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Display Options</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Show Emoji Picker</span>
                            <button
                              onClick={() => setPreferencesForm({...preferencesForm, showEmoji: !preferencesForm.showEmoji})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                preferencesForm.showEmoji ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  preferencesForm.showEmoji ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Compact Mode</span>
                            <button
                              onClick={() => setPreferencesForm({...preferencesForm, compactMode: !preferencesForm.compactMode})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                preferencesForm.compactMode ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  preferencesForm.compactMode ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>

                          <label className="flex items-center justify-between">
                            <span className="text-gray-700">Collapse Sidebar</span>
                            <button
                              onClick={() => setPreferencesForm({...preferencesForm, sidebarCollapsed: !preferencesForm.sidebarCollapsed})}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                preferencesForm.sidebarCollapsed ? 'bg-cyan-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  preferencesForm.sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Account Settings */}
                  {activeTab === 'account' && (
                    <div className="space-y-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-yellow-800 mb-2 flex items-center">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          Danger Zone
                        </h3>
                        <p className="text-sm text-yellow-700 mb-4">
                          These actions are irreversible. Please proceed with caution.
                        </p>
                        
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 border border-yellow-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Deactivate Account</h4>
                                <p className="text-sm text-gray-500">
                                  Temporarily disable your account. You can reactivate it later.
                                </p>
                              </div>
                              <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                                Deactivate
                              </button>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4 border border-red-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Delete Account</h4>
                                <p className="text-sm text-gray-500">
                                  Permanently delete your account and all data.
                                </p>
                              </div>
                              <button
                                onClick={handleDeleteAccount}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              >
                                Delete Account
                              </button>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">Download Your Data</h4>
                                <p className="text-sm text-gray-500">
                                  Get a copy of all your data including posts, messages, and settings.
                                </p>
                              </div>
                              <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Member since:</span>
                            <span className="text-gray-900">
                              {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account status:</span>
                            <span className="text-green-600 font-medium">Active</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email verified:</span>
                            <span className="text-green-600">Yes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phone verified:</span>
                            <span className="text-yellow-600">No</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;