import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate
} from 'react-router-dom';
import {
  HiHome,
  HiUsers,
  HiDocumentText,
  HiFlag,
  HiCog,
  HiLogout,
  HiSearch,
  HiEye,
  HiTrash,
  HiCheckCircle,
  HiXCircle,
  HiFilter,
  HiChartBar,
  HiUserCircle,
  HiCalendar,
  HiChatAlt2,
  HiExclamationCircle
} from 'react-icons/hi';

// Set axios base URL
axios.defaults.baseURL = 'http://localhost:5000/api';

// Auth Context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

function App() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (token && adminData) {
      setAdmin(JSON.parse(adminData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/admin/login', { email, password });
      const { token, admin } = response.data;
      
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminData', JSON.stringify(admin));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAdmin(admin);
      
      alert('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      alert(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    delete axios.defaults.headers.common['Authorization'];
    setAdmin(null);
    alert('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout }}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {!admin ? (
            <LoginPage />
          ) : (
            <div className="flex">
              <Sidebar />
              <main className="flex-1 ml-64">
                <Header />
                <div className="p-6">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/users/:id" element={<UserDetail />} />
                    <Route path="/posts" element={<Posts />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </div>
              </main>
            </div>
          )}
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

// Login Page Component
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (!result.success) {
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Elderly Community</h1>
          <p className="text-gray-600">Admin Panel Login</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="admin@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login to Dashboard'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Default credentials:</p>
          <p className="font-mono mt-1">admin@elderlycommunity.com / Admin@123</p>
        </div>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: HiHome, label: 'Dashboard' },
    { path: '/users', icon: HiUsers, label: 'Users' },
    { path: '/posts', icon: HiDocumentText, label: 'Posts' },
    { path: '/reports', icon: HiFlag, label: 'Reports' },
    { path: '/settings', icon: HiCog, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white fixed left-0 top-0 h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Elderly Community</h1>
        <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
      </div>
      
      <div className="px-4 py-2">
        <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
          <HiUserCircle className="w-10 h-10 text-gray-400" />
          <div>
            <p className="font-medium">{admin?.fullName || 'Admin'}</p>
            <p className="text-xs text-gray-400 capitalize">{admin?.role?.replace('_', ' ') || 'Administrator'}</p>
          </div>
        </div>
      </div>

      <nav className="mt-8">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center space-x-3 px-6 py-3 hover:bg-gray-800 transition-colors"
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 w-64 p-4">
        <button
          onClick={logout}
          className="flex items-center space-x-3 w-full px-6 py-3 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <HiLogout className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// Header Component
function Header() {
  const { admin } = useAuth();
  const [search, setSearch] = useState('');

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users, posts, reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

// Dashboard Component
function Dashboard() {
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
      alert('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: HiUsers,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Active Posts',
      value: stats?.totalPosts || 0,
      icon: HiDocumentText,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Total Comments',
      value: stats?.totalComments || 0,
      icon: HiChatAlt2,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: 'Pending Reports',
      value: stats?.pendingReports || 0,
      icon: HiExclamationCircle,
      color: 'bg-red-500',
      change: '+3%'
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-2">{stat.change} from last month</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
          <div className="space-y-4">
            {stats?.userGrowth?.slice(-5).map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{day._id?.day}/{day._id?.month}/{day._id?.year}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {day.count} new users
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Popular Posts</h2>
          <div className="space-y-4">
            {stats?.popularPosts?.slice(0, 3).map((post) => (
              <div key={post._id} className="p-3 hover:bg-gray-50 rounded-lg border">
                <div className="flex items-start space-x-3">
                  <img
                    src={post.user?.profilePhoto || 'https://via.placeholder.com/40'}
                    alt={post.user?.firstName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{post.user?.firstName} {post.user?.lastName}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{post.likes?.length || 0} likes</span>
                      <span>{post.comments?.length || 0} comments</span>
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
}

// Users Component
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10, search };
      const response = await axios.get('/admin/users', { params });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    if (window.confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this user?`)) {
      try {
        await axios.put(`/admin/users/${userId}/status`, {
          isActive: !isActive,
          reason: 'Admin action'
        });
        alert(`User ${isActive ? 'deactivated' : 'activated'} successfully`);
        fetchUsers();
      } catch (error) {
        alert('Failed to update user status');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <div className="text-sm text-gray-500">
          Total: {total} users
        </div>
      </div>

      <div className="bg-white rounded-xl shadow mb-6 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <HiFilter className="w-5 h-5" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.profilePhoto}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{user.city}, {user.state}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.isActive !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/users/${user._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <HiEye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(user._id, user.isActive !== false)}
                          className={`p-2 rounded-lg ${
                            user.isActive !== false 
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.isActive !== false ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive !== false ? <HiXCircle className="w-5 h-5" /> : <HiCheckCircle className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No users found
              </div>
            )}

            {total > 10 && (
              <div className="px-6 py-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} users
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1">
                      Page {page} of {Math.ceil(total / 10)}
                    </span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(total / 10)}
                      className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// User Detail Component
function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/users/${id}`);
      setUser(response.data.user);
    } catch (error) {
      alert('Failed to fetch user details');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/users')}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center space-x-2"
      >
        ← Back to Users
      </button>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Profile Header */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          <img
            src={user.coverPhoto || 'https://via.placeholder.com/1200x400'}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex items-end space-x-4">
              <img
                src={user.profilePhoto}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-24 h-24 rounded-full border-4 border-white"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-white/80">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Info */}
            <div className="md:col-span-2">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Birth Date</p>
                    <p className="font-medium">{user.birthDate || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">
                      {user.address && `${user.address}, `}
                      {user.city}, {user.state} {user.zipCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Emergency Contact</p>
                    <p className="font-medium">{user.emergencyContact || 'Not provided'}</p>
                  </div>
                </div>

                {user.bio && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-500 mb-2">Bio</p>
                    <p className="text-gray-700">{user.bio}</p>
                  </div>
                )}
              </div>

              {/* Interests & Skills */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Interests & Skills</h2>
                <div className="space-y-4">
                  {user.hobbies && user.hobbies.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Hobbies</p>
                      <div className="flex flex-wrap gap-2">
                        {user.hobbies.map((hobby, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {hobby}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {user.helpNeeded && user.helpNeeded.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Help Needed</p>
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
              </div>
            </div>

            {/* Stats & Actions */}
            <div>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Account Stats</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Friends</span>
                    <span className="font-semibold">{user.friends?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Posts</span>
                    <span className="font-semibold">{user.stats?.posts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-semibold">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.isActive !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => handleStatusChange(user._id, user.isActive !== false)}
                    className={`w-full px-4 py-2 rounded-lg font-medium ${
                      user.isActive !== false
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {user.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
                  </button>
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Posts */}
          {user.recentPosts && user.recentPosts.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Recent Posts</h2>
              <div className="space-y-4">
                {user.recentPosts.map((post) => (
                  <div key={post._id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <img
                        src={post.user?.profilePhoto}
                        alt={post.user?.firstName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{post.user?.firstName} {post.user?.lastName}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {post.postType}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-700">{post.content}</p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span>❤️ {post.likes?.length || 0} likes</span>
                          <span>💬 {post.comments?.length || 0} comments</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Posts Component
function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [page, search]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10, search };
      const response = await axios.get('/admin/posts', { params });
      setPosts(response.data.posts);
      setTotal(response.data.total);
    } catch (error) {
      alert('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await axios.delete(`/admin/posts/${postId}`, {
          data: { reason: 'Admin moderation' }
        });
        alert('Post deleted successfully');
        fetchPosts();
      } catch (error) {
        alert('Failed to delete post');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Post Management</h1>
        <div className="text-sm text-gray-500">
          Total: {total} posts
        </div>
      </div>

      <div className="bg-white rounded-xl shadow mb-6 p-4">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search posts by content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
            No posts found
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-xl shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.user?.profilePhoto}
                      alt={post.user?.firstName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{post.user?.firstName} {post.user?.lastName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      {post.postType}
                    </span>
                    <button
                      onClick={() => deletePost(post._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete Post"
                    >
                      <HiTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{post.content}</p>

                {post.media && post.media.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {post.media.slice(0, 4).map((media, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden">
                          <img
                            src={media.url}
                            alt="Post media"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {post.tags && post.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>❤️ {post.likes?.length || 0} likes</span>
                    <span>💬 {post.comments?.length || 0} comments</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {post.location}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {total > 10 && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} posts
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {page} of {Math.ceil(total / 10)}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / 10)}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reports Component
function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = { status: statusFilter || undefined };
      const response = await axios.get('/admin/reports', { params });
      setReports(response.data.reports);
    } catch (error) {
      alert('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status) => {
    const resolution = prompt('Enter resolution details:');
    if (resolution === null) return;

    try {
      await axios.put(`/admin/reports/${reportId}/status`, {
        status,
        resolution
      });
      alert(`Report marked as ${status}`);
      fetchReports();
    } catch (error) {
      alert('Failed to update report status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Report Management</h1>

      <div className="bg-white rounded-xl shadow mb-6 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg ${!statusFilter ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            All Reports
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-4 py-2 rounded-lg ${statusFilter === 'resolved' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
            No reports found
          </div>
        ) : (
          reports.map((report) => (
            <div key={report._id} className="bg-white rounded-xl shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={report.reporter?.profilePhoto}
                      alt={report.reporter?.firstName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{report.reporter?.firstName} {report.reporter?.lastName}</p>
                      <p className="text-sm text-gray-500">Reported {report.reportedItemType}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                    {report.status.toUpperCase()}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Reason</p>
                  <p className="font-medium">{report.reason}</p>
                </div>

                {report.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-700">{report.description}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Reported on {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateReportStatus(report._id, 'resolved')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => updateReportStatus(report._id, 'dismissed')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Settings Component
function Settings() {
  const { admin } = useAuth();
  const [settings, setSettings] = useState({
    siteName: 'Elderly Community',
    siteDescription: 'Connecting seniors through technology',
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true
  });

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">General Settings</h2>
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

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">System Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-gray-500">Take the site offline for maintenance</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
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
                  onClick={() => setSettings({...settings, allowRegistrations: !settings.allowRegistrations})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.allowRegistrations ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.allowRegistrations ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Admin Profile</h2>
            <div className="text-center mb-4">
              <HiUserCircle className="w-20 h-20 text-gray-400 mx-auto mb-3" />
              <p className="font-semibold">{admin?.fullName}</p>
              <p className="text-sm text-gray-500 capitalize">{admin?.role?.replace('_', ' ')}</p>
            </div>
            <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Edit Profile
            </button>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Danger Zone</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                Clear All Caches
              </button>
              <button className="w-full px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 rounded-lg">
                Purge Old Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
        >
          Save All Settings
        </button>
      </div>
    </div>
  );
}

// Helper hook for params
function useParams() {
  const match = window.location.pathname.match(/\/users\/([^\/]+)/);
  return { id: match ? match[1] : null };
}

export default App;