// frontend/src/components/Chat/ChatInterface.jsx
import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const ChatInterface = ({ currentUser, onClose }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const { setActiveChat: setGlobalActiveChat, activeChat: globalActiveChat } = useChat();

  useEffect(() => {
    if (globalActiveChat) {
      setActiveChat(globalActiveChat);
    }
  }, [globalActiveChat]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setShowMobileList(false);
    setGlobalActiveChat(chat);
  };

  const handleBackToList = () => {
    setShowMobileList(true);
    setGlobalActiveChat(null);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex h-full bg-white rounded-xl shadow-xl overflow-hidden">
      {/* Chat List */}
      <div className={`${
        showMobileList ? 'block' : 'hidden'
      } lg:block w-full lg:w-80 h-full`}>
        <ChatList
          currentUser={currentUser}
          onSelectChat={handleSelectChat}
          activeChatId={activeChat?._id}
        />
      </div>

      {/* Chat Window */}
      <div className={`${
        !showMobileList ? 'block' : 'hidden'
      } lg:block flex-1 h-full`}>
        <ChatWindow
          chat={activeChat}
          currentUser={currentUser}
          onClose={handleBackToList}
        />
      </div>
    </div>
  );
};

export default ChatInterface;