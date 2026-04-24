// frontend/src/utils/permissions.js
export const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately after permission is granted
    stream.getTracks().forEach(track => track.stop());
    return { granted: true, error: null };
  } catch (err) {
    console.error('Microphone permission error:', err);
    return { 
      granted: false, 
      error: err.message || 'Could not access microphone' 
    };
  }
};

export const checkMicrophoneSupport = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};