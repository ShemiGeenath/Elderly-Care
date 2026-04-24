// frontend/src/components/Chat/VoiceMessage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Loader } from 'lucide-react';

const VoiceMessage = ({ message, isOwnMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(message.duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration);
      });

      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current.currentTime);
        updateProgress();
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [message.mediaUrl]);

  const updateProgress = () => {
    if (audioRef.current && progressRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      progressRef.current.style.width = `${progress}%`;
    }
  };

  const togglePlay = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          setIsLoading(true);
          await audioRef.current.play();
          setIsLoading(false);
        }
        setIsPlaying(!isPlaying);
      } catch (err) {
        console.error('Error playing audio:', err);
        setIsLoading(false);
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    if (audioRef.current && progressRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percentage = x / width;
      const newTime = percentage * audioRef.current.duration;
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className={`flex items-center space-x-3 p-2 rounded-lg ${
      isOwnMessage ? 'bg-blue-700' : 'bg-gray-100'
    }`}>
      <audio ref={audioRef} src={message.mediaUrl} preload="metadata" />
      
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className={`p-2 rounded-full ${
          isOwnMessage 
            ? 'bg-blue-600 hover:bg-blue-500 text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        } transition`}
      >
        {isLoading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>

      <div className="flex-1">
        <div 
          className="h-2 bg-gray-300 rounded-full cursor-pointer"
          onClick={handleSeek}
        >
          <div
            ref={progressRef}
            className={`h-full rounded-full ${
              isOwnMessage ? 'bg-white' : 'bg-blue-600'
            }`}
            style={{ width: '0%' }}
          ></div>
        </div>
      </div>

      <span className={`text-xs ${
        isOwnMessage ? 'text-blue-100' : 'text-gray-600'
      }`}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <a
        href={message.mediaUrl}
        download={`voice-message-${message._id}.webm`}
        className={`p-1 rounded hover:bg-opacity-20 ${
          isOwnMessage ? 'hover:bg-white' : 'hover:bg-gray-300'
        }`}
      >
        <Download className={`h-4 w-4 ${
          isOwnMessage ? 'text-white' : 'text-gray-600'
        }`} />
      </a>
    </div>
  );
};

export default VoiceMessage;