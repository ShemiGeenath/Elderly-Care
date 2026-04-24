import React, { useState, useEffect } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GoogleLoginButton = ({ onSuccess, onError, buttonText = "Continue with Google" }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    setLoading(true);
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = 'http://localhost:5000/api/elderly/google';
  };

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const userId = urlParams.get('userId');
      const firstName = urlParams.get('firstName');
      const lastName = urlParams.get('lastName');
      const email = urlParams.get('email');
      const profilePhoto = urlParams.get('profilePhoto');
      const phone = urlParams.get('phone');
      const emergencyPhone = urlParams.get('emergencyPhone');
      const error = urlParams.get('error');

      console.log("🔐 Google callback params received:", { 
        token: !!token, 
        userId, 
        firstName, 
        lastName, 
        email,
        phone,
        emergencyPhone
      });

      if (error) {
        console.error("❌ Google auth error:", error);
        setLoading(false);
        if (onError) onError(error);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (token && userId) {
        try {
          localStorage.setItem('elderlyToken', token);
          
          // CRITICAL: Fetch complete user data from /me endpoint
          const response = await axios.get('http://localhost:5000/api/elderly/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log("📋 Complete user data from /me:", response.data);
          
          if (response.data.success && response.data.user) {
            const userData = response.data.user;
            localStorage.setItem('elderlyUser', JSON.stringify(userData));
            console.log("✅ User data stored with ALL fields:", {
              id: userData.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              emergencyPhone: userData.emergencyPhone,
              hobbies: userData.hobbies
            });
            
            if (onSuccess) onSuccess(userData);
            
            const redirectTo = localStorage.getItem('redirectAfterLogin') || '/liberta-home';
            localStorage.removeItem('redirectAfterLogin');
            navigate(redirectTo);
          } else {
            throw new Error('Failed to fetch user data from /me endpoint');
          }
        } catch (err) {
          console.error("❌ Error fetching user data:", err);
          // Fallback: use URL params
          const fallbackUserData = {
            id: userId,
            firstName: decodeURIComponent(firstName || ''),
            lastName: decodeURIComponent(lastName || ''),
            email: decodeURIComponent(email || ''),
            profilePhoto: decodeURIComponent(profilePhoto || ''),
            phone: decodeURIComponent(phone || ''),
            emergencyPhone: decodeURIComponent(emergencyPhone || '')
          };
          localStorage.setItem('elderlyUser', JSON.stringify(fallbackUserData));
          if (onError) onError('Partial login - some data may be missing');
          navigate('/liberta-home');
        } finally {
          setLoading(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleCallback();
  }, [navigate, onSuccess, onError]);

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full py-4 text-xl font-semibold bg-red-300 text-red-800 rounded-2xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-3 border border-gray-300"
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white-600 border-t-transparent rounded-full animate-spin"></div>
          Connecting...
        </>
      ) : (
        <>
          <FaGoogle className="text-red-500 text-2xl" />
          {buttonText}
        </>
      )}
    </button>
  );
};

export default GoogleLoginButton;