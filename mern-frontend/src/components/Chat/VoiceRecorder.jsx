// frontend/src/components/Chat/VoiceRecorder.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Send, Loader } from 'lucide-react';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingBlob(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleSend = async () => {
    if (recordingBlob) {
      setIsUploading(true);
      
      // Convert blob to file
      const audioFile = new File(
        [recordingBlob], 
        `voice-message-${Date.now()}.webm`, 
        { type: 'audio/webm' }
      );
      
      try {
        // Send both the file and the duration
        await onSend(audioFile, recordingTime);
        
        // Clean up
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setRecordingBlob(null);
        
      } catch (err) {
        console.error('Error sending voice message:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleCancel = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingBlob(null);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      {!audioUrl ? (
        // Recording UI
        <div className="flex items-center space-x-4">
          {isRecording ? (
            <>
              <div className="flex-1 flex items-center space-x-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
                <div className="flex-1 h-10 flex items-center space-x-1">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-500 animate-pulse"
                      style={{
                        height: `${Math.random() * 30 + 10}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    ></div>
                  ))}
                </div>
              </div>
              <button
                onClick={stopRecording}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
              >
                <Square className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 text-gray-600">
                Tap to start recording voice message
              </div>
              <button
                onClick={startRecording}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition"
              >
                <Mic className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      ) : (
        // Preview UI
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition"
            >
              <Play className="h-5 w-5" />
            </button>
            
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
            
            <span className="text-sm text-gray-500">
              {formatTime(recordingTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-full"
              disabled={isUploading}
            >
              <Trash2 className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={handleSend}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Voice</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;