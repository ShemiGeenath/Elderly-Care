// src/pages/Posts.jsx
import React, { useState, useEffect } from 'react';
import { HiSearch, HiTrash, HiEye, HiFilter, HiHeart, HiChat } from 'react-icons/hi';
import axios from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [postType, setPostType] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [page, search, postType]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = { 
        page, 
        limit: 10, 
        search,
        postType 
      };
      const response = await axios.get('/admin/posts', { params });
      setPosts(response.data.posts);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await axios.delete(`/admin/posts/${postId}`, {
          data: { reason: 'Admin moderation' }
        });
        alert('Post deleted successfully');
        fetchPosts();
      } catch (error) {
        alert('Failed to delete post');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Post Management</h1>
        <div className="text-sm text-gray-500">
          Total: {total} posts
        </div>
      </div>

      <div className="bg-white rounded-xl shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 w-full">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search posts by content..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <select
              value={postType}
              onChange={(e) => {
                setPostType(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="friends">Friends</option>
            </select>
            
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <HiFilter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <LoadingSpinner />
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
            No posts found
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-xl shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.user?.profilePhoto || 'https://via.placeholder.com/40'}
                      alt={post.user?.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">
                        {post.user?.firstName} {post.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm capitalize">
                      {post.privacy || 'public'}
                    </span>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete Post"
                    >
                      <HiTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

                {post.tags && post.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 pt-4 border-t text-gray-500">
                  <div className="flex items-center space-x-1">
                    <HiHeart className="w-5 h-5" />
                    <span className="text-sm">{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HiChat className="w-5 h-5" />
                    <span className="text-sm">{post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        <Pagination
          page={page}
          total={total}
          limit={10}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default Posts;