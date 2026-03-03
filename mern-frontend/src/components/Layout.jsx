// components/Layout.jsx
import React from 'react';
import FloatingChatbot from './FloatingChatbot';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen relative">
      {children}
      <FloatingChatbot />
    </div>
  );
};

export default Layout;