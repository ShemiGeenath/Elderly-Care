// Navbar.jsx - Complete corrected version with SOS functionality
import React, { useState, useEffect, useRef } from "react";
import { 
  FaSearch, FaChevronDown, FaBell, FaEnvelope, FaUser, 
  FaCog, FaQuestionCircle, FaSignOutAlt, FaExclamationTriangle 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useChat } from '../context/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import useTranslation from '../hooks/useTranslation';

const Navbar = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSosHistory, setShowSosHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sosLoading, setSosLoading] = useState(false);
  const [sosHistory, setSosHistory] = useState([]);
  
   const { t } = useTranslation();
  const { getTranslation } = useLanguage();

  const navigate = useNavigate();
  
  const { 
    unreadCount, 
    notifications, 
    markNotificationsAsRead,
    requestNotificationPermission 
  } = useChat();
  
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const sosHistoryRef = useRef(null);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (sosHistoryRef.current && !sosHistoryRef.current.contains(event.target)) {
        setShowSosHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Fetch SOS history
  useEffect(() => {
    if (user?.id) {
      fetchSOSHistory();
    }
  }, [user]);

  // Add this debug useEffect in Navbar.jsx
useEffect(() => {
  console.log("🔍 Navbar received user prop:", user);
  
  // Check what's in localStorage
  try {
    const storedUser = localStorage.getItem('elderlyUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log("🔍 User from localStorage:", parsedUser);
      console.log("🔍 Emergency phone in localStorage:", parsedUser.emergencyPhone);
    } else {
      console.log("🔍 No user in localStorage");
    }
  } catch (e) {
    console.error("Error parsing stored user:", e);
  }
}, [user]);

  const fetchSOSHistory = async () => {
    try {
      const token = localStorage.getItem('elderlyToken');
      const response = await axios.get('http://localhost:5000/api/sos/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setSosHistory(response.data.history);
      }
    } catch (error) {
      console.error('Error fetching SOS history:', error);
    }
  };

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

  // SOS Handler function
// Updated handleSOS function with localStorage fallback
const handleSOS = async () => {
  console.log("🔴 SOS button clicked!");
  
  // Try to get emergency info from multiple sources
  let emergencyPhone = user?.emergencyPhone;
  let emergencyContact = user?.emergencyContact;
  
  console.log("🔴 From user prop - Phone:", emergencyPhone, "Contact:", emergencyContact);
  
  // If not in user prop, try localStorage
  if (!emergencyPhone) {
    try {
      const storedUser = localStorage.getItem('elderlyUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        emergencyPhone = parsedUser.emergencyPhone;
        emergencyContact = parsedUser.emergencyContact;
        console.log("🔴 From localStorage - Phone:", emergencyPhone, "Contact:", emergencyContact);
      }
    } catch (e) {
      console.error("Error parsing stored user:", e);
    }
  }

  // Check if we have emergency contact
  if (!emergencyPhone) {
    console.log("🔴 No emergency contact found!");
    toast.error(
      <div>
        <p className="font-bold">No emergency contact found!</p>
        <p className="text-sm">Please update your profile with emergency contact information.</p>
        <button 
          onClick={() => {
            navigate('/profile');
            toast.dismiss();
          }}
          className="mt-2 px-3 py-1 bg-cyan-600 text-white rounded-lg text-sm"
        >
          Update Profile
        </button>
      </div>,
      { duration: 6000 }
    );
    return;
  }

  console.log("🔴 Emergency contact found:", emergencyPhone);
  
  // Confirm before sending
  if (!window.confirm(`🚨 Send SOS emergency alert to ${emergencyContact || 'your emergency contact'}?\n\nThis will notify them via WhatsApp.`)) {
    console.log("🔴 User cancelled SOS");
    return;
  }

  setSosLoading(true);
  console.log("🔴 SOS loading started");

  try {
    // Get user's current location (optional)
    let location = null;
    if (navigator.geolocation) {
      try {
        console.log("🔴 Getting location...");
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true
          });
        });
        
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log("🔴 Location obtained:", location);
      } catch (geoError) {
        console.log("🔴 Location access denied or unavailable");
      }
    }

    // Send SOS request
    const token = localStorage.getItem('elderlyToken');
    console.log("🔴 Token exists:", !!token);
    
    const response = await axios.post(
      'http://localhost:5000/api/sos/send',
      {
        location,
        message: `I need immediate assistance!`
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("🔴 SOS response from backend:", response.data);

    if (response.data.success) {
      const successfulMethods = response.data.results?.filter(r => r.success) || [];
      
      toast.success(
        <div>
          <p className="font-bold text-green-400">✅ SOS Alert Sent!</p>
          <p className="text-sm mt-1">
            {successfulMethods.length > 0 
              ? `Notified via: ${successfulMethods.map(m => m.method).join(', ')}`
              : 'Alert sent to emergency contacts'}
          </p>
          {response.data.results?.some(r => r.method === 'whatsapp' && r.link) && (
            <a 
              href={response.data.results.find(r => r.method === 'whatsapp').link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block px-3 py-1 bg-green-600 text-white rounded-lg text-sm"
            >
              Open WhatsApp
            </a>
          )}
        </div>,
        { duration: 8000 }
      );
      
      // Play alert sound
      playSOSSound();
      
      // Refresh SOS history
      fetchSOSHistory();
      
    } else {
      console.log("🔴 SOS failed:", response.data.message);
      toast.error('Failed to send SOS. Please call emergency services directly.');
    }
  } catch (error) {
    console.error('🔴 SOS error details:', error);
    console.error('🔴 Error response:', error.response?.data);
    
    toast.error(
      <div>
        <p className="font-bold">Error sending SOS</p>
        <p className="text-sm">{error.response?.data?.message || error.message}</p>
        <p className="text-xs mt-2">Please call emergency services immediately if this is an emergency.</p>
      </div>
    );
  } finally {
    setSosLoading(false);
    console.log("🔴 SOS loading finished");
  }
};
  // Function to play SOS sound
  const playSOSSound = () => {
    const audio = new Audio('/sos-alert.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
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
            {getTranslation("Welcome Back", "ආපසු සාදරයෙන් පිළිගනිමු")},{" "}
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {user?.firstName || "John"}!
            </span>
          </p>
        </div>

            {/* SOS Button with History Toggle */}
            <div className="relative">
              <button
                onClick={handleSOS}
                disabled={sosLoading}
                className={`relative px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 group ${
                  sosLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {sosLoading ? (
                  <>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    <span className="opacity-0">🚨 SOS</span>
                  </>
                ) : (
                  <>
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></span>
                    🚨 SOS
                  </>
                )}
              </button>

              {/* SOS History Dropdown */}
              {showSosHistory && (
                <div 
                  ref={sosHistoryRef}
                  className="absolute right-0 mt-3 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 bg-gradient-to-r from-red-600 to-red-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">SOS History</h3>
                      <button
                        onClick={() => setShowSosHistory(false)}
                        className="text-white/80 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {sosHistory.length === 0 ? (
                      <div className="p-8 text-center">
                        <FaExclamationTriangle className="text-4xl text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No SOS alerts sent</p>
                        <p className="text-xs text-gray-500 mt-2">
                          When you send SOS alerts, they'll appear here
                        </p>
                      </div>
                    ) : (
                      sosHistory.map((entry, index) => (
                        <div key={index} className="p-4 border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-white font-medium">
                                {new Date(entry.timestamp).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              entry.results?.some(r => r.success) 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {entry.results?.filter(r => r.success).length || 0} sent
                            </span>
                          </div>
                          {entry.location && (
                            <a 
                              href={`https://maps.google.com/?q=${entry.location.lat},${entry.location.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-cyan-500 hover:text-cyan-400 mt-2 inline-block"
                            >
                              📍 View Location
                            </a>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {entry.results?.map((result, idx) => (
                              <span
                                key={idx}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  result.success 
                                    ? 'bg-green-500/10 text-green-400' 
                                    : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {result.method}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {sosHistory.length > 0 && (
                    <div className="p-3 border-t border-gray-800 bg-gray-900/50">
                      <button
                        onClick={() => {
                          setShowSosHistory(false);
                          navigate('/sos-history');
                        }}
                        className="text-xs text-cyan-500 hover:text-cyan-400 w-full text-center"
                      >
                        View All History
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
 <LanguageSwitcher />
            {/* History Toggle Button */}
            <button
              onClick={() => setShowSosHistory(!showSosHistory)}
              className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-xl transition-all duration-200 text-gray-400 hover:text-white"
              title="View SOS History"
            >
              <FaExclamationTriangle className="text-lg" />
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

                            {/* Icon */}
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

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowSosHistory(true);
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-3"
                  >
                    <FaExclamationTriangle className="text-red-500" />
                    <span>SOS History</span>
                    {sosHistory.length > 0 && (
                      <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                        {sosHistory.length}
                      </span>
                    )}
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