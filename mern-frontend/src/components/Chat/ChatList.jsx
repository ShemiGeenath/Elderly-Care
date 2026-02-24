// frontend/src/components/Chat/ChatList.jsx
import React, { useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import {
  Search,
  Plus,
  MessageCircle,
  Check,
  CheckCheck,
  Users,
  MoreVertical
} from 'lucide-react';

const ChatList = ({ currentUser, onSelectChat, activeChatId }) => {
  const { chats, loading, fetchChats, unreadCount } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);

  useEffect(() => {
    fetchChats();
    
    // Refresh chats every 10 seconds to update unread counts
    const interval = setInterval(() => {
      fetchChats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchChats]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = chats.filter(chat => {
        if (chat.isGroupChat) {
          return chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        const otherUser = chat.participants?.find(p => p._id !== currentUser.id);
        return otherUser && 
          `${otherUser.firstName} ${otherUser.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
      });
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [chats, searchQuery, currentUser]);

  const formatLastSeen = (date) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getChatName = (chat) => {
    if (chat.isGroupChat) {
      return chat.groupName || 'Group Chat';
    }
    const otherUser = chat.participants?.find(p => p._id !== currentUser.id);
    return otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Chat';
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroupChat) {
      return chat.groupAvatar || '/group-avatar.png';
    }
    const otherUser = chat.participants?.find(p => p._id !== currentUser.id);
    return otherUser?.profilePhoto || '/default-avatar.png';
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const isOwnMessage = chat.lastMessage.sender === currentUser.id;
    const prefix = isOwnMessage ? 'You: ' : '';
    
    if (chat.lastMessage.content) {
      return `${prefix}${chat.lastMessage.content.substring(0, 30)}${
        chat.lastMessage.content.length > 30 ? '...' : ''
      }`;
    }
    
    if (chat.lastMessage.attachments?.length > 0) {
      return `${prefix}📎 ${chat.lastMessage.attachments.length} attachment(s)`;
    }
    
    return 'No messages yet';
  };

  const getMessageStatus = (chat) => {
    if (!chat.lastMessage) return null;
    
    const isOwnMessage = chat.lastMessage.sender === currentUser.id;
    if (!isOwnMessage) return null;
    
    // Check if message has been read by all other participants
    const otherParticipants = chat.participants?.filter(p => p._id !== currentUser.id) || [];
    const allRead = otherParticipants.every(p => 
      chat.lastMessage.readBy?.some(read => read.user === p._id)
    );
    
    return allRead ? (
      <CheckCheck className="h-4 w-4 text-blue-500" />
    ) : (
      <Check className="h-4 w-4 text-gray-400" />
    );
  };

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Plus className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading && filteredChats.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No conversations yet</p>
            <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
              Start a new chat
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = activeChatId === chat._id;
            const unreadCount = chat.unreadCount || 0;

            return (
              <button
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-blue-50' : ''
                } ${unreadCount > 0 ? 'bg-blue-50/50' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={getChatAvatar(chat)}
                    alt={getChatName(chat)}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {getChatName(chat)}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatLastSeen(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate max-w-[180px] ${
                      unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'
                    }`}>
                      {getLastMessagePreview(chat)}
                    </p>
                    <div className="flex items-center space-x-1">
                      {getMessageStatus(chat)}
                      {chat.isGroupChat && (
                        <Users className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;