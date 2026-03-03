// components/FloatingChatbot.jsx
import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Maximize2, Minimize2, Heart } from 'lucide-react';
import ElderlyCareChatbot from '../Pages/ElderlyCareChatbot';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Stop blinking after first interaction or after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBlinking(false);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsBlinking(false);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className={`
          fixed bottom-6 right-6 z-50 
          bg-gradient-to-r from-teal-600 to-blue-700 text-white rounded-full p-4 
          shadow-lg hover:from-teal-700 hover:to-blue-800 transition-all duration-300
          ${isBlinking ? 'animate-pulse ring-4 ring-teal-300' : ''}
          transform hover:scale-110
        `}
        aria-label="Open chat"
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`
            fixed z-50 bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200
            transition-all duration-300 ease-in-out
            ${isFullScreen 
              ? 'inset-4 md:inset-8' 
              : 'bottom-24 right-6 w-96 h-[600px] md:w-[450px] md:h-[700px]'
            }
          `}
        >
          {/* Custom Chat Header */}
          <div className="bg-gradient-to-r from-teal-600 to-blue-700 text-white p-3 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="bg-white p-1.5 rounded-full">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-lg">සුව සෙවණ - Gentle Care</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleFullScreen}
                className="hover:bg-teal-600 rounded-full p-1.5 transition-colors"
                title={isFullScreen ? "Minimize" : "Maximize"}
              >
                {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              <button 
                onClick={toggleChat}
                className="hover:bg-teal-600 rounded-full p-1.5 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Chat Content - Scrollable */}
          <div className="flex-1 overflow-hidden">
            <ElderlyCareChatbot />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;