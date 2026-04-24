// admin-frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  MessageCircle, 
  AlertTriangle, 
  Heart, 
  Activity,
  Clock,
  Server,
  Database,
  Bell,
  ChevronDown,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Zap,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Edit2,
  UserPlus,
  UserMinus,
  Plus,
  Save,
  Filter,
  Search,
  MoreVertical,
  Shield,
  ShieldOff,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [chatAnalytics, setChatAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [nlpStatus, setNlpStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logType, setLogType] = useState('all');
  const [error, setError] = useState(null);

  // CRUD States
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    emergencyContact: '',
    emergencyPhone: '',
    hobbies: [],
    helpNeeded: [],
    mobility: 'independent',
    isActive: true
  });
  const [postFormData, setPostFormData] = useState({
    content: '',
    privacy: 'public',
    tags: []
  });

 const API_BASE_URL = 'https://elderly-care-3ibt.onrender.com/api';

  // Fetch all data - Modified to skip test endpoint
  const fetchAllData = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      console.log("Attempting to connect to backend at:", API_BASE_URL);
      
      // Define all endpoints
      const endpoints = [
        { name: 'stats', url: `${API_BASE_URL}/admin-data/stats`, setter: setStats, transform: (data) => data.stats },
        { name: 'users', url: `${API_BASE_URL}/admin-data/users`, setter: setUsers, transform: (data) => data.users },
        { name: 'posts', url: `${API_BASE_URL}/admin-data/posts`, setter: setPosts, transform: (data) => data.posts },
        { name: 'sos', url: `${API_BASE_URL}/admin-data/sos`, setter: setSosAlerts, transform: (data) => data.alerts },
        { name: 'helpRequests', url: `${API_BASE_URL}/admin-data/help-requests`, setter: setHelpRequests, transform: (data) => data.requests },
        { name: 'chatAnalytics', url: `${API_BASE_URL}/admin-data/chat-analytics`, setter: setChatAnalytics, transform: (data) => data },
        { name: 'nlpStatus', url: `${API_BASE_URL}/admin-data/nlp-status`, setter: setNlpStatus, transform: (data) => data.nlp },
        { name: 'logs', url: `${API_BASE_URL}/admin-data/logs?type=${logType}&lines=100`, setter: setLogs, transform: (data) => data.logs }
      ];

      // Fetch all endpoints with individual error handling
      const fetchPromises = endpoints.map(async (endpoint) => {
        try {
          console.log(`Fetching ${endpoint.name} from:`, endpoint.url);
          const response = await fetch(endpoint.url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            console.warn(`Endpoint ${endpoint.name} returned status ${response.status}`);
            return null;
          }
          
          const data = await response.json();
          console.log(`${endpoint.name} data received:`, data);
          
          if (data.success && endpoint.setter) {
            endpoint.setter(endpoint.transform(data));
          } else {
            console.warn(`${endpoint.name} returned success=false:`, data.message);
          }
          return data;
        } catch (error) {
          console.error(`Error fetching ${endpoint.name}:`, error);
          return null;
        }
      });

      await Promise.all(fetchPromises);
      
      // Check if we got any data at all
      const hasData = stats || users || posts || sosAlerts || helpRequests;
      if (!hasData) {
        throw new Error('Unable to fetch any data from the backend. Please check if the backend server is running and the endpoints are correct.');
      }

      console.log("All data fetched successfully");

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to connect to the server. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [logType]);

  // ============= USER CRUD OPERATIONS =============

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/elderly/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userFormData,
          password: 'default123',
          acceptTerms: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('User created successfully!');
        setShowUserModal(false);
        resetUserForm();
        fetchAllData();
      } else {
        alert('Error creating user: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  // Update User
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/elderly/profile/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('User updated successfully!');
        setShowUserModal(false);
        setEditingUser(null);
        resetUserForm();
        fetchAllData();
      } else {
        alert('Error updating user: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/elderly/profile/${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        alert('User deleted successfully!');
        setShowDeleteConfirm(null);
        fetchAllData();
      } else {
        alert('Error deleting user: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  // Toggle User Status
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/elderly/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchAllData();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    }
  };

  // ============= POST CRUD OPERATIONS =============

  // Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/elderly/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postFormData)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Post created successfully!');
        setShowPostModal(false);
        resetPostForm();
        fetchAllData();
      } else {
        alert('Error creating post: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    }
  };

  // Update Post
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editingPost) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/elderly/posts/${editingPost._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postFormData)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Post updated successfully!');
        setShowPostModal(false);
        setEditingPost(null);
        resetPostForm();
        fetchAllData();
      } else {
        alert('Error updating post: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/elderly/posts/${postId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Post deleted successfully!');
        setShowDeleteConfirm(null);
        fetchAllData();
      } else {
        alert('Error deleting post: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  // Toggle Post Privacy
  const handleTogglePostPrivacy = async (postId, currentPrivacy) => {
    const newPrivacy = currentPrivacy === 'public' ? 'private' : 'public';
    try {
      const response = await fetch(`${API_BASE_URL}/elderly/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacy: newPrivacy })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Post is now ${newPrivacy}!`);
        fetchAllData();
      }
    } catch (error) {
      console.error('Error toggling post privacy:', error);
      alert('Failed to update post privacy');
    }
  };

  // Helper functions
  const resetUserForm = () => {
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      emergencyContact: '',
      emergencyPhone: '',
      hobbies: [],
      helpNeeded: [],
      mobility: 'independent',
      isActive: true
    });
  };

  const resetPostForm = () => {
    setPostFormData({
      content: '',
      privacy: 'public',
      tags: []
    });
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      city: user.city || '',
      state: user.state || '',
      emergencyContact: user.emergencyContact || '',
      emergencyPhone: user.emergencyPhone || '',
      hobbies: user.hobbies || [],
      helpNeeded: user.helpNeeded || [],
      mobility: user.mobility || 'independent',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setShowUserModal(true);
  };

  const openEditPost = (post) => {
    setEditingPost(post);
    setPostFormData({
      content: post.content || '',
      privacy: post.privacy || 'public',
      tags: post.tags || []
    });
    setShowPostModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter users based on search
  const filteredUsers = users?.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter posts based on search
  const filteredPosts = posts?.filter(post => 
    post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          <p className="text-sm text-gray-400 mt-2">Connecting to backend at {API_BASE_URL}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800 font-medium mb-2">Troubleshooting tips:</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Make sure backend server is running on port 5000</li>
              <li>• Check if MongoDB is connected</li>
              <li>• Verify all API endpoints are implemented</li>
              <li>• Check browser console for more details</li>
            </ul>
          </div>
          <button 
            onClick={fetchAllData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ElderCare Admin</h1>
                <p className="text-sm text-gray-500">System Monitoring Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                <div className={`h-2 w-2 rounded-full ${nlpStatus?.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">NLP: {nlpStatus?.status || 'unknown'}</span>
              </div>
              <button 
                onClick={fetchAllData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={refreshing}
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-t border-gray-200">
          <nav className="flex space-x-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'posts', label: 'Posts', icon: FileText },
              { id: 'chats', label: 'Chats', icon: MessageCircle },
              { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
              { id: 'logs', label: 'System Logs', icon: Clock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-6">
        {/* Global Search Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'users' ? 'users' : activeTab === 'posts' ? 'posts' : '...'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            {activeTab === 'users' && (
              <button
                onClick={() => {
                  resetUserForm();
                  setEditingUser(null);
                  setShowUserModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                <span>Add User</span>
              </button>
            )}
            {activeTab === 'posts' && (
              <button
                onClick={() => {
                  resetPostForm();
                  setEditingPost(null);
                  setShowPostModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Create Post</span>
              </button>
            )}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.users?.total || 0}</p>
                    <p className="text-sm text-green-600 mt-2">+{stats.users?.today || 0} today</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.users?.active || 0}</p>
                    <p className="text-sm text-gray-500 mt-2">Last 7 days</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Posts</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.content?.posts || 0}</p>
                    <p className="text-sm text-blue-600 mt-2">+{stats.content?.postsToday || 0} today</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Emergency Alerts</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.emergency?.sos || 0}</p>
                    <p className="text-sm text-red-600 mt-2">Active: {sosAlerts?.filter(a => a.status === 'active').length || 0}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and System Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Messages per Day Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages per Day (Last 7 Days)</h3>
                <div className="h-64 flex items-end space-x-2">
                  {chatAnalytics?.messages?.perDay?.map((day, index) => {
                    const maxCount = Math.max(...(chatAnalytics?.messages?.perDay?.map(d => d.count) || [1]), 1);
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                          style={{ height: `${Math.max(4, (day.count / maxCount) * 200)}px` }}
                        ></div>
                        <span className="text-xs text-gray-600 mt-2">{day.date}</span>
                        <span className="text-xs font-medium">{day.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* System Info */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Node Version</span>
                    <span className="text-sm font-medium text-gray-900">{stats.system?.nodeVersion || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Platform</span>
                    <span className="text-sm font-medium text-gray-900">{stats.system?.platform || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((stats.system?.memory?.heapUsed || 0) / 1024 / 1024)} MB / {Math.round((stats.system?.memory?.heapTotal || 0) / 1024 / 1024)} MB
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((stats.system?.uptime || 0) / 60 / 60)} hours
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">CPU Cores</span>
                    <span className="text-sm font-medium text-gray-900">{stats.system?.cpuCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Free Memory</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((stats.system?.freeMemory || 0) / 1024 / 1024 / 1024)} GB / {Math.round((stats.system?.totalMemory || 0) / 1024 / 1024 / 1024)} GB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {users?.slice(0, 5).map(user => (
                    <div key={user._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt={user.firstName} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(user.createdAt).split(',')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent SOS Alerts */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent SOS Alerts</h3>
                <div className="space-y-3">
                  {sosAlerts?.slice(0, 5).map(alert => (
                    <div key={alert._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {alert.user?.firstName} {alert.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{alert.message || 'SOS Alert'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab with CRUD */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
                  <p className="text-sm text-gray-500 mt-1">Total: {filteredUsers?.length || 0} users</p>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emergency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers?.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.profilePhoto ? (
                            <img src={user.profilePhoto} alt={user.firstName} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.phone && (
                          <div className="text-sm text-gray-900 flex items-center">
                            <Phone className="h-4 w-4 mr-1 text-gray-400" />
                            {user.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.city && user.state && (
                          <div className="text-sm text-gray-900 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            {user.city}, {user.state}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.emergencyContact && (
                          <div className="text-sm text-gray-900">{user.emergencyContact}</div>
                        )}
                        {user.emergencyPhone && (
                          <div className="text-sm text-gray-500">{user.emergencyPhone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditUser(user)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                            title="Edit User"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                            className={`p-2 hover:bg-${user.isActive ? 'red' : 'green'}-100 rounded-lg transition-colors ${
                              user.isActive ? 'text-red-600' : 'text-green-600'
                            }`}
                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                          >
                            {user.isActive ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Posts Tab with CRUD */}
        {activeTab === 'posts' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Posts</h2>
              <p className="text-sm text-gray-500 mt-1">Total: {filteredPosts?.length || 0} posts</p>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredPosts?.map(post => (
                <div key={post._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    {post.user?.profilePhoto ? (
                      <img src={post.user.profilePhoto} alt={post.user.firstName} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">
                            {post.user?.firstName} {post.user?.lastName}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            post.privacy === 'public' ? 'bg-green-100 text-green-800' : 
                            post.privacy === 'friends' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {post.privacy}
                          </span>
                          <button
                            onClick={() => handleTogglePostPrivacy(post._id, post.privacy)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Toggle Privacy"
                          >
                            {post.privacy === 'public' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => openEditPost(post)}
                            className="p-1 hover:bg-blue-100 rounded text-blue-600"
                            title="Edit Post"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Delete Post"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-700">{post.content}</p>
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likes?.length || 0} likes
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.comments?.length || 0} comments
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === 'chats' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chat Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Chats</p>
                <p className="text-2xl font-bold text-gray-900">{chatAnalytics?.chats?.total || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Active Chats</p>
                <p className="text-2xl font-bold text-gray-900">{chatAnalytics?.chats?.active || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{chatAnalytics?.messages?.total || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Tab */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">SOS Alerts</h2>
                <p className="text-sm text-gray-500 mt-1">Total: {sosAlerts?.length || 0} alerts</p>
              </div>
              <div className="divide-y divide-gray-200">
                {sosAlerts?.map(alert => (
                  <div key={alert._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {alert.user?.firstName} {alert.user?.lastName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                              {alert.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.message || 'SOS Alert triggered'}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {alert.user?.emergencyPhone || 'No emergency contact'}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(alert.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">System Logs</h2>
                  <p className="text-sm text-gray-500 mt-1">Last 100 entries</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Logs</option>
                    <option value="error">Error Logs</option>
                    <option value="combined">Combined Logs</option>
                    <option value="access">Access Logs</option>
                  </select>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 font-mono text-sm">
              <div className="bg-gray-900 rounded-lg p-4 text-gray-300 overflow-x-auto max-h-96 overflow-y-auto">
                {logs?.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} className={`py-1 ${
                      log.type === 'error' ? 'text-red-400' : 
                      log.type === 'access' ? 'text-green-400' : 
                      'text-gray-300'
                    }`}>
                      <span className="text-gray-500 mr-2">[{index + 1}]</span>
                      {log.message}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-4">No logs available</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* User Modal (Create/Edit) */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
            </div>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={userFormData.firstName}
                    onChange={(e) => setUserFormData({...userFormData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={userFormData.lastName}
                    onChange={(e) => setUserFormData({...userFormData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={userFormData.phone}
                  onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={userFormData.city}
                    onChange={(e) => setUserFormData({...userFormData, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={userFormData.state}
                    onChange={(e) => setUserFormData({...userFormData, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  value={userFormData.emergencyContact}
                  onChange={(e) => setUserFormData({...userFormData, emergencyContact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                <input
                  type="tel"
                  value={userFormData.emergencyPhone}
                  onChange={(e) => setUserFormData({...userFormData, emergencyPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobility</label>
                <select
                  value={userFormData.mobility}
                  onChange={(e) => setUserFormData({...userFormData, mobility: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="independent">Independent</option>
                  <option value="walker">Uses Walker</option>
                  <option value="wheelchair">Wheelchair</option>
                  <option value="bedridden">Bedridden</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    resetUserForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Modal (Create/Edit) */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </h2>
            </div>
            <form onSubmit={editingPost ? handleUpdatePost : handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  required
                  rows="4"
                  value={postFormData.content}
                  onChange={(e) => setPostFormData({...postFormData, content: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write your post content here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
                <select
                  value={postFormData.privacy}
                  onChange={(e) => setPostFormData({...postFormData, privacy: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={postFormData.tags.join(', ')}
                  onChange={(e) => setPostFormData({
                    ...postFormData, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="elderly, care, community"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPostModal(false);
                    setEditingPost(null);
                    resetPostForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;