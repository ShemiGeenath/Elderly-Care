// LibertaHomePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaMapMarkerAlt,
  FaHeart,
  FaComment as FaCommentIcon,
  FaShare,
  FaCamera,
  FaVideo,
  FaImage,
  FaSmile,
  FaEllipsisH
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import axiosInstance from "../api/axiosConfig"; // Import axios instance

const LibertaHomePage = () => {
  const [user, setUser] = useState(null);
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const navigate = useNavigate();

useEffect(() => {
  const token = localStorage.getItem("elderlyToken");

  // STEP 9: Protect route using token
  if (!token) {
    navigate("/");
    return;
  }

  // Load user data
  const userData = localStorage.getItem("elderlyUser");
  if (userData) {
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchPosts();
    } catch (error) {
      console.error("Invalid user data");
      navigate("/");
    }
  } else {
    navigate("/");
  }
}, [navigate]);

  const fetchPosts = async () => {
    try {
      const response = await axiosInstance.get("/elderly/posts");
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("elderlyUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

 const handleCreatePost = async () => {
  if (!newPost.trim() && !selectedFile) return;

  const formData = new FormData();
  formData.append('content', newPost);
  formData.append('postType', 'text');
  
  // If you are using a file upload
  if (selectedFile) {
    formData.append('media', selectedFile); 
  }

  try {
    setIsUploading(true);
    // Note: The 'protectUser' middleware handles the userId via the Token
    const response = await axiosInstance.post("/elderly/posts", formData);

    if (response.data.success) {
      // SUCCESS: Update the UI immediately
      setPosts([response.data.post, ...posts]); // Add new post to the top
      setNewPost(""); // Clear text area
      setSelectedFile(null); // Clear image preview
    }
  } catch (error) {
    console.error("Error creating post:", error);
    alert("Could not post. Check your connection.");
  } finally {
    setIsUploading(false);
  }
};

  const handleLike = async (postId) => {
    try {
      await axiosInstance.post(`/elderly/posts/${postId}/like`, {
        userId: user?.id
      });
      
      // Update local state
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes?.includes(user?.id);
          return {
            ...post,
            likes: isLiked 
              ? post.likes.filter(id => id !== user?.id)
              : [...(post.likes || []), user?.id]
          };
        }
        return post;
      }));
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentInput.trim()) return;

    try {
      await axiosInstance.post(`/elderly/posts/${postId}/comment`, {
        userId: user?.id,
        content: commentInput
      });
      
      // Refresh posts
      fetchPosts();
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
        alert("File size too large. Maximum size is 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <Navbar user={user} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6">
            {/* Create Post Section */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
              <div className="flex items-start space-x-4 mb-4">
                <img 
                  src={user.profilePhoto} 
                  alt={user.firstName}
                  className="w-12 h-12 rounded-full"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0ea5e9&color=fff`;
                  }}
                />
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder={`What's on your Mind, ${user.firstName}?`}
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-base"
                    rows="3"
                  />
                  
                  {/* File preview */}
                  {selectedFile && (
                    <div className="mt-3 relative">
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Preview" 
                        className="max-h-48 rounded-lg"
                      />
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-gray-700 pt-4">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center text-gray-400 hover:text-green-400 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                    <FaImage className="mr-2" />
                    Photo/Video
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <button className="flex items-center text-gray-400 hover:text-purple-400 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <FaVideo className="mr-2" />
                    Idea/Activity
                  </button>
                  <button className="flex items-center text-gray-400 hover:text-yellow-400 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <FaSmile className="mr-2" />
                    Feeling
                  </button>
                </div>
                <button
                  onClick={handleCreatePost}
                  className="px-6 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  disabled={(!newPost.trim() && !selectedFile) || isUploading}
                >
                  {isUploading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
                  <p className="text-gray-400 mt-2">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
                  <h3 className="text-xl font-bold text-white mb-2">No Posts Yet</h3>
                  <p className="text-gray-400">
                    Be the first to share something!
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post._id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    {/* Post Header */}
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={post.user?.profilePhoto} 
                            alt={post.user?.firstName}
                            className="w-12 h-12 rounded-full"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${post.user?.firstName}+${post.user?.lastName}&background=0ea5e9&color=fff`;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate">
                              {post.user?.firstName} {post.user?.lastName}
                            </h4>
                            <div className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                              {post.location && (
                                <>
                                  <span>-</span>
                                  <span className="flex items-center">
                                    {post.location}
                                    <FaMapMarkerAlt className="ml-1 text-xs" />
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                          <FaEllipsisH className="text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                      <p className="text-white mb-4 break-words">{post.content}</p>
                      
                      {/* Media */}
                      {post.media && post.media.length > 0 && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <img 
                            src={post.media[0].url} 
                            alt="Post media"
                            className="w-full max-h-96 object-contain"
                          />
                        </div>
                      )}
                      
                      {/* Post Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                        <div className="flex flex-wrap items-center gap-4">
                          <span>{post.likes?.length || 0} likes</span>
                          <span>{post.comments?.length || 0} comments</span>
                          <span>{post.shares?.length || 0} shares</span>
                        </div>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex border-t border-gray-700 pt-3">
                        <button 
                          onClick={() => handleLike(post._id)}
                          className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors ${
                            post.likes?.includes(user?.id)
                              ? 'text-red-500 bg-gray-700'
                              : 'text-gray-400 hover:text-red-500 hover:bg-gray-700'
                          }`}
                        >
                          <FaHeart className="mr-2" />
                          {post.likes?.includes(user?.id) ? 'Liked' : 'Like'}
                        </button>
                        <button 
                          onClick={() => setActiveCommentPost(activeCommentPost === post._id ? null : post._id)}
                          className="flex-1 flex items-center justify-center py-2 text-gray-400 hover:text-green-500 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <FaCommentIcon className="mr-2" />
                          Comment
                        </button>
                        <button className="flex-1 flex items-center justify-center py-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors">
                          <FaShare className="mr-2" />
                          Share
                        </button>
                      </div>
                      
                      {/* Comment Section */}
                      {activeCommentPost === post._id && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <div className="flex gap-3">
                            <img 
                              src={user.profilePhoto} 
                              alt="You"
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1">
                              <textarea
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none text-sm"
                                rows="2"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleAddComment(post._id)}
                              className="px-4 py-1 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700 transition-colors disabled:opacity-50"
                              disabled={!commentInput.trim()}
                            >
                              Comment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <footer className="mt-8 pt-6 border-t border-gray-700">
              <div className="text-center text-gray-500">
                <p className="text-sm">Liberta © 2023</p>
                <p className="text-sm mt-1 text-cyan-400">Connect • Chat • Enjoy</p>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LibertaHomePage;