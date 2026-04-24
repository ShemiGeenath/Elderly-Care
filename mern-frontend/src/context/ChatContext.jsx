// frontend/src/context/ChatContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axiosInstance from '../api/axiosConfig';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children, currentUser }) => {
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  const socketRef = useRef();
  const notificationSoundRef = useRef(null);

  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio('/notification.mp3');
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser?.id) return;

    const token = localStorage.getItem('elderlyToken');
    
    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('new-message', handleNewMessage);
    newSocket.on('user-typing', handleUserTyping);
    newSocket.on('messages-read', handleMessagesRead);
    newSocket.on('user-online', handleUserOnline);
    newSocket.on('user-offline', handleUserOffline);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Handle user online status
  const handleUserOnline = useCallback(({ userId }) => {
    setOnlineUsers(prev => new Set(prev).add(userId));
  }, []);

  const handleUserOffline = useCallback(({ userId }) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  }, []);

  // Fetch all chats
  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/chat/chats');
      if (response.data.success) {
        setChats(response.data.chats);
        
        const totalUnread = response.data.chats.reduce(
          (acc, chat) => acc + (chat.unreadCount || 0), 
          0
        );
        setUnreadCount(totalUnread);
        
        if (totalUnread > 0) {
          document.title = `(${totalUnread}) Liberta Chat`;
        } else {
          document.title = 'Liberta';
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get or create chat with user
  const getOrCreateChat = useCallback(async (userId) => {
    try {
      const response = await axiosInstance.get(`/chat/chat/${userId}`);
      if (response.data.success) {
        const chat = response.data.chat;
        
        setChats(prev => {
          const exists = prev.find(c => c._id === chat._id);
          if (exists) return prev;
          return [chat, ...prev];
        });
        
        if (socketRef.current) {
          socketRef.current.emit('join-chat', chat._id);
        }
        
        return chat;
      }
    } catch (err) {
      console.error('Error getting/creating chat:', err);
      throw err;
    }
  }, []);

  // Fetch messages for a chat
  const fetchMessages = useCallback(async (chatId, page = 1) => {
    try {
      const response = await axiosInstance.get(`/chat/messages/${chatId}?page=${page}`);
      if (response.data.success) {
        setMessages(prev => {
          const existingMessages = prev[chatId]?.messages || [];
          const newMessages = response.data.messages;
          
          // Merge messages without duplicates
          const allMessages = page === 1 
            ? newMessages 
            : [...newMessages, ...existingMessages];
          
          // Remove duplicates by _id
          const uniqueMessages = Array.from(
            new Map(allMessages.map(msg => [msg._id, msg])).values()
          );
          
          // Sort by createdAt
          uniqueMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          
          return {
            ...prev,
            [chatId]: {
              messages: uniqueMessages,
              total: response.data.total,
              page: response.data.page,
              pages: response.data.pages
            }
          };
        });
        
        // Mark messages as read when fetched
        if (page === 1) {
          setChats(prev => prev.map(chat => 
            chat._id === chatId 
              ? { ...chat, unreadCount: 0 }
              : chat
          ));
          
          updateTotalUnread();
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, []);

  // Send a text message
  const sendMessage = useCallback(async (chatId, content) => {
    try {
      const response = await axiosInstance.post(`/chat/message/${chatId}`, { content });
      
      if (response.data.success) {
        const newMessage = response.data.message;
        
        setMessages(prev => {
          const chatMessages = prev[chatId] || { messages: [] };
          return {
            ...prev,
            [chatId]: {
              ...chatMessages,
              messages: [...chatMessages.messages, newMessage]
            }
          };
        });
        
        if (socketRef.current) {
          socketRef.current.emit('send-message', {
            chatId,
            message: newMessage
          });
        }
        
        setChats(prev => prev.map(chat => 
          chat._id === chatId
            ? { 
                ...chat, 
                lastMessage: newMessage,
                updatedAt: new Date()
              }
            : chat
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        
        return newMessage;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, []);

  // Send voice message
 // frontend/src/context/ChatContext.jsx
// Update the sendVoiceMessage function:

const sendVoiceMessage = useCallback(async (chatId, audioFile, duration) => {
  try {
    const formData = new FormData();
    formData.append('media', audioFile);
    formData.append('messageType', 'voice');
    formData.append('duration', duration.toString()); // Convert to string to ensure proper sending

    const response = await axiosInstance.post(`/chat/media/${chatId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      const newMessage = response.data.message;
      
      setMessages(prev => {
        const chatMessages = prev[chatId] || { messages: [] };
        return {
          ...prev,
          [chatId]: {
            ...chatMessages,
            messages: [...chatMessages.messages, newMessage]
          }
        };
      });
      
      if (socketRef.current) {
        socketRef.current.emit('send-message', {
          chatId,
          message: newMessage
        });
      }
      
      setChats(prev => prev.map(chat => 
        chat._id === chatId
          ? { 
              ...chat, 
              lastMessage: newMessage,
              updatedAt: new Date()
            }
          : chat
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      
      return newMessage;
    }
  } catch (err) {
    console.error('Error sending voice message:', err);
    throw err;
  }
}, []);

  // Send media message (image, video, file)
  const sendMediaMessage = useCallback(async (chatId, file, messageType) => {
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('messageType', messageType);

      const response = await axiosInstance.post(`/chat/media/${chatId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        const newMessage = response.data.message;
        
        setMessages(prev => {
          const chatMessages = prev[chatId] || { messages: [] };
          return {
            ...prev,
            [chatId]: {
              ...chatMessages,
              messages: [...chatMessages.messages, newMessage]
            }
          };
        });
        
        if (socketRef.current) {
          socketRef.current.emit('send-message', {
            chatId,
            message: newMessage
          });
        }
        
        setChats(prev => prev.map(chat => 
          chat._id === chatId
            ? { 
                ...chat, 
                lastMessage: newMessage,
                updatedAt: new Date()
              }
            : chat
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        
        return newMessage;
      }
    } catch (err) {
      console.error('Error sending media message:', err);
      throw err;
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((chatId, isTyping) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { chatId, isTyping });
    }
  }, []);

  // Handle new message from socket
  const handleNewMessage = useCallback((data) => {
    const { chatId, ...message } = data;
    
    const isFromCurrentUser = message.sender?._id === currentUser?.id;
    
    setMessages(prev => {
      const chatMessages = prev[chatId] || { messages: [] };
      
      const messageExists = chatMessages.messages.some(m => m._id === message._id);
      if (messageExists) return prev;
      
      return {
        ...prev,
        [chatId]: {
          ...chatMessages,
          messages: [...chatMessages.messages, message]
        }
      };
    });
    
    setChats(prev => {
      const updatedChats = prev.map(chat => {
        if (chat._id === chatId) {
          const isActive = activeChat?._id === chatId;
          const shouldIncrement = !isActive && !isFromCurrentUser;
          const newUnreadCount = shouldIncrement ? (chat.unreadCount || 0) + 1 : chat.unreadCount || 0;
          
          return {
            ...chat,
            lastMessage: message,
            updatedAt: new Date(),
            unreadCount: newUnreadCount
          };
        }
        return chat;
      });
      
      return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
    
    updateTotalUnread();
    
    // Show notification
    if (!isFromCurrentUser && activeChat?._id !== chatId) {
      if (notificationSoundRef.current) {
        notificationSoundRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      
      if ('Notification' in window && Notification.permission === 'granted') {
        const senderName = message.sender?.firstName || 'Someone';
        
        // Customize notification based on message type
        let messagePreview = '';
        if (message.messageType === 'voice') {
          messagePreview = '🎤 Sent a voice message';
        } else if (message.messageType === 'image') {
          messagePreview = '📷 Sent an image';
        } else if (message.messageType === 'video') {
          messagePreview = '🎥 Sent a video';
        } else if (message.content) {
          messagePreview = message.content.length > 50 
            ? message.content.substring(0, 50) + '...' 
            : message.content;
        } else {
          messagePreview = 'Sent an attachment';
        }
        
        new Notification(`New message from ${senderName}`, {
          body: messagePreview,
          icon: message.sender?.profilePhoto || '/default-avatar.png',
          tag: chatId
        });
      }
      
      setNotifications(prev => [
        {
          id: message._id,
          chatId,
          sender: message.sender,
          content: message.content,
          messageType: message.messageType,
          timestamp: new Date(),
          read: false
        },
        ...prev
      ].slice(0, 10));
    }
  }, [activeChat, currentUser]);

  // Handle user typing
  const handleUserTyping = useCallback(({ userId, isTyping }) => {
    setTypingUsers(prev => ({
      ...prev,
      [userId]: isTyping
    }));
    
    if (isTyping) {
      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [userId]: false
        }));
      }, 3000);
    }
  }, []);

  // Handle messages read
  const handleMessagesRead = useCallback(({ userId, messageIds }) => {
    setMessages(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(chatId => {
        updated[chatId] = {
          ...updated[chatId],
          messages: updated[chatId].messages.map(msg => {
            if (messageIds.includes(msg._id)) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), { user: userId, readAt: new Date() }]
              };
            }
            return msg;
          })
        };
      });
      return updated;
    });
  }, []);

  // Update total unread count
  const updateTotalUnread = useCallback(() => {
    setChats(prevChats => {
      const total = prevChats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
      setUnreadCount(total);
      
      if (total > 0) {
        document.title = `(${total}) Liberta Chat`;
      } else {
        document.title = 'Liberta';
      }
      
      return prevChats;
    });
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (chatId, messageIds) => {
    try {
      if (socketRef.current) {
        socketRef.current.emit('mark-read', { chatId, messageIds });
      }
      
      // Update local state
      setMessages(prev => {
        const chatMessages = prev[chatId];
        if (!chatMessages) return prev;
        
        return {
          ...prev,
          [chatId]: {
            ...chatMessages,
            messages: chatMessages.messages.map(msg => {
              if (messageIds.includes(msg._id)) {
                return {
                  ...msg,
                  readBy: [...(msg.readBy || []), { user: currentUser.id, readAt: new Date() }]
                };
              }
              return msg;
            })
          }
        };
      });
      
      // Update chat list
      setChats(prev => prev.map(chat => 
        chat._id === chatId 
          ? { ...chat, unreadCount: 0 }
          : chat
      ));
      
      updateTotalUnread();
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [currentUser, updateTotalUnread]);

  // Mark notifications as read
  const markNotificationsAsRead = useCallback((chatId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.chatId === chatId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        return true;
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    }
    return false;
  }, []);

  // Join chat room when active chat changes
  useEffect(() => {
    if (activeChat && socketRef.current) {
      socketRef.current.emit('join-chat', activeChat._id);
      markNotificationsAsRead(activeChat._id);
      
      // Mark all messages in this chat as read
      const chatMessages = messages[activeChat._id]?.messages || [];
      const unreadMessageIds = chatMessages
        .filter(msg => 
          msg.sender?._id !== currentUser?.id && 
          !msg.readBy?.some(read => read.user === currentUser?.id)
        )
        .map(msg => msg._id);
      
      if (unreadMessageIds.length > 0) {
        markAsRead(activeChat._id, unreadMessageIds);
      }
    }
  }, [activeChat, messages, currentUser, markAsRead, markNotificationsAsRead]);

  // Initial fetch
  useEffect(() => {
    if (currentUser) {
      fetchChats();
    }
  }, [currentUser, fetchChats]);

  return (
    <ChatContext.Provider value={{
      socket,
      chats,
      activeChat,
      messages,
      onlineUsers,
      typingUsers,
      loading,
      unreadCount,
      notifications,
      fetchChats,
      getOrCreateChat,
      fetchMessages,
      sendMessage,
      sendVoiceMessage,
      sendMediaMessage,
      sendTyping,
      setActiveChat,
      markAsRead,
      markNotificationsAsRead,
      clearNotifications,
      requestNotificationPermission
    }}>
      {children}
    </ChatContext.Provider>
  );
};