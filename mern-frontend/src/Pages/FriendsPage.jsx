// src/Pages/FriendsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import {
  Search,
  Users,
  Heart,
  HelpCircle,
  MapPin,
  Filter,
  ChevronRight,
  MessageCircle,
  ExternalLink,
  UserPlus,
  UserCheck,
  UserMinus
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useLanguage } from "../context/LanguageContext";
import useTranslation from "../hooks/useTranslation";

const FriendsPage = () => {
  const navigate = useNavigate();
  const { getTranslation } = useLanguage();
  const { t } = useTranslation();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [followingStatus, setFollowingStatus] = useState({});
  const [followLoading, setFollowLoading] = useState({});

  // Translation helper functions
  const getLoadingText = () => {
    return getTranslation("Loading community members...", "ප්‍රජා සාමාජිකයන් පූරණය වෙමින්...");
  };

  const getCommunityFriendsTitle = () => {
    return getTranslation("Community Friends", "ප්‍රජා මිතුරන්");
  };

  const getCommunityFriendsSubtitle = () => {
    return getTranslation(
      "Connect with fellow seniors who share your interests and hobbies",
      "ඔබගේ උනන්දුව සහ විනෝදාංශ බෙදාගන්නා සෙසු වැඩිහිටියන් සමඟ සම්බන්ධ වන්න"
    );
  };

  const getTotalMembers = () => {
    return getTranslation("Total Members", "සම්පූර්ණ සාමාජිකයින්");
  };

  const getSearchPlaceholder = () => {
    return getTranslation(
      "Search by name, hobby, or interest...",
      "නම, විනෝදාංශය, හෝ උනන්දුව අනුව සොයන්න..."
    );
  };

  const getSuggestedForYou = () => {
    return getTranslation("Suggested For You", "ඔබ වෙනුවෙන් යෝජනා කෙරේ");
  };

  const getFilterBy = () => {
    return getTranslation("Filter By", "පෙරහන් කරන්න");
  };

  const getFilterOptions = () => {
    return [
      { id: "all", label: getTranslation("All Members", "සියලුම සාමාජිකයින්"), icon: Users, color: "text-gray-600" },
      { id: "following", label: getTranslation("Following", "අනුගමනය කරන"), icon: UserCheck, color: "text-green-600" },
      { id: "not-following", label: getTranslation("Not Following", "අනුගමනය නොකරන"), icon: UserPlus, color: "text-blue-600" },
      { id: "high-match", label: getTranslation("High Match (70%+)", "ඉහළ ගැලපීම (70%+)"), icon: Heart, color: "text-red-600" },
      { id: "same-city", label: getTranslation("Same City", "එකම නගරය"), icon: MapPin, color: "text-blue-600" },
    ];
  };

  const getStatsLabels = () => {
    return {
      averageMatch: getTranslation("Average Match", "සාමාන්‍ය ගැලපීම"),
      following: getTranslation("Following", "අනුගමනය කරන"),
      sharedHobbies: getTranslation("Shared Hobbies", "බෙදාගත් විනෝදාංශ")
    };
  };

  const getSharedInterests = () => {
    return getTranslation("Shared Interests", "බෙදාගත් උනන්දුව");
  };

  const getCanHelpWith = () => {
    return getTranslation("Can Help With", "උදව් කළ හැකි");
  };

  const getFollowingButton = () => {
    return getTranslation("Following", "අනුගමනය කරයි");
  };

  const getFollowButton = () => {
    return getTranslation("Follow", "අනුගමනය කරන්න");
  };

  const getMessageButton = () => {
    return getTranslation("Message", "පණිවුඩය");
  };

  const getProfileButton = () => {
    return getTranslation("Profile", "පැතිකඩ");
  };

  const getNoMembersFound = () => {
    return getTranslation("No members found", "සාමාජිකයින් හමු නොවීය");
  };

  const getShowAllMembers = () => {
    return getTranslation("Show All Members", "සියලුම සාමාජිකයින් පෙන්වන්න");
  };

  const getMatchText = (percentage) => {
    return getTranslation("match", "ගැලපීම");
  };

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('elderlyUser');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
    
    fetchAllUsers();
    fetchSuggestedFriends();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, activeFilter]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/elderly/users/all");
      if (response.data.success) {
        setUsers(response.data.users);
        
        // Check follow status for each user
        response.data.users.forEach(user => {
          checkFollowStatus(user._id);
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedFriends = async () => {
    try {
      const response = await axios.get("/elderly/users/suggested?limit=3");
      if (response.data.success) {
        setSuggestedFriends(response.data.users);
      }
    } catch (error) {
      console.error("Error fetching suggested friends:", error);
    }
  };

  const checkFollowStatus = async (userId) => {
    try {
      const response = await axios.get(`/follow/status/${userId}`);
      if (response.data.success) {
        setFollowingStatus(prev => ({
          ...prev,
          [userId]: response.data.isFollowing
        }));
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async (userId) => {
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await axios.post(`/follow/follow/${userId}`);
      if (response.data.success) {
        setFollowingStatus(prev => ({
          ...prev,
          [userId]: true
        }));
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, isFollowing: true }
              : user
          )
        );
      }
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnfollow = async (userId) => {
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await axios.delete(`/follow/unfollow/${userId}`);
      if (response.data.success) {
        setFollowingStatus(prev => ({
          ...prev,
          [userId]: false
        }));
        
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, isFollowing: false }
              : user
          )
        );
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.hobbies || []).some((hobby) =>
            hobby.toLowerCase().includes(searchQuery.toLowerCase()),
          ) ||
          (user.helpNeeded || []).some((help) =>
            help.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    switch (activeFilter) {
      case "following":
        filtered = filtered.filter((user) => followingStatus[user._id]);
        break;
      case "not-following":
        filtered = filtered.filter((user) => !followingStatus[user._id]);
        break;
      case "high-match":
        filtered = filtered.filter((user) => user.matchPercentage >= 70);
        break;
      case "same-city":
        filtered = filtered.filter((user) => user.city === currentUser?.city);
        break;
      default:
        break;
    }

    setFilteredUsers(filtered);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchAllUsers();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `/elderly/users/search?query=${searchQuery}`,
      );
      if (response.data.success) {
        setUsers(response.data.users);
        response.data.users.forEach(user => {
          checkFollowStatus(user._id);
        });
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageUser = (userId) => {
    navigate(`/chat?user=${userId}`);
  };

  const getMatchColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getMatchTextColor = (percentage) => {
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 60) return "text-blue-500";
    if (percentage >= 40) return "text-yellow-500";
    return "text-orange-500";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar user={currentUser} />
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{getLoadingText()}</p>
          </div>
        </div>
      </div>
    );
  }

  const statsLabels = getStatsLabels();
  const filterOptions = getFilterOptions();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={currentUser} />
      <div className="ml-32 flex-1 flex flex-col">
        <Navbar user={currentUser} />

        <div className="flex-1 p-6 bg-gradient-to-br from-gray-50 to-blue-50">
          {/* Header with Stats */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {getCommunityFriendsTitle()}
                </h1>
                <p className="text-gray-600 mt-2">
                  {getCommunityFriendsSubtitle()}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="bg-white rounded-xl shadow-sm p-4 min-w-[200px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{getTotalMembers()}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {users.length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Search & Filters */}
            <div className="lg:col-span-1 space-y-6">
              {/* Search Box */}
              <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={getSearchPlaceholder()}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
                    />
                  </div>
                </form>
              </div>

              {/* Suggested Friends */}
              <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Heart className="h-5 w-5 text-red-500 mr-2" />
                  {getSuggestedForYou()}
                </h3>
                <div className="space-y-4">
                  {suggestedFriends.map((user, index) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={user.profilePhoto || "/default-avatar.png"}
                            alt={user.firstName}
                            className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                          <div
                            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${getMatchColor(user.matchPercentage)}`}
                          ></div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600">
                            {user.firstName} {user.lastName.charAt(0)}.
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={`text-xs font-bold ${getMatchTextColor(user.matchPercentage)}`}
                            >
                              {user.matchPercentage}% {getMatchText(user.matchPercentage)}
                            </span>
                            {user.commonHobbies?.length > 0 && (
                              <span className="text-xs text-gray-500">
                                • {user.commonHobbies[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate(`/profile/${user._id}`)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Filter className="h-5 w-5 text-gray-500 mr-2" />
                  {getFilterBy()}
                </h3>
                <div className="space-y-2">
                  {filterOptions.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                        activeFilter === filter.id
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center">
                        <filter.icon
                          className={`h-5 w-5 mr-3 ${filter.color}`}
                        />
                        <span className="font-medium">{filter.label}</span>
                      </div>
                      {activeFilter === filter.id && (
                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content - User Cards */}
            <div className="lg:col-span-3">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-2xl shadow-sm p-5 border border-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{statsLabels.averageMatch}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {users.length > 0
                          ? Math.round(
                              users.reduce(
                                (acc, user) => acc + (user.matchPercentage || 0),
                                0,
                              ) / users.length,
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                      <Heart className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-100 rounded-2xl shadow-sm p-5 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{statsLabels.following}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Object.values(followingStatus).filter(Boolean).length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-100 rounded-2xl shadow-sm p-5 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{statsLabels.sharedHobbies}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {users.filter((u) => u.commonHobbies?.length > 0).length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
                      <HelpCircle className="h-6 w-6 text-purple-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* User Grid */}
              {filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                    >
                      {/* Header with Cover Photo */}
                      <div 
                        className="relative h-32 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${user.coverPhoto || 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/eldercare/defaults/default-cover.jpg'})`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        
                        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 z-10">
                          <div className="relative">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1 shadow-lg">
                              <img
                                src={user.profilePhoto || "/default-avatar.png"}
                                alt={user.firstName}
                                className="h-full w-full rounded-full object-cover border-4 border-white"
                              />
                            </div>
                            <div
                              className={`absolute -bottom-2 -right-2 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${getMatchColor(user.matchPercentage)} border-4 border-white shadow-lg`}
                            >
                              {user.matchPercentage}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="pt-16 pb-6 px-6">
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {user.firstName} {user.lastName}
                          </h3>
                          <div className="flex items-center justify-center mt-2 space-x-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {user.city}, {user.state}
                            </span>
                          </div>
                          <div className="mt-3">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200">
                              {user.mobility?.replace("_", " ") || getTranslation("Independent", "ස්වාධීන")}
                            </span>
                          </div>
                        </div>

                        {/* Common Interests */}
                        <div className="space-y-4">
                          {user.commonHobbies?.length > 0 && (
                            <div>
                              <div className="flex items-center text-sm text-gray-500 mb-2">
                                <Heart className="h-4 w-4 mr-2 text-red-500" />
                                <span>{getSharedInterests()}</span>
                                <span className="ml-auto font-medium text-gray-900">
                                  {user.commonHobbies.length}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {user.commonHobbies
                                  .slice(0, 3)
                                  .map((hobby, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1.5 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 rounded-lg text-xs font-medium border border-red-100"
                                    >
                                      {hobby}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}

                          {user.commonHelp?.length > 0 && (
                            <div>
                              <div className="flex items-center text-sm text-gray-500 mb-2">
                                <HelpCircle className="h-4 w-4 mr-2 text-blue-500" />
                                <span>{getCanHelpWith()}</span>
                                <span className="ml-auto font-medium text-gray-900">
                                  {user.commonHelp.length}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {user.commonHelp
                                  .slice(0, 2)
                                  .map((help, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100"
                                    >
                                      {help}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <div className="flex flex-col space-y-2">
                            {followingStatus[user._id] ? (
                              <button
                                onClick={() => handleUnfollow(user._id)}
                                disabled={followLoading[user._id]}
                                className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                              >
                                {followLoading[user._id] ? (
                                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <>
                                    <UserMinus className="h-4 w-4" />
                                    <span>{getFollowingButton()}</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleFollow(user._id)}
                                disabled={followLoading[user._id]}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                              >
                                {followLoading[user._id] ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4" />
                                    <span>{getFollowButton()}</span>
                                  </>
                                )}
                              </button>
                            )}

                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleMessageUser(user._id)}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2 px-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 text-sm"
                              >
                                <MessageCircle className="h-3 w-3" />
                                <span>{getMessageButton()}</span>
                              </button>
                              <button 
                                onClick={() => navigate(`/profile/${user._id}`)}
                                className="flex-1 border border-gray-300 hover:border-blue-400 hover:bg-blue-50 py-2 px-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>{getProfileButton()}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="inline-flex h-24 w-24 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 items-center justify-center mb-6">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {getNoMembersFound()}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    {searchQuery
                      ? getTranslation(
                          `No members found for "${searchQuery}". Try a different search term.`,
                          `"${searchQuery}" සඳහා සාමාජිකයින් හමු නොවීය. වෙනත් සෙවුම් පදයක් උත්සාහ කරන්න.`
                        )
                      : getTranslation(
                          "No members match your current filters. Try changing your filter settings.",
                          "ඔබගේ වත්මන් පෙරහන් වලට ගැලපෙන සාමාජිකයින් නොමැත. කරුණාකර ඔබගේ පෙරහන් සැකසුම් වෙනස් කරන්න."
                        )}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                      fetchAllUsers();
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {getShowAllMembers()}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;