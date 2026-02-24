// frontend/src/components/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { FaBell, FaCheckCircle, FaMessage } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markNotificationsAsRead, unreadCount } = useChat();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    markNotificationsAsRead(notification.chatId);
    navigate(`/chat?user=${notification.sender._id}`);
    setIsOpen(false);
  };

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <FaBell className="text-xl" />
        {unreadNotifications > 0 && (
          <>
            <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 animate-pulse">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadNotifications > 0 && (
                <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                  {unreadNotifications} new
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaCheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={notification.sender.profilePhoto || '/default-avatar.png'}
                        alt={notification.sender.firstName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      {!notification.read && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.sender.firstName} {notification.sender.lastName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    <FaMessage className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  navigate('/chat');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all messages
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;