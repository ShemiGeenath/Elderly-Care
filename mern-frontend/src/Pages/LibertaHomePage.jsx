// src/Pages/LibertaHomePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaMapMarkerAlt,
  FaHeart,
  FaComment as FaCommentIcon,
  FaShare,
  FaImage,
  FaVideo,
  FaSmile,
  FaEllipsisH,
  FaUserPlus,
  FaUserCheck
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosConfig";
import FloatingChatbot from '../components/FloatingChatbot';
import { useLanguage } from '../context/LanguageContext';
import useTranslation from '../hooks/useTranslation';

const LibertaHomePage = () => {
  const { getTranslation } = useLanguage();
  const { t } = useTranslation();
  
  const [user, setUser] = useState(null);
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [followingCount, setFollowingCount] = useState(0);
  const navigate = useNavigate();

  // Translation helper functions with larger text for elderly
  const getLoadingText = () => getTranslation("Loading...", "පූරණය වෙමින්...");
  const getYourFeed = () => getTranslation("Your Feed", "ඔබගේ පෝෂකය");
  const getShowingPostsFrom = (count, personText, peopleText) => {
    return getTranslation(
      `Showing posts from ${count} ${count === 1 ? personText : peopleText} you follow`,
      `ඔබ අනුගමනය කරන පුද්ගලයින් ${count} දෙනෙකුගේ පළ කිරීම් පෙන්වමින්`
    );
  };
  const getDiscoverPeople = () => getTranslation("Discover People", "පුද්ගලයින් සොයා ගන්න");
  const getWhatsOnYourMind = (firstName) => getTranslation(`What's on your mind, ${firstName}?`, `${firstName}, ඔබේ සිතේ ඇත්තේ කුමක්ද?`);
  const getPhotoVideo = () => getTranslation("Photo/Video", "ඡායාරූපය/වීඩියෝව");
  const getIdeaActivity = () => getTranslation("Idea/Activity", "අදහස/ක්‍රියාකාරකම");
  const getFeeling = () => getTranslation("Feeling", "හැඟීම");
  const getPost = () => getTranslation("Post", "පළ කරන්න");
  const getPosting = () => getTranslation("Posting...", "පළ කරමින්...");
  const getLikes = () => getTranslation("likes", "කැමති");
  const getComments = () => getTranslation("comments", "අදහස්");
  const getShares = () => getTranslation("shares", "බෙදාගැනීම්");
  const getLike = () => getTranslation("Like", "කැමතියි");
  const getLiked = () => getTranslation("Liked", "කැමති විය");
  const getComment = () => getTranslation("Comment", "අදහස් දක්වන්න");
  const getShare = () => getTranslation("Share", "බෙදාගන්න");
  const getWriteComment = () => getTranslation("Write a comment...", "අදහසක් ලියන්න...");
  const getNoPostsInFeed = () => getTranslation("No Posts in Your Feed", "ඔබගේ පෝෂකයේ පළ කිරීම් නැත");
  const getNotFollowingAnyone = () => getTranslation(
    "You're not following anyone yet, or the people you follow haven't posted anything.",
    "ඔබ තවම කිසිවෙකු අනුගමනය නොකරයි, නැතහොත් ඔබ අනුගමනය කරන පුද්ගලයින් කිසිවක් පළ කර නැත."
  );
  const getFindPeopleToFollow = () => getTranslation("Find People to Follow", "අනුගමනය කිරීමට පුද්ගලයින් සොයන්න");
  const getLoadingPosts = () => getTranslation("Loading posts...", "පළ කිරීම් පූරණය වෙමින්...");
  
  // Footer text
  const getConnectChatEnjoy = () => getTranslation("Connect • Chat • Enjoy", "සම්බන්ධ වන්න • කතාබස් කරන්න • භුක්ති විඳින්න");

  // Error messages
  const getFileTooLarge = () => getTranslation("File size too large. Maximum size is 10MB.", "ගොනු ප්‍රමාණය ඉතා විශාලයි. උපරිම ප්‍රමාණය 10MB වේ.");
  const getCouldNotPost = () => getTranslation("Could not post. Check your connection.", "පළ කළ නොහැක. ඔබගේ සම්බන්ධතාවය පරීක්ෂා කරන්න.");

  useEffect(() => {
    const token = localStorage.getItem("elderlyToken");

    if (!token) {
      navigate("/");
      return;
    }

    const userData = localStorage.getItem("elderlyUser");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchFeedPosts();
      } catch (error) {
        console.error("Invalid user data");
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  const fetchFeedPosts = async () => {
    try {
      const response = await axiosInstance.get("/follow/feed");
      if (response.data.success) {
        setPosts(response.data.posts);
        setFollowingCount(response.data.followingCount || 0);
      }
    } catch (error) {
      console.error("Error fetching feed posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("elderlyUser");
    localStorage.removeItem("elderlyToken");
    navigate("/login");
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedFile) return;

    const formData = new FormData();
    formData.append('content', newPost);
    formData.append('postType', 'text');
    
    if (selectedFile) {
      formData.append('media', selectedFile); 
    }

    try {
      setIsUploading(true);
      const response = await axiosInstance.post("/elderly/posts", formData);

      if (response.data.success) {
        setPosts([response.data.post, ...posts]);
        setNewPost("");
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert(getCouldNotPost());
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await axiosInstance.post(`/elderly/posts/${postId}/like`);
      fetchFeedPosts();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentInput.trim()) return;

    try {
      await axiosInstance.post(`/elderly/posts/${postId}/comment`, {
        content: commentInput
      });
      
      fetchFeedPosts();
      setCommentInput("");
      setActiveCommentPost(null);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert(getFileTooLarge());
        return;
      }
      setSelectedFile(file);
    }
  };

  const goToUserProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-2xl">{getLoadingText()}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="hidden md:block">
        <Sidebar user={user} onLogout={handleLogout} />
      </div>
      
      <div className="md:ml-20 flex flex-col min-h-screen">
        <Navbar user={user} />
        
        <main className="flex-1 overflow-y-auto bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
            
            {/* Following Info - ENLARGED */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{getYourFeed()}</h2>
                  <p className="text-base sm:text-lg md:text-xl opacity-90 mt-2 sm:mt-3">
                    {getShowingPostsFrom(followingCount, 'person', 'people')}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/FriendsPage')}
                  className="bg-white/20 hover:bg-white/30 px-5 sm:px-7 py-3 sm:py-4 rounded-xl text-base sm:text-lg md:text-xl font-medium transition flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center"
                >
                  <FaUserPlus className="text-lg sm:text-xl" />
                  {getDiscoverPeople()}
                </button>
              </div>
            </div>

            {/* Create Post Section - ENLARGED */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5 sm:p-6 md:p-7 mb-6 sm:mb-8">
              <div className="flex items-start space-x-4 sm:space-x-5 md:space-x-6 mb-5 sm:mb-6">
                <img 
                  src={user.profilePhoto} 
                  alt={user.firstName}
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full cursor-pointer"
                  onClick={() => goToUserProfile(user.id)}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0ea5e9&color=fff&size=64`;
                  }}
                />
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder={getWhatsOnYourMind(user.firstName)}
                    className="w-full p-3 sm:p-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-base sm:text-lg"
                    rows="3"
                  />
                  
                  {selectedFile && (
                    <div className="mt-3 sm:mt-4 relative">
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Preview" 
                        className="max-h-40 sm:max-h-56 rounded-xl"
                      />
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black transition-colors text-base"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 sm:gap-5 border-t border-gray-700 pt-4 sm:pt-5">
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <label className="flex items-center text-gray-400 hover:text-green-400 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl hover:bg-gray-700 transition-colors cursor-pointer text-base sm:text-lg gap-2">
                    <FaImage className="text-lg sm:text-xl" />
                    {getPhotoVideo()}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <button className="flex items-center text-gray-400 hover:text-purple-400 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl hover:bg-gray-700 transition-colors text-base sm:text-lg gap-2">
                    <FaVideo className="text-lg sm:text-xl" />
                    {getIdeaActivity()}
                  </button>
                  <button className="flex items-center text-gray-400 hover:text-yellow-400 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl hover:bg-gray-700 transition-colors text-base sm:text-lg gap-2">
                    <FaSmile className="text-lg sm:text-xl" />
                    {getFeeling()}
                  </button>
                </div>
                <button
                  onClick={handleCreatePost}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-base sm:text-lg"
                  disabled={(!newPost.trim() && !selectedFile) || isUploading}
                >
                  {isUploading ? getPosting() : getPost()}
                </button>
              </div>
            </div>

            {/* Posts Feed - ENLARGED */}
            <div className="space-y-5 sm:space-y-6 md:space-y-7">
              {loading ? (
                <div className="text-center py-10 sm:py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 border-t-2 border-b-2 border-cyan-500"></div>
                  <p className="text-gray-400 mt-4 sm:mt-5 text-base sm:text-lg">{getLoadingPosts()}</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 sm:p-10 text-center">
                  <div className="text-6xl sm:text-7xl mb-4 sm:mb-5">📭</div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">{getNoPostsInFeed()}</h3>
                  <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-7 max-w-md mx-auto">
                    {getNotFollowingAnyone()}
                  </p>
                  <button
                    onClick={() => navigate('/FriendsPage')}
                    className="px-7 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-blue-700 transition-colors text-base sm:text-lg"
                  >
                    {getFindPeopleToFollow()}
                  </button>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post._id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                    {/* Post Header - ENLARGED */}
                    <div className="p-4 sm:p-5 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <img 
                            src={post.user?.profilePhoto} 
                            alt={post.user?.firstName}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => goToUserProfile(post.user?._id)}
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${post.user?.firstName}+${post.user?.lastName}&background=0ea5e9&color=fff&size=56`;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 
                              className="font-bold text-white truncate cursor-pointer hover:text-cyan-400 transition-colors text-base sm:text-lg md:text-xl"
                              onClick={() => goToUserProfile(post.user?._id)}
                            >
                              {post.user?.firstName} {post.user?.lastName}
                            </h4>
                            <div className="text-sm sm:text-base text-gray-400 mt-1 flex items-center gap-2">
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                              {post.location && (
                                <>
                                  <span>-</span>
                                  <span className="flex items-center gap-1">
                                    {post.location}
                                    <FaMapMarkerAlt className="text-xs sm:text-sm" />
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button className="p-2 sm:p-3 hover:bg-gray-700 rounded-full transition-colors">
                          <FaEllipsisH className="text-gray-400 text-base sm:text-lg" />
                        </button>
                      </div>
                    </div>

                    {/* Post Content - ENLARGED */}
                    <div className="p-4 sm:p-5">
                      <p className="text-white mb-4 sm:mb-5 break-words text-base sm:text-lg md:text-xl leading-relaxed">
                        {post.content}
                      </p>
                      
                      {post.media && post.media.length > 0 && (
                        <div className="mb-4 sm:mb-5 rounded-xl overflow-hidden">
                          <img 
                            src={post.media[0].url} 
                            alt="Post media"
                            className="w-full max-h-80 sm:max-h-96 object-contain"
                          />
                        </div>
                      )}
                      
                      {/* Post Stats - ENLARGED */}
                      <div className="flex items-center justify-between text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                          <span className="font-medium">{post.likes?.length || 0} {getLikes()}</span>
                          <span className="font-medium">{post.comments?.length || 0} {getComments()}</span>
                          <span className="font-medium">{post.shares?.length || 0} {getShares()}</span>
                        </div>
                      </div>
                      
                      {/* Post Actions - ENLARGED */}
                      <div className="flex border-t border-gray-700 pt-3 sm:pt-4">
                        <button 
                          onClick={() => handleLike(post._id)}
                          className={`flex-1 flex items-center justify-center py-2.5 sm:py-3 rounded-xl transition-colors text-base sm:text-lg font-medium gap-2 ${
                            post.likes?.includes(user?.id)
                              ? 'text-red-500 bg-gray-700'
                              : 'text-gray-400 hover:text-red-500 hover:bg-gray-700'
                          }`}
                        >
                          <FaHeart className="text-lg sm:text-xl" />
                          {post.likes?.includes(user?.id) ? getLiked() : getLike()}
                        </button>
                        <button 
                          onClick={() => setActiveCommentPost(activeCommentPost === post._id ? null : post._id)}
                          className="flex-1 flex items-center justify-center py-2.5 sm:py-3 text-gray-400 hover:text-green-500 hover:bg-gray-700 rounded-xl transition-colors text-base sm:text-lg font-medium gap-2"
                        >
                          <FaCommentIcon className="text-lg sm:text-xl" />
                          {getComment()}
                        </button>
                        <button className="flex-1 flex items-center justify-center py-2.5 sm:py-3 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-xl transition-colors text-base sm:text-lg font-medium gap-2">
                          <FaShare className="text-lg sm:text-xl" />
                          {getShare()}
                        </button>
                      </div>
                      
                      {/* Comment Section - ENLARGED */}
                      {activeCommentPost === post._id && (
                        <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-700">
                          {post.comments && post.comments.length > 0 && (
                            <div className="mb-4 sm:mb-5 space-y-3 sm:space-y-4">
                              {post.comments.map((comment, index) => (
                                <div key={index} className="flex gap-3 sm:gap-4">
                                  <img 
                                    src={comment.user?.profilePhoto}
                                    alt={comment.user?.firstName}
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full cursor-pointer hover:opacity-80"
                                    onClick={() => goToUserProfile(comment.user?._id)}
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${comment.user?.firstName}+${comment.user?.lastName}&background=0ea5e9&color=fff&size=48`;
                                    }}
                                  />
                                  <div className="flex-1 bg-gray-700 rounded-xl p-3 sm:p-4">
                                    <p 
                                      className="font-semibold text-white text-sm sm:text-base cursor-pointer hover:text-cyan-400"
                                      onClick={() => goToUserProfile(comment.user?._id)}
                                    >
                                      {comment.user?.firstName} {comment.user?.lastName}
                                    </p>
                                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed mt-1">
                                      {comment.content}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                                      {new Date(comment.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Comment - ENLARGED */}
                          <div className="flex gap-3 sm:gap-4">
                            <img 
                              src={user.profilePhoto} 
                              alt="You"
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full cursor-pointer"
                              onClick={() => goToUserProfile(user.id)}
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0ea5e9&color=fff&size=48`;
                              }}
                            />
                            <div className="flex-1">
                              <textarea
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder={getWriteComment()}
                                className="w-full p-3 sm:p-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm sm:text-base"
                                rows="2"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end mt-3 sm:mt-4">
                            <button
                              onClick={() => handleAddComment(post._id)}
                              className="px-5 sm:px-6 py-2 sm:py-2.5 bg-cyan-600 text-white rounded-xl text-sm sm:text-base font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
                              disabled={!commentInput.trim()}
                            >
                              {getComment()}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer - ENLARGED */}
            <footer className="mt-8 sm:mt-10 pt-6 sm:pt-7 border-t border-gray-700">
              <div className="text-center text-gray-500">
                <p className="text-sm sm:text-base">Liberta © 2026</p>
                <p className="text-sm sm:text-base mt-2 text-cyan-400 font-medium">
                  {getConnectChatEnjoy()}
                </p>
              </div>
            </footer>
          </div>
        </main>
      </div>
      <FloatingChatbot />
    </div>
  );
};

export default LibertaHomePage;