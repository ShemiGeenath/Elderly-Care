import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('Processing login...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const userId = params.get('userId');
      const errorParam = params.get('error');

      console.log("🔄 OAuth Callback - Processing:", { token: !!token, userId, errorParam });

      if (errorParam) {
        setStatus(`Login failed: ${errorParam}`);
        setError(errorParam);
        setTimeout(() => navigate('/login?error=google_auth_failed'), 3000);
        return;
      }

      if (token && userId) {
        try {
          setStatus('Authenticated! Loading your profile...');
          
          localStorage.setItem('elderlyToken', token);
          
          // CRITICAL: Fetch complete user profile from /me endpoint
          const response = await axios.get('http://localhost:5000/api/elderly/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log("📋 OAuth Callback - Complete user data:", response.data);
          
          if (response.data.success && response.data.user) {
            localStorage.setItem('elderlyUser', JSON.stringify(response.data.user));
            setStatus('Login successful! Redirecting to home...');
            setTimeout(() => navigate('/liberta-home'), 1500);
          } else {
            throw new Error('Failed to fetch user data from /me endpoint');
          }
        } catch (err) {
          console.error('❌ Error in OAuth callback:', err);
          setStatus('Error completing login. Redirecting to login page...');
          setTimeout(() => navigate('/login?error=callback_failed'), 3000);
        }
      } else {
        setStatus('Invalid callback. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    processCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl text-center max-w-md">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 text-lg">{status}</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-white text-xl">{status}</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we set up your account...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;