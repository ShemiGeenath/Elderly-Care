// Navbar.jsx - Complete corrected version
import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaChevronDown, FaBell, FaEnvelope, FaUser, FaCog, FaQuestionCircle, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useChat } from '../context/ChatContext';
import { formatDistanceToNow } from 'date-fns';

const Navbar = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  const { 
    unreadCount, 
    notifications, 
    markNotificationsAsRead,
    requestNotificationPermission 
  } = useChat();
  
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const handleProfileClick = () => {
    setShowDropdown(false);
    navigate(user?.id ? `/profile/${user.id}` : "/profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("elderlyUser");
    localStorage.removeItem("elderlyToken");
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/FriendsPage?search=${searchQuery}`);
    }
  };

  const handleNotificationClick = (notification) => {
    markNotificationsAsRead(notification.chatId);
    navigate(`/chat?user=${notification.sender._id}`);
    setShowNotifications(false);
  };

  const handleViewAllMessages = () => {
    navigate('/chat');
    setShowNotifications(false);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 shadow-lg">
      <div className="px-4">
        <div className="flex items-center justify-between h-20">

          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            <div className="w-44 h-12 flex items-center justify-center">
              <img
                src="/Liberta_logo.png"
                alt="Liberta Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150x50?text=Liberta';
                }}
              />
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends, hobbies, or interests..."
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-all"
              />
            </form>
          </div>

          {/* Welcome + SOS + Notifications */}
          <div className="flex items-center gap-4 mr-4">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl px-5 py-2.5">
              <p className="text-sm text-gray-300">
                Welcome Back,{" "}
                <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  {user?.firstName || "John"}!
                </span>
              </p>
            </div>

            {/* SOS Button */}
            <button className="relative px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 group">
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></span>
              🚨 SOS
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 bg-gray-800/50 hover:bg-gray-700 rounded-xl transition-all duration-200 group"
              >
                <FaBell className={`text-xl transition-colors ${
                  unreadNotifications > 0 ? 'text-yellow-400' : 'text-gray-400 group-hover:text-cyan-400'
                }`} />
                
                {/* Notification Badge */}
                {unreadNotifications > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
                  </>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {/* Header */}
                  <div className="p-5 bg-gradient-to-r from-cyan-600 to-blue-600">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white text-lg">Notifications</h3>
                      {unreadNotifications > 0 && (
                        <span className="px-2.5 py-1 bg-white/20 text-white text-xs font-medium rounded-full">
                          {unreadNotifications} new
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                      {unreadCount > 0 ? `${unreadCount} unread messages` : 'No new messages'}
                    </p>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaBell className="text-2xl text-gray-600" />
                        </div>
                        <p className="text-gray-400 font-medium">No notifications</p>
                        <p className="text-xs text-gray-500 mt-1">
                          When you get messages, they'll appear here
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full p-4 text-left hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-0 group ${
                            !notification.read ? 'bg-gray-800/30' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <img
                                src={notification.sender.profilePhoto || 'https://via.placeholder.com/40'}
                                alt={notification.sender.firstName}
                                className="h-12 w-12 rounded-full object-cover border-2 border-gray-700 group-hover:border-cyan-500 transition-colors"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/40';
                                }}
                              />
                              {!notification.read && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full"></span>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-white">
                                  {notification.sender.firstName} {notification.sender.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatTime(notification.timestamp)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-400 truncate max-w-[200px]">
                                {notification.content}
                              </p>
                              <p className="text-xs text-cyan-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to reply
                              </p>
                            </div>

                            {/* Icon - FIXED: Changed from FaMessage to FaEnvelope */}
                            <FaEnvelope className="h-4 w-4 text-gray-600 group-hover:text-cyan-500 transition-colors" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handleViewAllMessages}
                          className="text-sm text-cyan-500 hover:text-cyan-400 font-medium transition-colors"
                        >
                          View all messages
                        </button>
                        <span className="text-xs text-gray-600">
                          {unreadCount} unread
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-2 hover:bg-gray-800/50 rounded-xl transition-all duration-200 group"
            >
              {/* Profile Image with Badge */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 p-[2px]">
                  <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {user?.firstName?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Online Status */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
              </div>

              {/* User Info */}
              <div className="hidden md:block text-left">
                <p className="text-white font-semibold text-lg">
                  {user?.firstName || "User"} {user?.lastName || ""}
                </p>
                <p className="text-xs text-gray-500">Online</p>
              </div>

              <FaChevronDown className={`text-gray-400 transition-transform duration-200 ${
                showDropdown ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Profile Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
                {/* User Summary */}
                <div className="p-5 bg-gradient-to-r from-gray-800 to-gray-900">
                  <p className="text-sm text-gray-400">Signed in as</p>
                  <p className="text-white font-semibold truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-5 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-3"
                  >
                    <FaUser className="text-cyan-500" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/settings");
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-3"
                  >
                    <FaCog className="text-blue-500" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/HelpPage");
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-3"
                  >
                    <FaQuestionCircle className="text-purple-500" />
                    <span>Help Center</span>
                  </button>

                  <div className="border-t border-gray-800 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-5 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center space-x-3"
                  >
                    <FaSignOutAlt />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;