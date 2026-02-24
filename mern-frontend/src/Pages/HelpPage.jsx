import React, { useState, useEffect } from 'react';
import axios from "../api/axiosConfig";
import {
  Heart,
  ShoppingBag,
  Pill,
  Car,
  Package,
  Users,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Gift,
  Home,
  Phone,
  Mail,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  X,
  Calendar,
  AlertTriangle,
  Loader
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const HelpPage = () => {
  const [activeTab, setActiveTab] = useState('request');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showGiveForm, setShowGiveForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    location: '',
    urgency: 'medium',
    category: '',
    condition: 'good',
    quantity: '',
    scheduledDate: '',
    estimatedHours: '',
    itemsNeeded: [],
    itemsOffered: []
  });

  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    urgency: '',
    location: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Data states
  const [myHelpRequests, setMyHelpRequests] = useState([]);
  const [myVolunteering, setMyVolunteering] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [publicHelpRequests, setPublicHelpRequests] = useState([]);
  const [nearbyOpportunities, setNearbyOpportunities] = useState({ helpRequests: [], itemListings: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchMyData();
    fetchPublicHelpRequests();
    fetchNearbyOpportunities();
  }, []);

  useEffect(() => {
    if (activeTab === 'volunteer') {
      fetchPublicHelpRequests();
    }
  }, [filters, pagination.page, activeTab]);

  const fetchMyData = async () => {
    try {
      const [requestsRes, volunteeringRes, itemsRes] = await Promise.all([
        axios.get('/help/help-requests/my'),
        axios.get('/help/help-requests/volunteering'),
        axios.get('/help/items/user/me')
      ]);
      
      if (requestsRes.data.success) setMyHelpRequests(requestsRes.data.helpRequests);
      if (volunteeringRes.data.success) setMyVolunteering(volunteeringRes.data.helpRequests);
      if (itemsRes.data.success) setMyItems(itemsRes.data.itemListings);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicHelpRequests = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 10,
        ...filters
      });
      
      const response = await axios.get(`/help/help-requests/public?${params}`);
      if (response.data.success) {
        setPublicHelpRequests(response.data.helpRequests);
        setPagination({
          page: response.data.page,
          total: response.data.total,
          pages: response.data.pages
        });
      }
    } catch (error) {
      console.error('Error fetching public requests:', error);
    }
  };

  const fetchNearbyOpportunities = async () => {
    try {
      const response = await axios.get('/help/nearby-opportunities');
      if (response.data.success) {
        setNearbyOpportunities(response.data);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      urgency: '',
      location: '',
      search: ''
    });
  };

  const handleSubmitHelpRequest = async () => {
    if (!formData.type || !formData.title || !formData.description || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.post('/help/help-requests', formData);
      if (response.data.success) {
        alert('Help request submitted successfully!');
        resetForm();
        setShowRequestForm(false);
        fetchMyData();
      }
    } catch (error) {
      console.error('Error submitting help request:', error);
      alert('Error submitting request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateHelpRequest = async () => {
    if (!editingRequest) return;

    setActionLoading(true);
    try {
      const response = await axios.put(`/help/help-requests/${editingRequest._id}`, formData);
      if (response.data.success) {
        alert('Help request updated successfully!');
        setShowEditModal(false);
        setEditingRequest(null);
        resetForm();
        fetchMyData();
      }
    } catch (error) {
      console.error('Error updating help request:', error);
      alert('Error updating request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHelpRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.delete(`/help/help-requests/${requestId}`);
      if (response.data.success) {
        alert('Help request deleted successfully!');
        fetchMyData();
      }
    } catch (error) {
      console.error('Error deleting help request:', error);
      alert('Error deleting request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelHelpRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.put(`/help/help-requests/${requestId}/cancel`);
      if (response.data.success) {
        alert('Help request cancelled successfully!');
        fetchMyData();
      }
    } catch (error) {
      console.error('Error cancelling help request:', error);
      alert('Error cancelling request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptHelpRequest = async (requestId) => {
    if (!confirm('Are you sure you want to accept this help request?')) return;

    setActionLoading(true);
    try {
      const response = await axios.put(`/help/help-requests/${requestId}/accept`);
      if (response.data.success) {
        alert('You have accepted the help request! Please contact the requester.');
        fetchPublicHelpRequests();
        fetchMyData();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Error accepting request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewRequest = async (requestId) => {
    try {
      const response = await axios.get(`/help/help-requests/${requestId}`);
      if (response.data.success) {
        setSelectedRequest(response.data.helpRequest);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  const handleEditRequest = (request) => {
    setEditingRequest(request);
    setFormData({
      type: request.type,
      title: request.title,
      description: request.description,
      location: request.location,
      urgency: request.urgency,
      scheduledDate: request.scheduledDate || '',
      estimatedHours: request.estimatedHours || '',
      category: '',
      condition: 'good',
      quantity: ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: '',
      title: '',
      description: '',
      location: '',
      urgency: 'medium',
      category: '',
      condition: 'good',
      quantity: '',
      scheduledDate: '',
      estimatedHours: '',
      itemsNeeded: [],
      itemsOffered: []
    });
  };

  const helpTypes = [
    { id: "food", label: "Food & Groceries", icon: ShoppingBag, color: "bg-green-100 text-green-700", bgColor: "bg-green-500/10" },
    { id: "medicine", label: "Medicine Pickup", icon: Pill, color: "bg-red-100 text-red-700", bgColor: "bg-red-500/10" },
    { id: "transport", label: "Transportation", icon: Car, color: "bg-blue-100 text-blue-700", bgColor: "bg-blue-500/10" },
    { id: "errands", label: "Run Errands", icon: Package, color: "bg-purple-100 text-purple-700", bgColor: "bg-purple-500/10" },
    { id: "companionship", label: "Companionship", icon: Users, color: "bg-pink-100 text-pink-700", bgColor: "bg-pink-500/10" },
    { id: "household", label: "Household Help", icon: Home, color: "bg-orange-100 text-orange-700", bgColor: "bg-orange-500/10" },
    { id: "other", label: "Other Help", icon: Heart, color: "bg-gray-100 text-gray-700", bgColor: "bg-gray-500/10" },
  ];

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "urgent": return "bg-red-100 text-red-700 border-red-300";
      case "high": return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "low": return "bg-green-100 text-green-700 border-green-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "accepted": return "bg-blue-500";
      case "in_progress": return "bg-purple-500";
      case "pending": return "bg-yellow-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "accepted": return <Users className="h-4 w-4" />;
      case "in_progress": return <Loader className="h-4 w-4 animate-spin" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading help system...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Navbar />
        
        <div className="flex-1 p-6 bg-gradient-to-br from-gray-50 to-blue-50">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Community Help & Support
            </h1>
            <p className="text-gray-600 mt-2">
              Request help, give items, or volunteer to support fellow seniors
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm border">
              {[
                { id: 'request', label: 'Request Help', icon: Heart },
                { id: 'give', label: 'Give Items', icon: Gift },
                { id: 'volunteer', label: 'Volunteer', icon: Users },
                { id: 'myRequests', label: 'My Activities', icon: Clock },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* REQUEST HELP TAB */}
          {activeTab === 'request' && (
            <div className="space-y-6">
              {!showRequestForm ? (
                <>
                  {/* Request Help Card */}
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden">
                    <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Heart className="h-8 w-8 text-red-600" />
                            Request Help from Community
                          </h2>
                          <p className="text-gray-600 mt-2">
                            Our volunteers are ready to assist with your daily needs
                          </p>
                        </div>
                        <button
                          onClick={() => setShowRequestForm(true)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                        >
                          <Plus className="h-5 w-5" />
                          <span>New Help Request</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {helpTypes.map((type) => (
                          <div
                            key={type.id}
                            className={`${type.bgColor} p-6 rounded-xl border hover:shadow-lg transition-all cursor-pointer group`}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, type: type.id }));
                              setShowRequestForm(true);
                            }}
                          >
                            <div className={`${type.color} h-16 w-16 rounded-lg flex items-center justify-center mb-4`}>
                              <type.icon className="h-8 w-8" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">{type.label}</h3>
                            <p className="text-gray-600 text-sm mt-1">
                              Click to request help
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* My Active Requests */}
                  {myHelpRequests.filter(r => !['completed', 'cancelled'].includes(r.status)).length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <Clock className="h-6 w-6 text-blue-600 mr-2" />
                        My Active Requests
                      </h3>
                      <div className="space-y-4">
                        {myHelpRequests
                          .filter(r => !['completed', 'cancelled'].includes(r.status))
                          .map((request) => (
                            <div key={request._id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(request.urgency)}`}>
                                      {request.urgency.toUpperCase()}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium text-white flex items-center gap-1 ${getStatusColor(request.status)}`}>
                                      {getStatusIcon(request.status)}
                                      {request.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      {helpTypes.find(t => t.id === request.type)?.label || request.type}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-gray-900 text-lg">{request.title}</h4>
                                  <p className="text-gray-600 mt-1">{request.description}</p>
                                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {request.location}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {formatDate(request.createdAt)}
                                    </div>
                                    {request.volunteer && (
                                      <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        Volunteer: {request.volunteer.firstName}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleViewRequest(request._id)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                  {request.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleEditRequest(request)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Edit Request"
                                      >
                                        <Edit className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteHelpRequest(request._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Request"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    </>
                                  )}
                                  {request.status === 'accepted' && (
                                    <button
                                      onClick={() => handleCancelHelpRequest(request._id)}
                                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                      title="Cancel Request"
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Request Form */
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        setShowRequestForm(false);
                        resetForm();
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                    >
                      ← Back to Help Types
                    </button>
                  </div>

                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      New Help Request
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          What type of help do you need? *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {helpTypes.map((type) => (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                formData.type === type.id
                                  ? `${type.color} border-current`
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <type.icon className="h-5 w-5" />
                                <span className="font-medium">{type.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Brief title for your request"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Please describe what you need help with in detail..."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location *
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="Where do you need help?"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Urgency Level
                          </label>
                          <select
                            name="urgency"
                            value={formData.urgency}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Scheduled Date (Optional)
                          </label>
                          <input
                            type="datetime-local"
                            name="scheduledDate"
                            value={formData.scheduledDate}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Hours (Optional)
                          </label>
                          <input
                            type="number"
                            name="estimatedHours"
                            value={formData.estimatedHours}
                            onChange={handleInputChange}
                            placeholder="e.g., 2"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={handleSubmitHelpRequest}
                          disabled={actionLoading}
                          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {actionLoading ? (
                            <>
                              <Loader className="h-5 w-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Help Request'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowRequestForm(false);
                            resetForm();
                          }}
                          className="px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VOLUNTEER TAB */}
          {activeTab === 'volunteer' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <Users className="h-8 w-8 text-blue-600" />
                      Volunteer Opportunities
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Help fellow seniors in your community
                    </p>
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search
                        </label>
                        <input
                          type="text"
                          name="search"
                          value={filters.search}
                          onChange={handleFilterChange}
                          placeholder="Search requests..."
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <select
                          name="type"
                          value={filters.type}
                          onChange={handleFilterChange}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">All Types</option>
                          {helpTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Urgency
                        </label>
                        <select
                          name="urgency"
                          value={filters.urgency}
                          onChange={handleFilterChange}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">All Urgency</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={filters.location}
                          onChange={handleFilterChange}
                          placeholder="Filter by location"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}

                {/* Help Requests Grid */}
                {publicHelpRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {publicHelpRequests.map((request) => (
                      <div key={request._id} className="border rounded-xl p-5 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                                {request.urgency.toUpperCase()}
                              </span>
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                {helpTypes.find(t => t.id === request.type)?.label || request.type}
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-900">{request.title}</h4>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{request.description}</p>
                            
                            <div className="flex items-center gap-3 mt-4">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin className="h-4 w-4" />
                                {request.location}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                {formatDate(request.createdAt)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-4">
                              <div className="flex items-center gap-2">
                                <img
                                  src={request.user.profilePhoto || '/default-avatar.png'}
                                  alt={request.user.firstName}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                                <span className="text-sm font-medium">
                                  {request.user.firstName} {request.user.lastName?.charAt(0)}.
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleViewRequest(request._id)}
                                className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleAcceptHelpRequest(request._id)}
                                disabled={actionLoading}
                                className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {actionLoading ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Heart className="h-4 w-4" />
                                    Accept
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No help requests match your filters.</p>
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GIVE ITEMS TAB (Keep your existing code) */}
          {activeTab === 'give' && (
            // ... your existing give items code
            <div>Give Items Section (keep your existing code)</div>
          )}

          {/* MY ACTIVITIES TAB (Keep your existing code but add edit/delete buttons) */}
          {activeTab === 'myRequests' && (
            // ... your existing my activities code with the edit/delete buttons from above
            <div>My Activities Section (update with edit/delete buttons from request tab)</div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Help Request Details</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedRequest(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedRequest.user.profilePhoto || '/default-avatar.png'}
                  alt={selectedRequest.user.firstName}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-lg">
                    {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                  </h4>
                  <p className="text-gray-600">{selectedRequest.user.city}, {selectedRequest.user.state}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(selectedRequest.urgency)}`}>
                  {selectedRequest.urgency.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-white flex items-center gap-1 ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  {helpTypes.find(t => t.id === selectedRequest.type)?.label || selectedRequest.type}
                </span>
              </div>

              <div>
                <h5 className="font-bold text-gray-900 mb-2">{selectedRequest.title}</h5>
                <p className="text-gray-700">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5" />
                  <span>{selectedRequest.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span>Created: {formatDate(selectedRequest.createdAt)}</span>
                </div>
                {selectedRequest.scheduledDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span>Scheduled: {formatDate(selectedRequest.scheduledDate)}</span>
                  </div>
                )}
                {selectedRequest.estimatedHours && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-5 w-5" />
                    <span>Estimated: {selectedRequest.estimatedHours} hours</span>
                  </div>
                )}
              </div>

              {selectedRequest.volunteer && (
                <div className="border-t pt-4">
                  <h5 className="font-bold text-gray-900 mb-3">Volunteer Information</h5>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedRequest.volunteer.profilePhoto || '/default-avatar.png'}
                      alt={selectedRequest.volunteer.firstName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">
                        {selectedRequest.volunteer.firstName} {selectedRequest.volunteer.lastName}
                      </p>
                      {selectedRequest.volunteer.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Phone className="h-4 w-4" />
                          {selectedRequest.volunteer.phone}
                        </p>
                      )}
                      {selectedRequest.volunteer.email && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {selectedRequest.volunteer.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {selectedRequest.status === 'pending' && selectedRequest.user._id === JSON.parse(localStorage.getItem('user'))?.id && (
                  <>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleEditRequest(selectedRequest);
                      }}
                      className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="h-5 w-5" />
                      Edit Request
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleDeleteHelpRequest(selectedRequest._id);
                      }}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-5 w-5" />
                      Delete Request
                    </button>
                  </>
                )}
                {selectedRequest.status === 'accepted' && selectedRequest.user._id === JSON.parse(localStorage.getItem('user'))?.id && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleCancelHelpRequest(selectedRequest._id);
                    }}
                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-5 w-5" />
                    Cancel Request
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedRequest(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Edit Help Request</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRequest(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {helpTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.type === type.id
                            ? `${type.color} border-current`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <type.icon className="h-5 w-5" />
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency Level
                    </label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Hours (Optional)
                    </label>
                    <input
                      type="number"
                      name="estimatedHours"
                      value={formData.estimatedHours}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleUpdateHelpRequest}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Request'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingRequest(null);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpPage;