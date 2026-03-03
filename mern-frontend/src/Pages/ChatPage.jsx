// frontend/src/Pages/ChatPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import ChatInterface from '../components/Chat/ChatInterface';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const { getOrCreateChat, setActiveChat, fetchChats } = useChat();

  // Get userId from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const selectedUserId = queryParams.get('user');

  useEffect(() => {
    const token = localStorage.getItem('elderlyToken');
    const userData = localStorage.getItem('elderlyUser');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setCurrentUser(parsedUser);
    } catch (err) {
      navigate('/login');
    } finally {
      setInitialLoading(false);
    }
  }, [navigate]);

  // Fetch chats when user is loaded
  useEffect(() => {
    if (currentUser) {
      fetchChats();
    }
  }, [currentUser, fetchChats]);

  // Handle selected user from URL
  useEffect(() => {
    const initializeChat = async () => {
      if (selectedUserId && currentUser && currentUser.id !== selectedUserId) {
        try {
          const chat = await getOrCreateChat(selectedUserId);
          if (chat) {
            setActiveChat(chat);
            
            // Remove the user parameter from URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }
        } catch (err) {
          console.error('Error creating chat:', err);
        }
      }
    };

    if (currentUser && selectedUserId) {
      initializeChat();
    }
  }, [selectedUserId, currentUser, getOrCreateChat, setActiveChat]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (initialLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
    <div className="flex h-screen">
      <Sidebar user={currentUser} onLogout={handleLogout} />
      
      <div className="ml-32 flex-1 flex flex-col">
        <Navbar user={currentUser} />
        
        <div className="flex-1 p-4 bg-gray-100 overflow-hidden">
          <div className="h-full">
            <ChatInterface currentUser={currentUser} />
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default ChatPage;