import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchAdminProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchAdminProfile = async () => {
    try {
      const response = await axios.get('/admin/profile');
      setAdmin(response.data.admin);
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('/admin/login', { 
        email: username, 
        password 
      });
      
      const { token, admin } = response.data;
      
      localStorage.setItem('adminToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setAdmin(admin);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setAdmin(null);
  };

  const value = {
    admin,
    isAuthenticated: !!admin,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};