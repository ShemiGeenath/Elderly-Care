import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiHome,
  HiUsers,
  HiDocumentText,
  HiFlag,
  HiCog,
  HiLogout,
  HiUserCircle
} from 'react-icons/hi';

const Sidebar = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: HiHome, label: 'Dashboard' },
    { path: '/users', icon: HiUsers, label: 'Users' },
    { path: '/posts', icon: HiDocumentText, label: 'Posts' },
    { path: '/reports', icon: HiFlag, label: 'Reports' },
    { path: '/settings', icon: HiCog, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-gray-900 text-white fixed left-0 top-0 h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Elderly Community</h1>
        <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
      </div>
      
      <div className="px-4 py-2">
        <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
          <img
            src={admin?.profileImage || 'https://via.placeholder.com/40'}
            alt={admin?.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{admin?.fullName || 'Admin'}</p>
            <p className="text-xs text-gray-400 capitalize">
              {admin?.role?.replace('_', ' ') || 'Administrator'}
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-8 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-3 transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-6 py-3 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <HiLogout className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;