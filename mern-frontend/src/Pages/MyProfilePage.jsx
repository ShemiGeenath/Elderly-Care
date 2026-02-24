// pages/MyProfilePage.jsx (updated with cover photo functionality)

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaCamera, FaEdit, FaHeart, FaComment, FaShare, FaMapMarkerAlt,
  FaCalendarAlt, FaUsers, FaImage, FaVideo, FaGlobeAmericas,
  FaEllipsisH, FaSmile, FaTag, FaPoll, FaBirthdayCake,
  FaPhone, FaEnvelope, FaExclamationTriangle, FaWheelchair,
  FaHeartbeat, FaPlus, FaTimes, FaTrash
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../api/axiosConfig";
import { format } from 'date-fns';

const MyProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Photo upload states
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showCoverOptions, setShowCoverOptions] = useState(false);

  // Post creation states
  const [newPost, setNewPost] = useState("");
  const [postPrivacy, setPostPrivacy] = useState("public");
  const [postTags, setPostTags] = useState([]);
  const [currentTag, setCurrentTag] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);

  // Comment states
  const [newComment, setNewComment] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showComments, setShowComments] = useState({});

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Post options menu
  const [showPostOptions, setShowPostOptions] = useState(null);

  // Share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState(null);
  const [shareContent, setShareContent] = useState("");

  // Stats
  const [stats, setStats] = useState({
    postsCount: 0,
    friendsCount: 0,
    likesReceived: 0
  });

  /* =======================
     INITIAL LOAD & AUTH CHECK
     ======================= */
  useEffect(() => {
    const token = localStorage.getItem("elderlyToken");
    const userData = localStorage.getItem("elderlyUser");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setCurrentUser(parsedUser);
    } catch (err) {
      navigate("/login");
      return;
    }

    if (!id) {
      const parsedUser = JSON.parse(userData);
      navigate(`/profile/${parsedUser.id}`, { replace: true });
      return;
    }

    loadProfileData(id);
  }, [id, navigate]);

  /* =======================
     LOAD PROFILE DATA
     ======================= */
  const loadProfileData = async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const [profileRes, postsRes] = await Promise.all([
        axiosInstance.get(`/elderly/profile/${userId}`),
        axiosInstance.get(`/elderly/posts/user/${userId}`)
      ]);

      if (profileRes.data.success) {
        setUser(profileRes.data.user);
        setEditData({
          firstName: profileRes.data.user.firstName || "",
          lastName: profileRes.data.user.lastName || "",
          bio: profileRes.data.user.bio || "",
          city: profileRes.data.user.city || "",
          state: profileRes.data.user.state || "",
          phone: profileRes.data.user.phone || "",
          birthDate: profileRes.data.user.birthDate || "",
          hobbies: profileRes.data.user.hobbies || [],
          helpNeeded: profileRes.data.user.helpNeeded || [],
          mobility: profileRes.data.user.mobility || "independent",
          emergencyContact: profileRes.data.user.emergencyContact || "",
          emergencyPhone: profileRes.data.user.emergencyPhone || ""
        });

        const posts = postsRes.data.success ? postsRes.data.posts : [];
        const likesCount = posts.reduce((total, post) => total + (post.likes?.length || 0), 0);
        
        setStats({
          postsCount: posts.length,
          friendsCount: profileRes.data.user.friendsCount || 0,
          likesReceived: likesCount
        });
      }

      if (postsRes.data.success) {
        setPosts(postsRes.data.posts);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile data");
      
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     PHOTO UPLOAD FUNCTIONS
     ======================= */
  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePhoto", file);

    try {
      setUploadingProfile(true);
      const res = await axiosInstance.post(`/elderly/profile/${id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        setUser({ ...user, profilePhoto: res.data.profilePhoto });
        
        if (String(currentUser?.id) === String(id)) {
          const updated = { ...currentUser, profilePhoto: res.data.profilePhoto };
          localStorage.setItem("elderlyUser", JSON.stringify(updated));
          setCurrentUser(updated);
        }
      }
    } catch (err) {
      console.error("Error uploading profile photo:", err);
      alert("Failed to upload profile photo");
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleCoverPhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("coverPhoto", file);

    try {
      setUploadingCover(true);
      const res = await axiosInstance.post(`/elderly/profile/${id}/cover`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        setUser({ ...user, coverPhoto: res.data.coverPhoto });
      }
    } catch (err) {
      console.error("Error uploading cover photo:", err);
      alert("Failed to upload cover photo");
    } finally {
      setUploadingCover(false);
      setShowCoverOptions(false);
    }
  };

  const handleRemoveCoverPhoto = async () => {
    if (!window.confirm("Remove cover photo?")) return;

    try {
      setUploadingCover(true);
      const res = await axiosInstance.delete(`/elderly/profile/${id}/cover`);

      if (res.data.success) {
        setUser({ ...user, coverPhoto: res.data.coverPhoto });
      }
    } catch (err) {
      console.error("Error removing cover photo:", err);
      alert("Failed to remove cover photo");
    } finally {
      setUploadingCover(false);
      setShowCoverOptions(false);
    }
  };

  /* =======================
     POST FUNCTIONS
     ======================= */
  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedFile) return;

    const formData = new FormData();
    formData.append("content", newPost);
    formData.append("privacy", postPrivacy);
    formData.append("tags", JSON.stringify(postTags));
    
    if (selectedFile) {
      formData.append("media", selectedFile);
    }

    try {
      setIsUploading(true);
      const res = await axiosInstance.post("/elderly/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        setPosts([res.data.post, ...posts]);
        setNewPost("");
        setPostTags([]);
        setSelectedFile(null);
        setShowPostForm(false);
        setStats(prev => ({ ...prev, postsCount: prev.postsCount + 1 }));
      }
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axiosInstance.post(`/elderly/posts/${postId}/like`);
      const res = await axiosInstance.get(`/elderly/posts/user/${id}`);
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;

    try {
      await axiosInstance.post(`/elderly/posts/${postId}/comment`, { 
        content: newComment 
      });
      
      setNewComment("");
      setSelectedPostId(null);
      
      const res = await axiosInstance.get(`/elderly/posts/user/${id}`);
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleShare = async (postId) => {
    try {
      await axiosInstance.post(`/elderly/posts/${postId}/share`, {
        content: shareContent
      });
      
      setShareModalOpen(false);
      setPostToShare(null);
      setShareContent("");
      alert("Post shared successfully!");
    } catch (err) {
      console.error("Error sharing post:", err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await axiosInstance.delete(`/elderly/posts/${postId}`);
      setPosts(posts.filter(p => p._id !== postId));
      setStats(prev => ({ ...prev, postsCount: prev.postsCount - 1 }));
      setShowPostOptions(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post");
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !postTags.includes(currentTag.trim())) {
      setPostTags([...postTags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setPostTags(postTags.filter(tag => tag !== tagToRemove));
  };

  /* =======================
     PROFILE FUNCTIONS
     ======================= */
  const handleUpdateProfile = async () => {
    try {
      const res = await axiosInstance.put(`/elderly/profile/${id}`, editData);
      
      if (res.data.success) {
        setUser(res.data.user);
        setIsEditing(false);

        if (String(currentUser?.id) === String(id)) {
          const updated = { ...currentUser, ...res.data.user };
          localStorage.setItem("elderlyUser", JSON.stringify(updated));
          setCurrentUser(updated);
        }
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    }
  };

  const handleAddHobby = (hobby) => {
    if (hobby && !editData.hobbies.includes(hobby)) {
      setEditData({
        ...editData,
        hobbies: [...editData.hobbies, hobby]
      });
    }
  };

  const handleRemoveHobby = (hobbyToRemove) => {
    setEditData({
      ...editData,
      hobbies: editData.hobbies.filter(h => h !== hobbyToRemove)
    });
  };

  const handleAddHelpNeeded = (help) => {
    if (help && !editData.helpNeeded.includes(help)) {
      setEditData({
        ...editData,
        helpNeeded: [...editData.helpNeeded, help]
      });
    }
  };

  const handleRemoveHelpNeeded = (helpToRemove) => {
    setEditData({
      ...editData,
      helpNeeded: editData.helpNeeded.filter(h => h !== helpToRemove)
    });
  };

  /* =======================
     HELPER FUNCTIONS
     ======================= */
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const isOwnProfile = String(currentUser?.id) === String(id);

  /* =======================
     LOADING / ERROR UI
     ======================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-400 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 p-8 rounded-xl max-w-md">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error || "User not found"}</p>
          <button
            onClick={() => navigate("/liberta-home")}
            className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  /* =======================
     MAIN RENDER
     ======================= */
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex">
        <Sidebar user={currentUser} onLogout={handleLogout} />
        
        <div className="flex-1">
          <Navbar user={currentUser} />

          {/* Main Content */}
          <div className="max-w-4xl mx-auto px-4 py-8">
            
            {/* Cover Photo Section - UPDATED */}
            <div className="bg-gray-800 rounded-xl overflow-hidden mb-6">
              {/* Cover Photo */}
              <div 
                className="h-64 bg-cover bg-center relative"
                style={{ 
                  backgroundImage: `url(${user.coverPhoto || 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/eldercare/defaults/default-cover.jpg'})`,
                  backgroundColor: '#1f2937'
                }}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                
                {/* Cover Photo Controls - Only for own profile */}
                {isOwnProfile && (
                  <div className="absolute bottom-4 right-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowCoverOptions(!showCoverOptions)}
                        className="bg-gray-900/80 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition backdrop-blur-sm"
                        disabled={uploadingCover}
                      >
                        {uploadingCover ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FaCamera /> Change Cover
                          </>
                        )}
                      </button>

                      {/* Cover Options Dropdown */}
                      {showCoverOptions && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-10">
                          <label className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer rounded-t-lg">
                            <FaCamera className="inline mr-2" />
                            Upload Photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverPhotoUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            onClick={handleRemoveCoverPhoto}
                            className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 rounded-b-lg"
                          >
                            <FaTrash className="inline mr-2" />
                            Remove Photo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Picture Section */}
              <div className="px-6 pb-6">
                <div className="flex items-end -mt-16 mb-4">
                  <div className="relative group">
                    <img
                      src={user.profilePhoto || 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/eldercare/defaults/default-avatar.png'}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-32 h-32 rounded-xl border-4 border-gray-800 object-cover bg-gray-700"
                    />
                    {isOwnProfile && (
                      <label className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 cursor-pointer transition ${uploadingProfile ? 'opacity-100' : ''}`}>
                        {uploadingProfile ? (
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <FaCamera className="text-white text-2xl" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePhotoUpload}
                              className="hidden"
                              disabled={uploadingProfile}
                            />
                          </>
                        )}
                      </label>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold text-white">
                          {user.firstName} {user.lastName}
                        </h1>
                        <p className="text-gray-400">
                          {user.city && user.state 
                            ? `${user.city}, ${user.state}`
                            : 'Location not set'}
                        </p>
                      </div>
                      
                      {isOwnProfile && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                        >
                          <FaEdit /> Edit Profile
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.postsCount}</div>
                    <div className="text-gray-400">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.friendsCount}</div>
                    <div className="text-gray-400">Friends</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.likesReceived}</div>
                    <div className="text-gray-400">Likes Received</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of your profile content remains the same... */}
            {/* Profile Info & Posts Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Profile Info */}
              <div className="col-span-1">
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-bold text-white mb-4">About</h2>
                  
                  <div className="space-y-4">
                    {user.birthDate && (
                      <div className="flex items-start gap-3">
                        <FaBirthdayCake className="text-cyan-500 mt-1" />
                        <div>
                          <p className="text-gray-400 text-sm">Birthday</p>
                          <p className="text-white">
                            {formatDate(user.birthDate)}
                            {calculateAge(user.birthDate) && ` (${calculateAge(user.birthDate)} years)`}
                          </p>
                        </div>
                      </div>
                    )}

                    {user.phone && (
                      <div className="flex items-start gap-3">
                        <FaPhone className="text-cyan-500 mt-1" />
                        <div>
                          <p className="text-gray-400 text-sm">Phone</p>
                          <p className="text-white">{user.phone}</p>
                        </div>
                      </div>
                    )}

                    {user.email && (
                      <div className="flex items-start gap-3">
                        <FaEnvelope className="text-cyan-500 mt-1" />
                        <div>
                          <p className="text-gray-400 text-sm">Email</p>
                          <p className="text-white">{user.email}</p>
                        </div>
                      </div>
                    )}

                    {user.mobility && (
                      <div className="flex items-start gap-3">
                        <FaWheelchair className="text-cyan-500 mt-1" />
                        <div>
                          <p className="text-gray-400 text-sm">Mobility</p>
                          <p className="text-white capitalize">{user.mobility}</p>
                        </div>
                      </div>
                    )}

                    {user.hobbies && user.hobbies.length > 0 && (
                      <div className="flex items-start gap-3">
                        <FaHeart className="text-cyan-500 mt-1" />
                        <div>
                          <p className="text-gray-400 text-sm">Hobbies</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {user.hobbies.map((hobby, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm"
                              >
                                {hobby}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {user.helpNeeded && user.helpNeeded.length > 0 && (
                      <div className="flex items-start gap-3">
                        <FaHeartbeat className="text-cyan-500 mt-1" />
                        <div>
                          <p className="text-gray-400 text-sm">Help Needed</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {user.helpNeeded.map((help, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-orange-900/50 text-orange-300 rounded-full text-sm"
                              >
                                {help}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency Contact */}
                {!isOwnProfile && user.emergencyContact && (
                  <div className="bg-gray-800 rounded-xl p-6 border border-red-900/50">
                    <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                      <FaExclamationTriangle /> Emergency Contact
                    </h2>
                    <p className="text-white font-medium">{user.emergencyContact}</p>
                    <p className="text-gray-400">{user.emergencyPhone}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Posts */}
              <div className="col-span-2">
                {/* Create Post - Only for own profile */}
                {isOwnProfile && (
                  <div className="bg-gray-800 rounded-xl p-4 mb-6">
                    {!showPostForm ? (
                      <div
                        onClick={() => setShowPostForm(true)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <img
                          src={currentUser?.profilePhoto || '/default-avatar.png'}
                          alt="Your avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-full px-4 py-2 text-gray-400 transition">
                          What's on your mind?
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={currentUser?.profilePhoto || '/default-avatar.png'}
                            alt="Your avatar"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="What's on your mind?"
                            className="flex-1 bg-gray-700 text-white rounded-lg p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            autoFocus
                          />
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {postTags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-cyan-900/50 text-cyan-300 rounded-full text-sm flex items-center gap-1"
                            >
                              #{tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="hover:text-red-400"
                              >
                                <FaTimes size={12} />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add Tag */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                            placeholder="Add a tag..."
                            className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                          <button
                            onClick={addTag}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                          >
                            Add Tag
                          </button>
                        </div>

                        {/* Privacy Selector */}
                        <div className="flex items-center gap-2">
                          <select
                            value={postPrivacy}
                            onChange={(e) => setPostPrivacy(e.target.value)}
                            className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            <option value="public">Public</option>
                            <option value="friends">Friends Only</option>
                            <option value="private">Private</option>
                          </select>

                          {/* File Upload */}
                          <label className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer text-sm">
                            <FaImage />
                            {selectedFile ? selectedFile.name : 'Add Photo/Video'}
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => setSelectedFile(e.target.files[0])}
                              className="hidden"
                            />
                          </label>

                          {selectedFile && (
                            <button
                              onClick={() => setSelectedFile(null)}
                              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreatePost}
                            disabled={isUploading || (!newPost.trim() && !selectedFile)}
                            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
                          >
                            {isUploading ? 'Posting...' : 'Post'}
                          </button>
                          <button
                            onClick={() => {
                              setShowPostForm(false);
                              setNewPost("");
                              setPostTags([]);
                              setSelectedFile(null);
                            }}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Posts Feed */}
                <div className="space-y-6">
                  {posts.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-8 text-center">
                      <FaUsers className="text-6xl text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">
                        {isOwnProfile 
                          ? "You haven't posted anything yet. Share something with the community!"
                          : `${user.firstName} hasn't posted anything yet.`}
                      </p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div key={post._id} className="bg-gray-800 rounded-xl p-6">
                        {/* Post Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={post.user?.profilePhoto || '/default-avatar.png'}
                              alt="User avatar"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-semibold text-white">
                                {post.user?.firstName} {post.user?.lastName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(post.createdAt)}
                                {post.privacy !== 'public' && (
                                  <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded-full text-xs">
                                    {post.privacy}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Post Options Menu */}
                          {(isOwnProfile || String(currentUser?.id) === String(post.user?._id)) && (
                            <div className="relative">
                              <button
                                onClick={() => setShowPostOptions(showPostOptions === post._id ? null : post._id)}
                                className="p-2 hover:bg-gray-700 rounded-full transition"
                              >
                                <FaEllipsisH className="text-gray-400" />
                              </button>
                              
                              {showPostOptions === post._id && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl z-10">
                                  <button
                                    onClick={() => handleDeletePost(post._id)}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 rounded-lg"
                                  >
                                    Delete Post
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Post Content */}
                        <p className="text-white mb-4 whitespace-pre-wrap">{post.content}</p>

                        {/* Post Media */}
                        {post.media && (
                          <div className="mb-4 rounded-lg overflow-hidden">
                            {post.mediaType === 'video' ? (
                              <video src={post.media} controls className="w-full" />
                            ) : (
                              <img src={post.media} alt="Post media" className="w-full max-h-96 object-cover" />
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="text-cyan-400 text-sm"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Post Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                          <span>{post.likes?.length || 0} Likes</span>
                          <span>{post.comments?.length || 0} Comments</span>
                          <span>{post.shares?.length || 0} Shares</span>
                        </div>

                        {/* Post Actions */}
                        <div className="flex items-center gap-2 border-t border-gray-700 pt-4">
                          <button
                            onClick={() => handleLike(post._id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                              post.likes?.includes(currentUser?.id)
                                ? 'text-red-500 bg-red-500/10'
                                : 'text-gray-400 hover:text-red-500 hover:bg-gray-700'
                            }`}
                          >
                            <FaHeart /> Like
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedPostId(selectedPostId === post._id ? null : post._id);
                              toggleComments(post._id);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-cyan-500 hover:bg-gray-700 rounded-lg transition"
                          >
                            <FaComment /> Comment
                          </button>
                          
                          <button
                            onClick={() => {
                              setPostToShare(post);
                              setShareModalOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-green-500 hover:bg-gray-700 rounded-lg transition"
                          >
                            <FaShare /> Share
                          </button>
                        </div>

                        {/* Comments Section */}
                        {showComments[post._id] && (
                          <div className="mt-4 space-y-4">
                            {/* Existing Comments */}
                            {post.comments && post.comments.length > 0 && (
                              <div className="space-y-3 mb-4">
                                {post.comments.map((comment, index) => (
                                  <div key={index} className="flex gap-3">
                                    <img
                                      src={comment.user?.profilePhoto || '/default-avatar.png'}
                                      alt="Commenter"
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <div className="flex-1 bg-gray-700 rounded-lg p-3">
                                      <p className="font-semibold text-white text-sm">
                                        {comment.user?.firstName} {comment.user?.lastName}
                                      </p>
                                      <p className="text-gray-300 text-sm">{comment.content}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(comment.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Comment */}
                            {selectedPostId === post._id && (
                              <div className="flex gap-3">
                                <img
                                  src={currentUser?.profilePhoto || '/default-avatar.png'}
                                  alt="Your avatar"
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                                    placeholder="Write a comment..."
                                    className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                  />
                                  <button
                                    onClick={() => handleAddComment(post._id)}
                                    disabled={!newComment.trim()}
                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition"
                                  >
                                    Post
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal - Keep your existing edit modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">First Name</label>
                  <input
                    type="text"
                    value={editData.firstName}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editData.lastName}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Birth Date</label>
                <input
                  type="date"
                  value={editData.birthDate ? editData.birthDate.split('T')[0] : ''}
                  onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">City</label>
                  <input
                    type="text"
                    value={editData.city || ''}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">State</label>
                  <input
                    type="text"
                    value={editData.state || ''}
                    onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Mobility</label>
                <select
                  value={editData.mobility}
                  onChange={(e) => setEditData({ ...editData, mobility: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="independent">Independent</option>
                  <option value="needs_assistance">Needs Assistance</option>
                  <option value="wheelchair">Wheelchair User</option>
                  <option value="bedridden">Bedridden</option>
                </select>
              </div>

              {/* Hobbies */}
              <div>
                <label className="block text-gray-400 mb-2">Hobbies</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editData.hobbies.map((hobby, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cyan-900/50 text-cyan-300 rounded-full text-sm flex items-center gap-1"
                    >
                      {hobby}
                      <button
                        onClick={() => handleRemoveHobby(hobby)}
                        className="hover:text-red-400"
                      >
                        <FaTimes size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a hobby..."
                    className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddHobby(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.previousSibling;
                      handleAddHobby(input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              {/* Help Needed */}
              <div>
                <label className="block text-gray-400 mb-2">Help Needed</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editData.helpNeeded.map((help, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-900/50 text-orange-300 rounded-full text-sm flex items-center gap-1"
                    >
                      {help}
                      <button
                        onClick={() => handleRemoveHelpNeeded(help)}
                        className="hover:text-red-400"
                      >
                        <FaTimes size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="What help do you need?"
                    className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddHelpNeeded(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.previousSibling;
                      handleAddHelpNeeded(input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-gray-400 mb-2">Emergency Contact Name</label>
                <input
                  type="text"
                  value={editData.emergencyContact || ''}
                  onChange={(e) => setEditData({ ...editData, emergencyContact: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={editData.emergencyPhone || ''}
                  onChange={(e) => setEditData({ ...editData, emergencyPhone: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && postToShare && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Share Post</h2>
              <button
                onClick={() => {
                  setShareModalOpen(false);
                  setPostToShare(null);
                  setShareContent("");
                }}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-white mb-2">{postToShare.content}</p>
                <p className="text-xs text-gray-400">
                  Originally posted by {postToShare.user?.firstName} {postToShare.user?.lastName}
                </p>
              </div>

              <textarea
                value={shareContent}
                onChange={(e) => setShareContent(e.target.value)}
                placeholder="Add your thoughts..."
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShareModalOpen(false);
                  setPostToShare(null);
                  setShareContent("");
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleShare(postToShare._id)}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfilePage;