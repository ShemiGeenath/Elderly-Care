// frontend/src/components/Chat/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { format } from 'date-fns';
import {
  Send,
  Smile,
  Paperclip,
  Image,
  X,
  Check,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';

const ChatWindow = ({ chat, currentUser, onClose }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const typingTimeoutRef = useRef();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isFirstLoad = useRef(true);
  
  const { 
    messages, 
    sendMessage, 
    sendTyping, 
    typingUsers,
    fetchMessages,
    activeChat 
  } = useChat();
  
  const chatMessages = messages[chat?._id]?.messages || [];
  const totalMessages = messages[chat?._id]?.total || 0;
  const currentPage = messages[chat?._id]?.page || 1;
  const totalPages = messages[chat?._id]?.pages || 1;

  // Fetch messages when chat is selected
  useEffect(() => {
    if (chat?._id) {
      setLoading(true);
      fetchMessages(chat._id, 1)
        .finally(() => {
          setLoading(false);
          isFirstLoad.current = false;
        });
      setPage(1);
      setHasMore(true);
    }
  }, [chat?._id, fetchMessages]);

  // Scroll to bottom on new messages only if we're at the bottom
  useEffect(() => {
    if (!loading && chatMessages.length > 0 && isFirstLoad.current) {
      scrollToBottom();
    } else if (!isFirstLoad.current) {
      // Only auto-scroll if we're near the bottom
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom) {
          scrollToBottom();
        }
      }
    }
  }, [chatMessages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle scroll for pagination
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || loading || !hasMore || page >= totalPages) return;

    // If scrolled to top, load more messages
    if (container.scrollTop < 50) {
      const nextPage = page + 1;
      setPage(nextPage);
      setLoading(true);
      
      // Save current scroll height
      const scrollHeight = container.scrollHeight;
      
      fetchMessages(chat._id, nextPage)
        .finally(() => {
          setLoading(false);
          // Restore scroll position after loading
          container.scrollTop = container.scrollHeight - scrollHeight;
        });
      
      setHasMore(nextPage < totalPages);
    }
  };

  // Handle typing indicator
  useEffect(() => {
    if (!chat) return;
    
    if (message.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        sendTyping(chat._id, true);
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTyping(chat._id, false);
      }, 1000);
    } else {
      setIsTyping(false);
      sendTyping(chat._id, false);
    }

    return () => {
      clearTimeout(typingTimeoutRef.current);
    };
  }, [message, chat, sendTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chat || (!message.trim() && attachments.length === 0)) return;

    try {
      await sendMessage(chat._id, message);
      setMessage('');
      setAttachments([]);
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleFileSelect = (type) => {
    fileInputRef.current.accept = type === 'image' ? 'image/*' : '*/*';
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatMessageTime = (date) => {
    return format(new Date(date), 'HH:mm');
  };

  const formatMessageDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM dd, yyyy');
    }
  };

  const getOtherParticipants = () => {
    if (!chat) return [];
    return chat.participants?.filter(p => p._id !== currentUser.id) || [];
  };

  const getChatName = () => {
    if (!chat) return 'Chat';
    if (chat.isGroupChat) {
      return chat.groupName || 'Group Chat';
    }
    const other = getOtherParticipants()[0];
    return other ? `${other.firstName} ${other.lastName}` : 'Chat';
  };

  const getChatAvatar = () => {
    if (!chat) return '/default-avatar.png';
    if (chat.isGroupChat) {
      return chat.groupAvatar || '/group-avatar.png';
    }
    const other = getOtherParticipants()[0];
    return other?.profilePhoto || '/default-avatar.png';
  };

  const isUserTyping = () => {
    if (!chat) return false;
    const otherParticipants = getOtherParticipants();
    return otherParticipants.some(p => typingUsers[p._id]);
  };

  const getTypingText = () => {
    if (!chat) return '';
    const typingUsersList = getOtherParticipants()
      .filter(p => typingUsers[p._id])
      .map(p => p.firstName);
    
    if (typingUsersList.length === 1) {
      return `${typingUsersList[0]} is typing...`;
    } else if (typingUsersList.length === 2) {
      return `${typingUsersList[0]} and ${typingUsersList[1]} are typing...`;
    } else if (typingUsersList.length > 2) {
      return 'Several people are typing...';
    }
    return '';
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Your Messages</h3>
          <p className="text-gray-500">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <div className="relative">
            <img
              src={getChatAvatar()}
              alt={getChatName()}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{getChatName()}</h2>
            <p className="text-sm text-gray-500">
              {isUserTyping() ? (
                <span className="text-green-600">{getTypingText()}</span>
              ) : (
                'Active now'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Phone className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Video className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area - Fixed height with scroll */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 bg-gray-50"
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        {loading && page > 1 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {chatMessages.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-500">
                Send a message to start the conversation
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg, index) => {
              const isOwnMessage = msg.sender?._id === currentUser.id;
              const showDate = index === 0 || 
                formatMessageDate(msg.createdAt) !== formatMessageDate(chatMessages[index - 1]?.createdAt);

              return (
                <React.Fragment key={msg._id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                        {formatMessageDate(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isOwnMessage && (
                        <img
                          src={msg.sender?.profilePhoto || '/default-avatar.png'}
                          alt={msg.sender?.firstName || 'User'}
                          className="h-8 w-8 rounded-full object-cover mt-1"
                        />
                      )}
                      <div className={`mx-2 ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          {msg.attachments?.map((att, idx) => (
                            <div key={idx} className="mt-2">
                              {att.type === 'image' ? (
                                <img
                                  src={att.url}
                                  alt="Attachment"
                                  className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(att.url, '_blank')}
                                />
                              ) : (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  <span className="text-sm">{att.filename}</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className={`flex items-center space-x-1 mt-1 text-xs ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-gray-500">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {isOwnMessage && (
                            <span className="text-gray-400">
                              {msg.readBy?.length > 0 ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            {isUserTyping() && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-sm">{getTypingText()}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((file, index) => (
              <div key={index} className="relative group">
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                  {file.type?.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Attachment preview"
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <Paperclip className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows="1"
              className="w-full bg-transparent border-0 focus:ring-0 text-sm resize-none max-h-32"
              style={{ minHeight: '40px' }}
            />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => handleFileSelect('image')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Image className="h-5 w-5 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => handleFileSelect('file')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Paperclip className="h-5 w-5 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Smile className="h-5 w-5 text-gray-600" />
            </button>
            <button
              type="submit"
              disabled={!message.trim() && attachments.length === 0}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full transition"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;