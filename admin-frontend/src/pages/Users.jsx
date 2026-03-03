import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiEye,
  HiXCircle,
  HiCheckCircle,
  HiSearch,
  HiFilter
} from 'react-icons/hi';
import axios from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [page, search, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { 
        page, 
        limit: 10, 
        search,
        status: statusFilter 
      };
      const response = await axios.get('/admin/users', { params });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        await axios.put(`/admin/users/${userId}/status`, {
          isActive: newStatus,
          reason: `Admin ${action}d user`
        });
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
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 w-full">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or location..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <HiFilter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user.profilePhoto || 'https://via.placeholder.com/40'}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">
                          {user.city || 'N/A'}, {user.state || 'N/A'}
                        </p>
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
                            {user.isActive !== false ? 
                              <HiXCircle className="w-5 h-5" /> : 
                              <HiCheckCircle className="w-5 h-5" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No users found
              </div>
            )}

            <Pagination
              page={page}
              total={total}
              limit={10}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Users;