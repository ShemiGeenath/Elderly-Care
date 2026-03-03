import React, { useState, useEffect } from 'react';
import {
  HiUsers,
  HiDocumentText,
  HiChatAlt2,
  HiExclamationCircle,
  HiUserGroup,
  HiTrendingUp
} from 'react-icons/hi';
import axios from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/admin/dashboard/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: HiUsers,
      color: 'bg-blue-500',
      change: stats?.newUsersToday || 0,
      changeLabel: 'new today'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: HiUserGroup,
      color: 'bg-green-500',
      change: Math.round((stats?.activeUsers / stats?.totalUsers) * 100) || 0,
      changeLabel: '% active'
    },
    {
      title: 'Total Posts',
      value: stats?.totalPosts || 0,
      icon: HiDocumentText,
      color: 'bg-purple-500',
      change: stats?.newPostsToday || 0,
      changeLabel: 'new today'
    },
    {
      title: 'Total Comments',
      value: stats?.totalComments || 0,
      icon: HiChatAlt2,
      color: 'bg-yellow-500',
      change: '+15%',
      changeLabel: 'vs last month'
    },
    {
      title: 'Pending Reports',
      value: stats?.pendingReports || 0,
      icon: HiExclamationCircle,
      color: 'bg-red-500',
      change: 'urgent',
      changeLabel: 'needs attention'
    },
    {
      title: 'Engagement Rate',
      value: '78%',
      icon: HiTrendingUp,
      color: 'bg-indigo-500',
      change: '+5%',
      changeLabel: 'vs last week'
    }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-700">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </span>
            </div>
            <h3 className="text-gray-600 font-medium mb-2">{stat.title}</h3>
            <div className="flex items-center text-sm">
              <span className="text-green-600 font-medium">+{stat.change}</span>
              <span className="text-gray-500 ml-1">{stat.changeLabel}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">User Growth (Last 7 Days)</h2>
          <div className="space-y-4">
            {stats?.userGrowth?.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-600">
                  {day._id?.day}/{day._id?.month}/{day._id?.year}
                </span>
                <div className="flex items-center space-x-4 flex-1 ml-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(day.count / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                    {day.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Popular Posts */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Popular Posts</h2>
          <div className="space-y-4">
            {stats?.popularPosts?.map((post) => (
              <div key={post._id} className="p-4 hover:bg-gray-50 rounded-lg border">
                <div className="flex items-start space-x-3">
                  <img
                    src={post.user?.profilePhoto || 'https://via.placeholder.com/40'}
                    alt={post.user?.firstName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {post.user?.firstName} {post.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {post.content}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>❤️ {post.likes?.length || 0}</span>
                      <span>💬 {post.comments?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;