// src/pages/UserDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  HiArrowLeft, 
  HiMail, 
  HiPhone, 
  HiLocationMarker, 
  HiCalendar,
  HiHeart,
  HiChat,
  HiUserGroup,
  HiShieldCheck,
  HiShieldExclamation
} from 'react-icons/hi';
import axios from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/users/${id}`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      alert('Failed to fetch user details');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        await axios.put(`/admin/users/${user._id}/status`, {
          isActive: newStatus,
          reason: `Admin ${action}d user from detail page`
        });
        setUser({ ...user, isActive: newStatus });
        alert(`User ${action}d successfully`);
      } catch (error) {
        alert('Failed to update user status');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <button
          onClick={() => navigate('/users')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/users')}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center space-x-2"
      >
        <HiArrowLeft className="w-5 h-5" />
        <span>Back to Users</span>
      </button>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Profile Header */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          <img
            src={user.coverPhoto || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'}
            alt="Cover"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex items-end space-x-4">
              <img
                src={user.profilePhoto || 'https://via.placeholder.com/100'}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-24 h-24 rounded-full border-4 border-white object-cover"
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-white/80">{user.email}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleStatusChange}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    user.isActive !== false
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {user.isActive !== false ? 'Deactivate User' : 'Activate User'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activity
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - User Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium flex items-center space-x-1">
                        <HiMail className="w-4 h-4 text-gray-400" />
                        <span>{user.email}</span>
                      </p>
                    </div>
                    {user.phone && (
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium flex items-center space-x-1">
                          <HiPhone className="w-4 h-4 text-gray-400" />
                          <span>{user.phone}</span>
                        </p>
                      </div>
                    )}
                    {user.birthDate && (
                      <div>
                        <p className="text-sm text-gray-500">Birth Date</p>
                        <p className="font-medium flex items-center space-x-1">
                          <HiCalendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(user.birthDate).toLocaleDateString()}</span>
                        </p>
                      </div>
                    )}
                    {(user.city || user.state) && (
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium flex items-center space-x-1">
                          <HiLocationMarker className="w-4 h-4 text-gray-400" />
                          <span>{[user.city, user.state].filter(Boolean).join(', ')}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency Contact */}
                {(user.emergencyContact || user.emergencyPhone) && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Emergency Contact</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.emergencyContact && (
                        <div>
                          <p className="text-sm text-gray-500">Contact Name</p>
                          <p className="font-medium">{user.emergencyContact}</p>
                        </div>
                      )}
                      {user.emergencyPhone && (
                        <div>
                          <p className="text-sm text-gray-500">Contact Phone</p>
                          <p className="font-medium">{user.emergencyPhone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hobbies & Interests */}
                {user.hobbies && user.hobbies.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Hobbies & Interests</h2>
                    <div className="flex flex-wrap gap-2">
                      {user.hobbies.map((hobby, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Help Needed */}
                {user.helpNeeded && user.helpNeeded.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Help Needed</h2>
                    <div className="flex flex-wrap gap-2">
                      {user.helpNeeded.map((help, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {help}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Stats */}
              <div className="space-y-6">
                {/* Account Stats */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Account Statistics</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HiUserGroup className="w-5 h-5 text-blue-500" />
                        <span className="text-gray-600">Friends</span>
                      </div>
                      <span className="font-semibold">{user.friends?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HiHeart className="w-5 h-5 text-red-500" />
                        <span className="text-gray-600">Posts</span>
                      </div>
                      <span className="font-semibold">{user.stats?.posts || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HiChat className="w-5 h-5 text-green-500" />
                        <span className="text-gray-600">Comments</span>
                      </div>
                      <span className="font-semibold">{user.stats?.comments || 0}</span>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Member Since</span>
                        <span className="font-semibold">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Account Status</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {user.isActive !== false ? (
                          <HiShieldCheck className="w-5 h-5 text-green-500" />
                        ) : (
                          <HiShieldExclamation className="w-5 h-5 text-red-500" />
                        )}
                        <span className="text-gray-600">Status</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.isActive !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Active</span>
                      <span className="font-medium">
                        {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                      Send Message
                    </button>
                    <button className="w-full px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded-lg transition">
                      View Activity Log
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="text-center py-12 text-gray-500">
              <p>User posts will be displayed here</p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="text-center py-12 text-gray-500">
              <p>User activity log will be displayed here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetail;