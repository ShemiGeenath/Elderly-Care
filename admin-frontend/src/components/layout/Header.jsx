import React, { useState } from 'react';
import { HiSearch, HiBell, HiMenu } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onMenuClick }) => {
  const { admin } = useAuth();
  const [search, setSearch] = useState('');

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <HiMenu className="w-6 h-6" />
            </button>
            
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users, posts, reports..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <HiBell className="w-6 h-6 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <span className="text-sm text-gray-600 hidden md:block">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;