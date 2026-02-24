// ElderlyLoginForm.jsx - Updated Version
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

import { FaUser, FaLock, FaEye, FaEyeSlash, FaLeaf, FaBook, FaMusic, FaHandsHelping, FaCar, FaPills, FaUtensils } from 'react-icons/fa';

const ElderlyLoginForm = () => {
  const navigate = useNavigate(); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '', // Changed from username to email to match registration
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError(''); // Clear error on typing
  };

 // In ElderlyLoginForm.jsx handleSubmit function:
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const res = await fetch("http://localhost:5000/api/elderly/login", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        email: formData.email.toLowerCase(), // Ensure lowercase
        password: formData.password
      }),
    });

    const data = await res.json();

    if (data.success && data.token) {
      // Store token and user details
      localStorage.setItem("elderlyToken", data.token);
      localStorage.setItem("elderlyUser", JSON.stringify(data.user));
      
      // Navigate to home - ensure this route exists in your Router
      navigate("/liberta-home");
    } else {
      setError(data.message || "Login failed. Please check your credentials.");
    }
  } catch (err) {
    console.error("Login error:", err);
    setError("Connection error. Please check if the server is running on port 5000.");
  } finally {
    setLoading(false);
  }
};
  // Function to handle registration redirect
  const handleRegisterRedirect = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-7xl flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
        {/* Left side - Welcome and features */}
        <div className="md:w-2/5 bg-gradient-to-b from-blue-900 to-teal-900 text-gray-100 p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center mb-8">
              <div className="bg-blue-800 text-white p-4 rounded-xl mr-4 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Welcome to Eldercare</h1>
                <p className="text-blue-200 text-xl mt-2">A safe, friendly community</p>
              </div>
            </div>
            
            <p className="text-2xl mb-10 leading-relaxed text-gray-100">
              A safe and friendly place to connect with others, share your interests, and receive help whenever you need it.
            </p>
            
            <div className="space-y-8">
              <div className="bg-blue-800/70 p-5 rounded-2xl border border-blue-700 shadow-lg">
                <h3 className="text-2xl font-semibold mb-4 flex items-center text-white">
                  <FaLeaf className="mr-3 text-green-400" /> Find Friends by Hobbies
                </h3>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-blue-900/80 px-5 py-3 rounded-xl flex items-center text-lg border border-blue-700 hover:bg-blue-800 transition-colors">
                    <FaLeaf className="mr-3 text-green-400" /> Gardening
                  </span>
                  <span className="bg-blue-900/80 px-5 py-3 rounded-xl flex items-center text-lg border border-blue-700 hover:bg-blue-800 transition-colors">
                    <FaBook className="mr-3 text-yellow-400" /> Reading
                  </span>
                  <span className="bg-blue-900/80 px-5 py-3 rounded-xl flex items-center text-lg border border-blue-700 hover:bg-blue-800 transition-colors">
                    <FaMusic className="mr-3 text-pink-400" /> Music
                  </span>
                </div>
              </div>
              
              <div className="bg-teal-800/70 p-5 rounded-2xl border border-teal-700 shadow-lg">
                <h3 className="text-2xl font-semibold mb-3 text-white">Talk & Listen Easily</h3>
                <p className="text-teal-200 text-xl">Voice and Text Chat made Simple</p>
                <div className="mt-4 p-3 bg-teal-900/50 rounded-lg text-teal-100">
                  <p className="text-lg">Simple buttons, clear voice controls</p>
                </div>
              </div>
              
              <div className="bg-emerald-800/70 p-5 rounded-2xl border border-emerald-700 shadow-lg">
                <h3 className="text-2xl font-semibold mb-4 flex items-center text-white">
                  <FaHandsHelping className="mr-3 text-yellow-400" /> Get Help from Volunteers
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-emerald-900/80 p-4 rounded-xl border border-emerald-700 hover:bg-emerald-800 transition-colors">
                    <FaUtensils className="mx-auto mb-2 text-2xl text-yellow-400" /> 
                    <span className="text-lg font-medium">Food</span>
                  </div>
                  <div className="bg-emerald-900/80 p-4 rounded-xl border border-emerald-700 hover:bg-emerald-800 transition-colors">
                    <FaPills className="mx-auto mb-2 text-2xl text-red-400" /> 
                    <span className="text-lg font-medium">Medicine</span>
                  </div>
                  <div className="bg-emerald-900/80 p-4 rounded-xl border border-emerald-700 hover:bg-emerald-800 transition-colors">
                    <FaCar className="mx-auto mb-2 text-2xl text-blue-400" /> 
                    <span className="text-lg font-medium">Transport</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Login form */}
        <div className="md:w-3/5 p-10 md:p-14 flex flex-col justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="max-w-lg mx-auto w-full">
            <h2 className="text-4xl font-bold text-white mb-3">Log In</h2>
            <p className="text-gray-300 text-xl mb-10">Welcome back! Please enter your details</p>
            
            {/* Error Message Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-200 text-lg">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <label className="block text-gray-200 text-xl font-medium mb-4" htmlFor="email">
                  <FaUser className="inline mr-3 text-blue-400" /> Email Address
                </label>
                <div className="relative">
                  <input
                    type="email" // Changed to email type
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-5 pl-14 text-xl bg-gray-700 border-2 border-gray-600 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white placeholder-gray-400"
                    placeholder="Enter your email address"
                    required
                  />
                  <FaUser className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-2xl" />
                </div>
              </div>
              
              <div className="mb-8">
                <label className="block text-gray-200 text-xl font-medium mb-4" htmlFor="password">
                  <FaLock className="inline mr-3 text-blue-400" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-5 pl-14 text-xl bg-gray-700 border-2 border-gray-600 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 outline-none transition-all text-white placeholder-gray-400"
                    placeholder="Enter your password"
                    required
                  />
                  <FaLock className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-2xl" />
                  <button
                    type="button"
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash size={28} /> : <FaEye size={28} />}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
                <div className="flex items-center mb-5 sm:mb-0">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="h-7 w-7 text-blue-500 rounded-lg focus:ring-blue-600 bg-gray-700 border-gray-600"
                  />
                  <label htmlFor="remember" className="ml-4 text-gray-200 text-xl cursor-pointer">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-300 font-medium text-xl transition-colors hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white text-2xl font-semibold py-5 px-6 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] mb-8 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-95'}`}
              >
                {loading ? 'Logging In...' : 'Log In'}
              </button>
              
              <div className="text-center mb-10">
                <p className="text-gray-300 text-xl">
                  Need help to Sign in? 
                  <button type="button" className="text-blue-400 hover:text-blue-300 font-medium ml-3 hover:underline">
                    Click here for assistance
                  </button>
                </p>
              </div>
              
              <div className="flex items-center my-8">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="mx-6 text-gray-400 text-2xl">or</span>
                <div className="flex-grow border-t border-gray-600"></div>
              </div>
              
              <button
                type="button"
                onClick={handleRegisterRedirect}
                className="w-full py-5 text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:opacity-95 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                Create New Account
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <footer className="mt-10 text-center text-gray-400">
        <p className="text-xl">© 2023 Eldercare Community. A safe space for seniors.</p>
      </footer>
    </div>
  );
};

export default ElderlyLoginForm;