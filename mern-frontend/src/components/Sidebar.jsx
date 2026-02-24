// Sidebar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from '../context/ChatContext';
import {
  FaHome,
  FaUser,
  FaUsers,
  FaComment,
  FaFirstAid,
  FaCog,
  FaSignOutAlt
} from "react-icons/fa";

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { unreadCount, fetchChats } = useChat();
  const [activePath, setActivePath] = useState(window.location.pathname);

  // Fetch chats periodically to update unread count
  useEffect(() => {
    fetchChats();
    
    // Refresh chats every 30 seconds to get latest unread counts
    const interval = setInterval(() => {
      fetchChats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchChats]);

  // Update active path when navigating
  useEffect(() => {
    setActivePath(window.location.pathname);
  }, [navigate]);

  // In your Sidebar.jsx, update the menu items
const menuItems = [
  { icon: <FaHome />, label: "Home", link: "/liberta-home" },
  {
    icon: <FaUser />,
    label: "Profile",
    link: user?.id ? `/profile/${user.id}` : "/profile"
  },
  { icon: <FaUsers />, label: "Friends", link: "/FriendsPage" },
  { 
    icon: (
      <div className="relative inline-block">
        <FaComment className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    ), 
    label: "Chat", 
    link: "/chat",
    badge: unreadCount > 0 ? unreadCount : null
  },
  { icon: <FaFirstAid />, label: "Help", link: "/HelpPage" },
  { icon: <FaCog />, label: "Settings", link: "/settings" } // This should already be there
];

  const isActive = (link) => {
    if (link === "/liberta-home" && activePath === "/liberta-home") return true;
    if (link.includes("/profile") && activePath.includes("/profile")) return true;
    if (link === "/chat" && activePath.includes("/chat")) return true;
    return activePath === link;
  };

  return (
    <div className="w-32 min-w-32 h-screen bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 shadow-xl">
      <div className="flex flex-col h-full py-4">

        {/* LOGO */}
        <div className="py-6 mb-4 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-center">
            Liberta
          </h2>
        </div>

        {/* MENU */}
        <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.link)}
              className={`relative flex flex-col items-center justify-center w-full px-3 py-4 rounded-xl transition-all duration-200 group ${
                isActive(item.link)
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50'
              }`}
            >
              <span className={`text-3xl mb-1 transition-transform group-hover:scale-110 ${
                isActive(item.link) ? 'text-white' : 'text-gray-400'
              }`}>
                {item.icon}
              </span>
              <span className="text-xs font-medium">{item.label}</span>
              
              {/* Extra indicator for chat with unread messages */}
              {item.label === "Chat" && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              )}
            </button>
          ))}
        </nav>

        {/* USER INFO & LOGOUT */}
        <div className="px-3 mt-auto">
          {user && (
            <div className="mb-4 p-3 bg-gray-800/30 rounded-xl">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <img
                  src={user.profilePhoto || '/default-avatar.png'}
                  alt={user.firstName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500"
                />
              </div>
              <p className="text-xs text-center text-gray-300 truncate">
                {user.firstName} {user.lastName}
              </p>
            </div>
          )}
          
          <button
            onClick={onLogout}
            className="flex flex-col items-center w-full px-3 py-4 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
          >
            <FaSignOutAlt className="text-3xl mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;