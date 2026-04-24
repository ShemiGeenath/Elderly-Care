// frontend/src/Pages/HelpPage.jsx
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
  Loader,
  Tag,
  PackageCheck,
  PackageX,
  RefreshCw
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import useTranslation from '../hooks/useTranslation';

const HelpPage = () => {
  const { getTranslation } = useLanguage();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('request');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showGiveForm, setShowGiveForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showItemViewModal, setShowItemViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Translation helper functions - Main UI
  const getLoadingText = () => getTranslation("Loading help system...", "උදව් පද්ධතිය පූරණය වෙමින්...");
  const getCommunityHelpTitle = () => getTranslation("Community Help & Support", "ප්‍රජා උදව් සහ සහාය");
  const getCommunityHelpSubtitle = () => getTranslation(
    "Request help, give items, or volunteer to support fellow seniors",
    "උදව් ඉල්ලන්න, භාණ්ඩ දෙන්න, හෝ සෙසු වැඩිහිටියන්ට සහාය වීමට ස්වේච්ඡාවෙන් ඉදිරිපත් වන්න"
  );
  
  // Tab labels
  const getRequestHelp = () => getTranslation("Request Help", "උදව් ඉල්ලන්න");
  const getGiveItems = () => getTranslation("Give Items", "භාණ්ඩ ලබා දෙන්න");
  const getVolunteer = () => getTranslation("Volunteer", "ස්වේච්ඡාවෙන්");
  const getMyActivities = () => getTranslation("My Activities", "මගේ කටයුතු");
  
  // Request Help section
  const getRequestHelpTitle = () => getTranslation("Request Help from Community", "ප්‍රජාවෙන් උදව් ඉල්ලන්න");
  const getRequestHelpSubtitle = () => getTranslation(
    "Our volunteers are ready to assist with your daily needs",
    "අපගේ ස්වේච්ඡා සේවකයින් ඔබගේ දෛනික අවශ්‍යතා සඳහා උපකාර කිරීමට සූදානම්"
  );
  const getNewHelpRequest = () => getTranslation("New Help Request", "නව උදව් ඉල්ලීම");
  const getClickToRequest = () => getTranslation("Click to request help", "උදව් ඉල්ලීමට ක්ලික් කරන්න");
  const getMyActiveRequests = () => getTranslation("My Active Requests", "මගේ ක්‍රියාකාරී ඉල්ලීම්");
  const getBackToHelpTypes = () => getTranslation("← Back to Help Types", "← උදව් වර්ග වෙත ආපසු");
  const getWhatTypeOfHelp = () => getTranslation("What type of help do you need? *", "ඔබට අවශ්‍ය උදව් වර්ගය කුමක්ද? *");
  const getTitle = () => getTranslation("Title *", "මාතෘකාව *");
  const getBriefTitle = () => getTranslation("Brief title for your request", "ඔබගේ ඉල්ලීම සඳහා කෙටි මාතෘකාවක්");
  const getDescription = () => getTranslation("Description *", "විස්තරය *");
  const getDescribeHelp = () => getTranslation("Please describe what you need help with in detail...", "කරුණාකර ඔබට උදව් අවශ්‍ය දේ විස්තරාත්මකව විස්තර කරන්න...");
  const getLocation = () => getTranslation("Location *", "ස්ථානය *");
  const getWhereNeedHelp = () => getTranslation("Where do you need help?", "ඔබට උදව් අවශ්‍ය ස්ථානය කොහේද?");
  const getUrgencyLevel = () => getTranslation("Urgency Level", "හදිසි මට්ටම");
  const getScheduledDate = () => getTranslation("Scheduled Date (Optional)", "නියමිත දිනය (විකල්ප)");
  const getEstimatedHours = () => getTranslation("Estimated Hours (Optional)", "ඇස්තමේන්තුගත පැය (විකල්ප)");
  const getSubmitHelpRequest = () => getTranslation("Submit Help Request", "උදව් ඉල්ලීම ඉදිරිපත් කරන්න");
  const getSubmitting = () => getTranslation("Submitting...", "ඉදිරිපත් කරමින්...");
  const getCancel = () => getTranslation("Cancel", "අවලංගු කරන්න");
  
  // Volunteer section
  const getVolunteerOpportunities = () => getTranslation("Volunteer Opportunities", "ස්වේච්ඡා අවස්ථා");
  const getHelpFellowSeniors = () => getTranslation("Help fellow seniors in your community", "ඔබගේ ප්‍රජාවේ සෙසු වැඩිහිටියන්ට උදව් කරන්න");
  const getFilters = () => getTranslation("Filters", "පෙරහන්");
  const getSearch = () => getTranslation("Search", "සොයන්න");
  const getSearchRequests = () => getTranslation("Search requests...", "ඉල්ලීම් සොයන්න...");
  const getType = () => getTranslation("Type", "වර්ගය");
  const getAllTypes = () => getTranslation("All Types", "සියලුම වර්ග");
  const getUrgency = () => getTranslation("Urgency", "හදිසි බව");
  const getAllUrgency = () => getTranslation("All Urgency", "සියලුම හදිසි බව");
  const getLow = () => getTranslation("Low", "අඩු");
  const getMedium = () => getTranslation("Medium", "මධ්යම");
  const getHigh = () => getTranslation("High", "ඉහළ");
  const getUrgent = () => getTranslation("Urgent", "හදිසි");
  const getFilterByLocation = () => getTranslation("Filter by location", "ස්ථානය අනුව පෙරන්න");
  const getClearFilters = () => getTranslation("Clear Filters", "පෙරහන් ඉවත් කරන්න");
  const getAccept = () => getTranslation("Accept", "පිළිගන්න");
  const getNoRequestsMatch = () => getTranslation("No help requests match your filters.", "ඔබගේ පෙරහන් වලට ගැලපෙන උදව් ඉල්ලීම් නොමැත.");
  const getPrevious = () => getTranslation("Previous", "පෙර");
  const getNext = () => getTranslation("Next", "ඊළඟ");
  const getViewDetails = () => getTranslation("View Details", "විස්තර බලන්න");
  const getEditRequest = () => getTranslation("Edit Request", "ඉල්ලීම සංස්කරණය කරන්න");
  const getDeleteRequest = () => getTranslation("Delete Request", "ඉල්ලීම මකන්න");
  const getCancelRequest = () => getTranslation("Cancel Request", "ඉල්ලීම අවලංගු කරන්න");
  
  // Give Items section
  const getGiveItemsTitle = () => getTranslation("Give Items to Community", "ප්‍රජාවට භාණ්ඩ ලබා දෙන්න");
  const getGiveItemsSubtitle = () => getTranslation(
    "Share items you no longer need with fellow seniors",
    "ඔබට තවදුරටත් අවශ්‍ය නොවන භාණ්ඩ සෙසු වැඩිහිටියන් සමඟ බෙදාගන්න"
  );
  const getListNewItem = () => getTranslation("List New Item", "නව භාණ්ඩයක් ලැයිස්තුගත කරන්න");
  const getPopularCategories = () => getTranslation("Popular Categories", "ජනප්‍රිය කාණ්ඩ");
  const getAvailableItems = () => getTranslation("Available Items", "පවතින භාණ්ඩ");
  const getFilterItems = () => getTranslation("Filter Items", "භාණ්ඩ පෙරන්න");
  const getSearchItems = () => getTranslation("Search items...", "භාණ්ඩ සොයන්න...");
  const getCategory = () => getTranslation("Category", "කාණ්ඩය");
  const getAllCategories = () => getTranslation("All Categories", "සියලුම කාණ්ඩ");
  const getCondition = () => getTranslation("Condition", "තත්වය");
  const getAllConditions = () => getTranslation("All Conditions", "සියලුම තත්වයන්");
  const getNew = () => getTranslation("New", "අලුත්");
  const getLikeNew = () => getTranslation("Like New", "අලුත් වගේ");
  const getGood = () => getTranslation("Good", "හොඳයි");
  const getFair = () => getTranslation("Fair", "සාමාන්‍ය");
  const getReserve = () => getTranslation("Reserve", "වෙන් කරන්න");
  const getNoItemsAvailable = () => getTranslation("No items available at the moment.", "මේ මොහොතේ භාණ්ඩ නොමැත.");
  const getListFirstItem = () => getTranslation("List Your First Item", "ඔබගේ පළමු භාණ්ඩය ලැයිස්තුගත කරන්න");
  const getBackToItems = () => getTranslation("← Back to Items", "← භාණ්ඩ වෙත ආපසු");
  const getListItemTitle = () => getTranslation("List an Item to Give", "ලබා දීමට භාණ්ඩයක් ලැයිස්තුගත කරන්න");
  const getSelectCategory = () => getTranslation("Select a category", "කාණ්ඩයක් තෝරන්න");
  const getItemTitle = () => getTranslation("Title *", "මාතෘකාව *");
  const getItemTitlePlaceholder = () => getTranslation("e.g., Walking Cane, Winter Coat", "උදා: ඇවිදීමේ සැරයටිය, ශීත කබාය");
  const getItemDescription = () => getTranslation("Description *", "විස්තරය *");
  const getItemDescriptionPlaceholder = () => getTranslation(
    "Describe the item, its condition, and any important details...",
    "භාණ්ඩය, එහි තත්වය සහ වැදගත් විස්තර විස්තර කරන්න..."
  );
  const getItemCondition = () => getTranslation("Condition *", "තත්වය *");
  const getQuantity = () => getTranslation("Quantity *", "ප්‍රමාණය *");
  const getItemLocation = () => getTranslation("Location *", "ස්ථානය *");
  const getCityNeighborhood = () => getTranslation("City or neighborhood", "නගරය හෝ අසල්වැසි ප්‍රදේශය");
  const getPickupLocation = () => getTranslation("Pickup Location (Optional)", "භාණ්ඩ ලබාගැනීමේ ස්ථානය (විකල්ප)");
  const getPickupLocationPlaceholder = () => getTranslation("Specific pickup address or meetup point", "නිශ්චිත භාණ්ඩ ලබාගැනීමේ ලිපිනය හෝ හමුවීමේ ස්ථානය");
  const getExpiryDate = () => getTranslation("Expiry Date (Optional)", "කල් ඉකුත්වන දිනය (විකල්ප)");
  const getContactMethod = () => getTranslation("Preferred Contact Method", "කැමති සම්බන්ධතා ක්‍රමය");
  const getInAppChat = () => getTranslation("In-app Chat", "යෙදුම් තුළ කතාබස්");
  const getPhone = () => getTranslation("Phone", "දුරකථන");
  const getEmail = () => getTranslation("Email", "විද්‍යුත් තැපෑල");
  const getListItem = () => getTranslation("List Item", "භාණ්ඩය ලැයිස්තුගත කරන්න");
  const getListing = () => getTranslation("Listing...", "ලැයිස්තුගත කරමින්...");
  
  // My Activities section
  const getMyHelpRequests = () => getTranslation("My Help Requests", "මගේ උදව් ඉල්ලීම්");
  const getNoHelpRequests = () => getTranslation("No help requests yet", "තවම උදව් ඉල්ලීම් නැත");
  const getImVolunteeringFor = () => getTranslation("I'm Volunteering For", "මම ස්වේච්ඡාවෙන් ඉදිරිපත් වන්නේ");
  const getRequester = () => getTranslation("Requester:", "ඉල්ලන්නා:");
  const getMyItemListings = () => getTranslation("My Item Listings", "මගේ භාණ්ඩ ලැයිස්තුගත කිරීම්");
  const getReservedBy = () => getTranslation("Reserved by:", "වෙන් කරන ලද්දේ:");
  const getNoActivitiesYet = () => getTranslation("No Activities Yet", "තවම ක්‍රියාකාරකම් නැත");
  const getStartActivities = () => getTranslation("Start by requesting help, listing items, or volunteering!", "උදව් ඉල්ලීම, භාණ්ඩ ලැයිස්තුගත කිරීම හෝ ස්වේච්ඡාවෙන් ඉදිරිපත් වීම ආරම්භ කරන්න!");
  
  // Modal texts
  const getHelpRequestDetails = () => getTranslation("Help Request Details", "උදව් ඉල්ලීමේ විස්තර");
  const getVolunteerInformation = () => getTranslation("Volunteer Information", "ස්වේච්ඡා සේවක තොරතුරු");
  const getVolunteerAssigned = () => getTranslation("Volunteer Assigned:", "ස්වේච්ඡා සේවකයා පවරා ඇත:");
  const getCreated = () => getTranslation("Created:", "සාදන ලද්දේ:");
  const getScheduled = () => getTranslation("Scheduled:", "නියමිත:");
  const getEstimated = () => getTranslation("Estimated:", "ඇස්තමේන්තුගත:");
  const getClose = () => getTranslation("Close", "වසන්න");
  const getItemDetails = () => getTranslation("Item Details", "භාණ්ඩ විස්තර");
  const getListed = () => getTranslation("Listed:", "ලැයිස්තුගත කරන ලද්දේ:");
  const getPickup = () => getTranslation("Pickup:", "භාණ්ඩ ලබාගැනීම:");
  const getExpires = () => getTranslation("Expires:", "කල් ඉකුත් වේ:");
  const getReceiverInformation = () => getTranslation("Receiver Information", "ලබන්නාගේ තොරතුරු");
  const getReserveItem = () => getTranslation("Reserve Item", "භාණ්ඩය වෙන් කරන්න");
  const getMarkAsGiven = () => getTranslation("Mark as Given", "ලබා දුන් ලෙස සලකුණු කරන්න");
  const getEditHelpRequest = () => getTranslation("Edit Help Request", "උදව් ඉල්ලීම සංස්කරණය කරන්න");
  const getEditItemListing = () => getTranslation("Edit Item Listing", "භාණ්ඩ ලැයිස්තුගත කිරීම සංස්කරණය කරන්න");
  const getUpdateRequest = () => getTranslation("Update Request", "ඉල්ලීම යාවත්කාලීන කරන්න");
  const getUpdating = () => getTranslation("Updating...", "යාවත්කාලීන කරමින්...");
  const getUpdateItem = () => getTranslation("Update Item", "භාණ්ඩය යාවත්කාලීන කරන්න");
  
  // Common button texts
  const getFollowing = () => getTranslation("Following", "අනුගමනය කරයි");
  const getFollow = () => getTranslation("Follow", "අනුගමනය කරන්න");
  const getMessage = () => getTranslation("Message", "පණිවුඩය");
  const getProfile = () => getTranslation("Profile", "පැතිකඩ");
  const getSave = () => getTranslation("Save", "සුරකින්න");
  const getDelete = () => getTranslation("Delete", "මකන්න");
  const getEdit = () => getTranslation("Edit", "සංස්කරණය");
  
  // Bilingual help types
  const getHelpTypes = () => [
    { id: "food", label: getTranslation("Food & Groceries", "ආහාර සහ සිල්ලර භාණ්ඩ"), icon: ShoppingBag, color: "bg-green-100 text-green-700", bgColor: "bg-green-500/10" },
    { id: "medicine", label: getTranslation("Medicine Pickup", "ඖෂධ ලබාගැනීම"), icon: Pill, color: "bg-red-100 text-red-700", bgColor: "bg-red-500/10" },
    { id: "transport", label: getTranslation("Transportation", "ප්‍රවාහනය"), icon: Car, color: "bg-blue-100 text-blue-700", bgColor: "bg-blue-500/10" },
    { id: "errands", label: getTranslation("Run Errands", "කටයුතු කිරීම"), icon: Package, color: "bg-purple-100 text-purple-700", bgColor: "bg-purple-500/10" },
    { id: "companionship", label: getTranslation("Companionship", "සහකාරිය"), icon: Users, color: "bg-pink-100 text-pink-700", bgColor: "bg-pink-500/10" },
    { id: "household", label: getTranslation("Household Help", "ගෘහස්ථ උදව්"), icon: Home, color: "bg-orange-100 text-orange-700", bgColor: "bg-orange-500/10" },
    { id: "other", label: getTranslation("Other Help", "වෙනත් උදව්"), icon: Heart, color: "bg-gray-100 text-gray-700", bgColor: "bg-gray-500/10" },
  ];

  const getItemCategories = () => [
    { id: "clothing", label: getTranslation("Clothing", "ඇඳුම් පැළඳුම්"), icon: ShoppingBag },
    { id: "furniture", label: getTranslation("Furniture", "ගෘහ භාණ්ඩ"), icon: Home },
    { id: "electronics", label: getTranslation("Electronics", "ඉලෙක්ට්‍රොනික උපකරණ"), icon: Package },
    { id: "books", label: getTranslation("Books", "පොත්"), icon: Package },
    { id: "kitchen", label: getTranslation("Kitchen Items", "මුළුතැන්ගෙයි භාණ්ඩ"), icon: Package },
    { id: "medical", label: getTranslation("Medical Equipment", "වෛද්‍ය උපකරණ"), icon: Pill },
    { id: "mobility", label: getTranslation("Mobility Aids", "සංචලන ආධාරක"), icon: Heart },
    { id: "other", label: getTranslation("Other", "වෙනත්"), icon: Gift },
  ];

  const helpTypes = getHelpTypes();
  const itemCategories = getItemCategories();

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

  // Item form states
  const [itemFormData, setItemFormData] = useState({
    type: 'give',
    category: '',
    title: '',
    description: '',
    location: '',
    condition: 'good',
    quantity: 1,
    expiryDate: '',
    pickupLocation: '',
    contactMethod: 'chat',
    tags: []
  });

  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    urgency: '',
    location: '',
    search: '',
    category: '',
    condition: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Data states
  const [myHelpRequests, setMyHelpRequests] = useState([]);
  const [myVolunteering, setMyVolunteering] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [publicHelpRequests, setPublicHelpRequests] = useState([]);
  const [publicItems, setPublicItems] = useState([]);
  const [nearbyOpportunities, setNearbyOpportunities] = useState({ helpRequests: [], itemListings: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 1
  });
  const [itemPagination, setItemPagination] = useState({
    page: 1,
    total: 0,
    pages: 1
  });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('elderlyUser');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    
    fetchMyData();
    fetchPublicHelpRequests();
    fetchPublicItems();
    fetchNearbyOpportunities();
  }, []);

  useEffect(() => {
    if (activeTab === 'volunteer') {
      fetchPublicHelpRequests();
    } else if (activeTab === 'give') {
      fetchPublicItems();
    }
  }, [filters, pagination.page, itemPagination.page, activeTab]);

  const fetchMyData = async () => {
    try {
      const [requestsRes, volunteeringRes, itemsRes] = await Promise.all([
        axios.get('/help/help-requests/my'),
        axios.get('/help/help-requests/volunteering'),
        axios.get('/help/items/user/me')
      ]);
      
      if (requestsRes.data.success) setMyHelpRequests(requestsRes.data.helpRequests || []);
      if (volunteeringRes.data.success) setMyVolunteering(volunteeringRes.data.helpRequests || []);
      if (itemsRes.data.success) setMyItems(itemsRes.data.itemListings || []);
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
        setPublicHelpRequests(response.data.helpRequests || []);
        setPagination({
          page: response.data.page || 1,
          total: response.data.total || 0,
          pages: response.data.pages || 1
        });
      }
    } catch (error) {
      console.error('Error fetching public requests:', error);
      setPublicHelpRequests([]);
    }
  };

  const fetchPublicItems = async () => {
    try {
      const params = new URLSearchParams({
        page: itemPagination.page,
        limit: 12,
        type: 'give',
        status: 'available',
        ...filters
      });
      
      const response = await axios.get(`/help/items?${params}`);
      if (response.data.success) {
        setPublicItems(response.data.itemListings || []);
        setItemPagination({
          page: response.data.page || 1,
          total: response.data.total || 0,
          pages: response.data.pages || 1
        });
      }
    } catch (error) {
      console.error('Error fetching public items:', error);
      setPublicItems([]);
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

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setItemFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    if (activeTab === 'volunteer') {
      setPagination(prev => ({ ...prev, page: 1 }));
    } else if (activeTab === 'give') {
      setItemPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      urgency: '',
      location: '',
      search: '',
      category: '',
      condition: ''
    });
  };

  // Help Request Functions
  const handleSubmitHelpRequest = async () => {
    if (!formData.type || !formData.title || !formData.description || !formData.location) {
      alert(getTranslation("Please fill in all required fields", "කරුණාකර අවශ්‍ය සියලුම ක්ෂේත්‍ර පුරවන්න"));
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.post('/help/help-requests', formData);
      if (response.data.success) {
        alert(getTranslation("Help request submitted successfully!", "උදව් ඉල්ලීම සාර්ථකව ඉදිරිපත් කරන ලදී!"));
        resetForm();
        setShowRequestForm(false);
        fetchMyData();
      }
    } catch (error) {
      console.error('Error submitting help request:', error);
      alert(getTranslation("Error submitting request. Please try again.", "ඉල්ලීම ඉදිරිපත් කිරීමේ දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න."));
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
        alert(getTranslation("Help request updated successfully!", "උදව් ඉල්ලීම සාර්ථකව යාවත්කාලීන කරන ලදී!"));
        setShowEditModal(false);
        setEditingRequest(null);
        resetForm();
        fetchMyData();
      }
    } catch (error) {
      console.error('Error updating help request:', error);
      alert(getTranslation("Error updating request. Please try again.", "ඉල්ලීම යාවත්කාලීන කිරීමේ දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHelpRequest = async (requestId) => {
    const confirmMsg = getTranslation("Are you sure you want to delete this request? This action cannot be undone.", "ඔබට මෙම ඉල්ලීම මැකීමට අවශ්‍ය බව විශ්වාසද? මෙම ක්‍රියාව ආපසු හැරවිය නොහැක.");
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.delete(`/help/help-requests/${requestId}`);
      if (response.data.success) {
        alert(getTranslation("Help request deleted successfully!", "උදව් ඉල්ලීම සාර්ථකව මකා දමන ලදී!"));
        fetchMyData();
      }
    } catch (error) {
      console.error('Error deleting help request:', error);
      alert(getTranslation("Error deleting request. Please try again.", "ඉල්ලීම මැකීමේ දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelHelpRequest = async (requestId) => {
    const confirmMsg = getTranslation("Are you sure you want to cancel this request?", "ඔබට මෙම ඉල්ලීම අවලංගු කිරීමට අවශ්‍ය බව විශ්වාසද?");
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.put(`/help/help-requests/${requestId}/cancel`);
      if (response.data.success) {
        alert(getTranslation("Help request cancelled successfully!", "උදව් ඉල්ලීම සාර්ථකව අවලංගු කරන ලදී!"));
        fetchMyData();
      }
    } catch (error) {
      console.error('Error cancelling help request:', error);
      alert(getTranslation("Error cancelling request. Please try again.", "ඉල්ලීම අවලංගු කිරීමේ දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptHelpRequest = async (requestId) => {
    const confirmMsg = getTranslation("Are you sure you want to accept this help request?", "ඔබට මෙම උදව් ඉල්ලීම පිළිගැනීමට අවශ්‍ය බව විශ්වාසද?");
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const response = await axios.put(`/help/help-requests/${requestId}/accept`);
      if (response.data.success) {
        alert(getTranslation("You have accepted the help request! Please contact the requester.", "ඔබ උදව් ඉල්ලීම පිළිගෙන ඇත! කරුණාකර ඉල්ලන්නා අමතන්න."));
        fetchPublicHelpRequests();
        fetchMyData();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert(getTranslation("Error accepting request. Please try again.", "ඉල්ලීම පිළිගැනීමේ දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න."));
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

  // Item Functions
  const handleSubmitItem = async () => {
    if (!itemFormData.category || !itemFormData.title || !itemFormData.description || !itemFormData.location) {
      alert(getTranslation("Please fill in all required fields", "කරුණාකර අවශ්‍ය සියලුම ක්ෂේත්‍ර පුරවන්න"));
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.post('/help/items', itemFormData);
      if (response.data.success) {
        alert(getTranslation("Item listed successfully!", "භාණ්ඩය සාර්ථකව ලැයිස්තුගත කරන ලදී!"));
        resetItemForm();
        setShowGiveForm(false);
        fetchMyData();
        fetchPublicItems();
      }
    } catch (error) {
      console.error('Error listing item:', error);
      alert(getTranslation("Error listing item. Please try again.", "භාණ්ඩය ලැයිස්තුගත කිරීමේ දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    setActionLoading(true);
    try {
      const response = await axios.put(`/help/items/${editingItem._id}`, itemFormData);
      if (response.data.success) {
        alert(getTranslation("Item updated successfully!", "භාණ්ඩය සාර්ථකව යාවත්කාලීන කරන ලදී!"));
        setShowEditModal(false);
        setEditingItem(null);
        resetItemForm();
        fetchMyData();
        fetchPublicItems();
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert(getTranslation("Error updating item. Please try again.", "භාණ්ඩය යාවත්කාලීන කිරීමේ දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    const confirmMsg = getTranslation("Are you sure you want to delete this item listing?", "ඔබට මෙම භාණ්ඩ ලැයිස්තුගත කිරීම මැකීමට අවශ්‍ය බව විශ්වාසද?");
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.delete(`/help/items/${itemId}`);
      if (response.data.success) {
        alert(getTranslation("Item deleted successfully!", "භාණ්ඩය සාර්ථකව මකා දමන ලදී!"));
        fetchMyData();
        fetchPublicItems();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(getTranslation("Error deleting item. Please try again.", "භාණ්ඩය මැකීමේ දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReserveItem = async (itemId) => {
    const confirmMsg = getTranslation("Would you like to reserve this item? The owner will be notified.", "ඔබට මෙම භාණ්ඩය වෙන් කර ගැනීමට අවශ්‍යද? හිමිකරුට දැනුම් දෙනු ඇත.");
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const response = await axios.put(`/help/items/${itemId}/reserve`);
      if (response.data.success) {
        alert(getTranslation("Item reserved successfully! Please coordinate pickup with the owner.", "භාණ්ඩය සාර්ථකව වෙන් කර ගන්නා ලදී! කරුණාකර හිමිකරු සමඟ භාණ්ඩ ලබාගැනීම සම්බන්ධීකරණය කරන්න."));
        fetchPublicItems();
        fetchMyData();
      }
    } catch (error) {
      console.error('Error reserving item:', error);
      alert(getTranslation("Error reserving item. Please try again.", "භාණ්ඩය වෙන් කර ගැනීමේ දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteItemExchange = async (itemId, status) => {
    const confirmMsg = getTranslation(`Mark this item as ${status}?`, `${status === 'given' ? 'ලබා දුන්' : 'ලැබුණු'} ලෙස සලකුණු කරන්න?`);
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const response = await axios.put(`/help/items/${itemId}/complete`, { status });
      if (response.data.success) {
        alert(getTranslation(`Item marked as ${status}!`, `භාණ්ඩය ${status === 'given' ? 'ලබා දුන්' : 'ලැබුණු'} ලෙස සලකුණු කරන ලදී!`));
        fetchMyData();
        fetchPublicItems();
      }
    } catch (error) {
      console.error('Error completing exchange:', error);
      alert(getTranslation("Error updating item status. Please try again.", "භාණ්ඩ තත්වය යාවත්කාලීන කිරීමේ දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewItem = async (itemId) => {
    try {
      const response = await axios.get(`/help/items/${itemId}`);
      if (response.data.success) {
        setSelectedItem(response.data.itemListing);
        setShowItemViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemFormData({
      type: item.type,
      category: item.category,
      title: item.title,
      description: item.description,
      location: item.location,
      condition: item.condition,
      quantity: item.quantity,
      expiryDate: item.expiryDate || '',
      pickupLocation: item.pickupLocation || '',
      contactMethod: item.contactMethod || 'chat',
      tags: item.tags || []
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

  const resetItemForm = () => {
    setItemFormData({
      type: 'give',
      category: '',
      title: '',
      description: '',
      location: '',
      condition: 'good',
      quantity: 1,
      expiryDate: '',
      pickupLocation: '',
      contactMethod: 'chat',
      tags: []
    });
  };

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
      case "available": return "bg-green-500";
      case "reserved": return "bg-blue-500";
      case "given": return "bg-purple-500";
      case "received": return "bg-indigo-500";
      default: return "bg-gray-500";
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case "new": return "bg-green-100 text-green-700";
      case "like_new": return "bg-blue-100 text-blue-700";
      case "good": return "bg-yellow-100 text-yellow-700";
      case "fair": return "bg-orange-100 text-orange-700";
      case "poor": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "accepted": return <Users className="h-4 w-4" />;
      case "in_progress": return <Loader className="h-4 w-4 animate-spin" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      case "available": return <CheckCircle className="h-4 w-4" />;
      case "reserved": return <Clock className="h-4 w-4" />;
      case "given": return <PackageCheck className="h-4 w-4" />;
      case "received": return <PackageCheck className="h-4 w-4" />;
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

  const getPageOfText = (page, pages) => {
    return getTranslation(`Page ${page} of ${pages}`, `පිටුව ${page} / ${pages}`);
  };

  const getSafeUser = (user) => {
    return user || {
      _id: 'unknown',
      firstName: getTranslation("Unknown", "නොදන්නා"),
      lastName: getTranslation("User", "පරිශීලක"),
      profilePhoto: null,
      city: getTranslation("Unknown", "නොදන්නා"),
      state: ''
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar user={currentUser} />
        <div className="ml-32 flex-1 flex flex-col">
          <Navbar user={currentUser} />
          <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{getLoadingText()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Sidebar */}
      <Sidebar user={currentUser} />
      
      {/* Main Content with left margin for fixed sidebar */}
      <div className="ml-32 flex-1 flex flex-col min-h-screen">
        <Navbar user={currentUser} />
        
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {getCommunityHelpTitle()}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {getCommunityHelpSubtitle()}
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                {[
                  { id: 'request', label: getRequestHelp(), icon: Heart },
                  { id: 'give', label: getGiveItems(), icon: Gift },
                  { id: 'volunteer', label: getVolunteer(), icon: Users },
                  { id: 'myRequests', label: getMyActivities(), icon: Clock },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ==================== REQUEST HELP TAB ==================== */}
            {activeTab === 'request' && (
              <div className="space-y-6">
                {!showRequestForm ? (
                  <>
                    {/* Request Help Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-blue-900 overflow-hidden">
                      <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                              <Heart className="h-8 w-8 text-red-600" />
                              {getRequestHelpTitle()}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                              {getRequestHelpSubtitle()}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowRequestForm(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                          >
                            <Plus className="h-5 w-5" />
                            <span>{getNewHelpRequest()}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {helpTypes.map((type) => (
                            <div
                              key={type.id}
                              className={`${type.bgColor} dark:bg-opacity-20 p-6 rounded-xl border hover:shadow-lg transition-all cursor-pointer group`}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, type: type.id }));
                                setShowRequestForm(true);
                              }}
                            >
                              <div className={`${type.color} dark:text-opacity-90 h-16 w-16 rounded-lg flex items-center justify-center mb-4`}>
                                <type.icon className="h-8 w-8" />
                              </div>
                              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{type.label}</h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                {getClickToRequest()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* My Active Requests */}
                    {myHelpRequests.filter(r => !['completed', 'cancelled'].includes(r.status)).length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                          <Clock className="h-6 w-6 text-blue-600 mr-2" />
                          {getMyActiveRequests()}
                        </h3>
                        <div className="space-y-4">
                          {myHelpRequests
                            .filter(r => !['completed', 'cancelled'].includes(r.status))
                            .map((request) => (
                              <div key={request._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
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
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {helpTypes.find(t => t.id === request.type)?.label || request.type}
                                      </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{request.title}</h4>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">{request.description}</p>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-500">
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
                                          {getVolunteer()}: {request.volunteer.firstName}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleViewRequest(request._id)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                      title={getViewDetails()}
                                    >
                                      <Eye className="h-5 w-5" />
                                    </button>
                                    {request.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleEditRequest(request)}
                                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                          title={getEditRequest()}
                                        >
                                          <Edit className="h-5 w-5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteHelpRequest(request._id)}
                                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                          title={getDeleteRequest()}
                                        >
                                          <Trash2 className="h-5 w-5" />
                                        </button>
                                      </>
                                    )}
                                    {request.status === 'accepted' && (
                                      <button
                                        onClick={() => handleCancelHelpRequest(request._id)}
                                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                                        title={getCancelRequest()}
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
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                    <div className="mb-6">
                      <button
                        onClick={() => {
                          setShowRequestForm(false);
                          resetForm();
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-2"
                      >
                        {getBackToHelpTypes()}
                      </button>
                    </div>

                    <div className="max-w-2xl mx-auto">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        {getNewHelpRequest()}
                      </h2>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getWhatTypeOfHelp()}
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
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getTitle()}
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder={getBriefTitle()}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getDescription()}
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder={getDescribeHelp()}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {getLocation()}
                            </label>
                            <input
                              type="text"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              placeholder={getWhereNeedHelp()}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {getUrgencyLevel()}
                            </label>
                            <select
                              name="urgency"
                              value={formData.urgency}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="low">{getLow()}</option>
                              <option value="medium">{getMedium()}</option>
                              <option value="high">{getHigh()}</option>
                              <option value="urgent">{getUrgent()}</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {getScheduledDate()}
                            </label>
                            <input
                              type="datetime-local"
                              name="scheduledDate"
                              value={formData.scheduledDate}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {getEstimatedHours()}
                            </label>
                            <input
                              type="number"
                              name="estimatedHours"
                              value={formData.estimatedHours}
                              onChange={handleInputChange}
                              placeholder="e.g., 2"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                {getSubmitting()}
                              </>
                            ) : (
                              getSubmitHelpRequest()
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowRequestForm(false);
                              resetForm();
                            }}
                            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            {getCancel()}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== VOLUNTEER TAB ==================== */}
            {activeTab === 'volunteer' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        {getVolunteerOpportunities()}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {getHelpFellowSeniors()}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Filter className="h-4 w-4" />
                      {getFilters()}
                    </button>
                  </div>

                  {/* Filters */}
                  {showFilters && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getSearch()}
                          </label>
                          <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder={getSearchRequests()}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getType()}
                          </label>
                          <select
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg"
                          >
                            <option value="">{getAllTypes()}</option>
                            {helpTypes.map(type => (
                              <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getUrgency()}
                          </label>
                          <select
                            name="urgency"
                            value={filters.urgency}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg"
                          >
                            <option value="">{getAllUrgency()}</option>
                            <option value="low">{getLow()}</option>
                            <option value="medium">{getMedium()}</option>
                            <option value="high">{getHigh()}</option>
                            <option value="urgent">{getUrgent()}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getLocation()}
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={filters.location}
                            onChange={handleFilterChange}
                            placeholder={getFilterByLocation()}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={clearFilters}
                          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          {getClearFilters()}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Help Requests Grid */}
                  {publicHelpRequests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {publicHelpRequests.map((request) => {
                        const user = getSafeUser(request.user);
                        return (
                          <div key={request._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                                    {request.urgency.toUpperCase()}
                                  </span>
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                    {helpTypes.find(t => t.id === request.type)?.label || request.type}
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{request.title}</h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">{request.description}</p>
                                
                                <div className="flex items-center gap-3 mt-4">
                                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                                    <MapPin className="h-4 w-4" />
                                    {request.location}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                                    <Clock className="h-4 w-4" />
                                    {formatDate(request.createdAt)}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 mt-4">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={user.profilePhoto || '/default-avatar.png'}
                                      alt={user.firstName}
                                      className="h-8 w-8 rounded-full object-cover"
                                      onError={(e) => {
                                        e.target.src = '/default-avatar.png';
                                      }}
                                    />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {user.firstName} {user.lastName?.charAt(0)}.
                                    </span>
                                  </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                  <button
                                    onClick={() => handleViewRequest(request._id)}
                                    className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    {getViewDetails()}
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
                                        {getAccept()}
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">{getNoRequestsMatch()}</p>
                      <button
                        onClick={clearFilters}
                        className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                      >
                        {getClearFilters()}
                      </button>
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {getPrevious()}
                      </button>
                      <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                        {getPageOfText(pagination.page, pagination.pages)}
                      </span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {getNext()}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== GIVE ITEMS TAB ==================== */}
            {activeTab === 'give' && (
              <div className="space-y-6">
                {!showGiveForm ? (
                  <>
                    {/* Give Items Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-green-200 dark:border-green-900 overflow-hidden">
                      <div className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                              <Gift className="h-8 w-8 text-green-600" />
                              {getGiveItemsTitle()}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                              {getGiveItemsSubtitle()}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowGiveForm(true)}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
                          >
                            <Plus className="h-5 w-5" />
                            <span>{getListNewItem()}</span>
                          </button>
                        </div>
                      </div>

                      {/* Quick Categories */}
                      <div className="p-8 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{getPopularCategories()}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {itemCategories.slice(0, 4).map((category) => (
                            <button
                              key={category.id}
                              onClick={() => {
                                setItemFormData(prev => ({ ...prev, category: category.id }));
                                setShowGiveForm(true);
                              }}
                              className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-all text-left"
                            >
                              <category.icon className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                              <span className="font-medium text-gray-900 dark:text-white">{category.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Available Items Grid */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Package className="h-6 w-6 text-green-600" />
                          {getAvailableItems()}
                        </h3>
                        <button
                          onClick={() => setShowFilters(!showFilters)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Filter className="h-4 w-4" />
                          {getFilterItems()}
                        </button>
                      </div>

                      {/* Item Filters */}
                      {showFilters && (
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {getSearch()}
                              </label>
                              <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder={getSearchItems()}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {getCategory()}
                              </label>
                              <select
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg"
                              >
                                <option value="">{getAllCategories()}</option>
                                {itemCategories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {getCondition()}
                              </label>
                              <select
                                name="condition"
                                value={filters.condition}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg"
                              >
                                <option value="">{getAllConditions()}</option>
                                <option value="new">{getNew()}</option>
                                <option value="like_new">{getLikeNew()}</option>
                                <option value="good">{getGood()}</option>
                                <option value="fair">{getFair()}</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {getLocation()}
                              </label>
                              <input
                                type="text"
                                name="location"
                                value={filters.location}
                                onChange={handleFilterChange}
                                placeholder={getFilterByLocation()}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end mt-4">
                            <button
                              onClick={clearFilters}
                              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                              {getClearFilters()}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Items Grid */}
                      {publicItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {publicItems.map((item) => {
                            const user = getSafeUser(item.user);
                            return (
                              <div key={item._id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                                <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                                  {item.photos && item.photos.length > 0 ? (
                                    <img 
                                      src={item.photos[0]} 
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="h-16 w-16 text-green-400 dark:text-green-600" />
                                  )}
                                </div>
                                <div className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getConditionColor(item.condition)}`}>
                                      {item.condition.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {getQuantity()}: {item.quantity}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{item.description}</p>
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                                      <MapPin className="h-3 w-3" />
                                      {item.location}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                                      <Clock className="h-3 w-3" />
                                      {formatDate(item.createdAt)}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={user.profilePhoto || '/default-avatar.png'}
                                        alt={user.firstName}
                                        className="h-6 w-6 rounded-full object-cover"
                                        onError={(e) => {
                                          e.target.src = '/default-avatar.png';
                                        }}
                                      />
                                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                                        {user.firstName}
                                      </span>
                                    </div>
                                    {item.status === 'available' && item.user?._id !== currentUser?.id && (
                                      <button
                                        onClick={() => handleReserveItem(item._id)}
                                        disabled={actionLoading}
                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                      >
                                        {getReserve()}
                                      </button>
                                    )}
                                    {item.user?._id === currentUser?.id && (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleEditItem(item)}
                                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                          title={getEdit()}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteItem(item._id)}
                                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                          title={getDelete()}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    )}
                                    <button
                                      onClick={() => handleViewItem(item._id)}
                                      className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                      title={getViewDetails()}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                  </div>
                                  {item.status !== 'available' && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(item.status)}`}>
                                        {getStatusIcon(item.status)}
                                        {item.status.toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400">{getNoItemsAvailable()}</p>
                          <button
                            onClick={() => setShowGiveForm(true)}
                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            {getListFirstItem()}
                          </button>
                        </div>
                      )}

                      {/* Pagination */}
                      {itemPagination.pages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                          <button
                            onClick={() => setItemPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={itemPagination.page === 1}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {getPrevious()}
                          </button>
                          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                            {getPageOfText(itemPagination.page, itemPagination.pages)}
                          </span>
                          <button
                            onClick={() => setItemPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={itemPagination.page === itemPagination.pages}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {getNext()}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Give Items Form */
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                    <div className="mb-6">
                      <button
                        onClick={() => {
                          setShowGiveForm(false);
                          resetItemForm();
                        }}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium flex items-center gap-2"
                      >
                        {getBackToItems()}
                      </button>
                    </div>

                    <div className="max-w-2xl mx-auto">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        {getListItemTitle()}
                      </h2>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getCategory()}
                          </label>
                          <select
                            name="category"
                            value={itemFormData.category}
                            onChange={handleItemInputChange}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">{getSelectCategory()}</option>
                            {itemCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getItemTitle()}
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={itemFormData.title}
                            onChange={handleItemInputChange}
                            placeholder={getItemTitlePlaceholder()}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getItemDescription()}
                          </label>
                          <textarea
                            name="description"
                            value={itemFormData.description}
                            onChange={handleItemInputChange}
                            placeholder={getItemDescriptionPlaceholder()}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {getItemCondition()}
                            </label>
                            <select
                              name="condition"
                              value={itemFormData.condition}
                              onChange={handleItemInputChange}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                              <option value="new">{getNew()}</option>
                              <option value="like_new">{getLikeNew()}</option>
                              <option value="good">{getGood()}</option>
                              <option value="fair">{getFair()}</option>
                              <option value="poor">Poor (Free only)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {getQuantity()}
                            </label>
                            <input
                              type="number"
                              name="quantity"
                              value={itemFormData.quantity}
                              onChange={handleItemInputChange}
                              min="1"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getItemLocation()}
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={itemFormData.location}
                            onChange={handleItemInputChange}
                            placeholder={getCityNeighborhood()}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getPickupLocation()}
                          </label>
                          <input
                            type="text"
                            name="pickupLocation"
                            value={itemFormData.pickupLocation}
                            onChange={handleItemInputChange}
                            placeholder={getPickupLocationPlaceholder()}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {getExpiryDate()}
                            </label>
                            <input
                              type="date"
                              name="expiryDate"
                              value={itemFormData.expiryDate}
                              onChange={handleItemInputChange}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {getContactMethod()}
                            </label>
                            <select
                              name="contactMethod"
                              value={itemFormData.contactMethod}
                              onChange={handleItemInputChange}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                              <option value="chat">{getInAppChat()}</option>
                              <option value="phone">{getPhone()}</option>
                              <option value="email">{getEmail()}</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button
                            onClick={handleSubmitItem}
                            disabled={actionLoading}
                            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {actionLoading ? (
                              <>
                                <Loader className="h-5 w-5 animate-spin" />
                                {getListing()}
                              </>
                            ) : (
                              getListItem()
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowGiveForm(false);
                              resetItemForm();
                            }}
                            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            {getCancel()}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== MY ACTIVITIES TAB ==================== */}
            {activeTab === 'myRequests' && (
              <div className="space-y-6">
                {/* My Help Requests */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Heart className="h-6 w-6 text-red-600 mr-2" />
                    {getMyHelpRequests()}
                  </h3>
                  {myHelpRequests.length > 0 ? (
                    <div className="space-y-4">
                      {myHelpRequests.map((request) => (
                        <div key={request._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
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
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {helpTypes.find(t => t.id === request.type)?.label || request.type}
                                </span>
                              </div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{request.title}</h4>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{request.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {request.location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatDate(request.createdAt)}
                                </div>
                              </div>
                              {request.volunteer && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                  <p className="text-sm font-medium text-blue-800 dark:text-blue-400">{getVolunteerAssigned()}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <img
                                      src={request.volunteer?.profilePhoto || '/default-avatar.png'}
                                      alt={request.volunteer?.firstName || getVolunteer()}
                                      className="h-8 w-8 rounded-full object-cover"
                                      onError={(e) => {
                                        e.target.src = '/default-avatar.png';
                                      }}
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {request.volunteer?.firstName} {request.volunteer?.lastName}
                                      </p>
                                      {request.volunteer?.phone && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">📞 {request.volunteer.phone}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewRequest(request._id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                                title={getViewDetails()}
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleEditRequest(request)}
                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
                                    title={getEditRequest()}
                                  >
                                    <Edit className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteHelpRequest(request._id)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                    title={getDeleteRequest()}
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                              {request.status === 'accepted' && (
                                <button
                                  onClick={() => handleCancelHelpRequest(request._id)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg"
                                  title={getCancelRequest()}
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">{getNoHelpRequests()}</p>
                  )}
                </div>

                {/* My Volunteering */}
                {myVolunteering.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Users className="h-6 w-6 text-blue-600 mr-2" />
                      {getImVolunteeringFor()}
                    </h3>
                    <div className="space-y-4">
                      {myVolunteering.map((request) => {
                        const user = getSafeUser(request.user);
                        return (
                          <div key={request._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
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
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{request.title}</h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{request.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {request.location}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatDate(request.createdAt)}
                                  </div>
                                </div>
                                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                  <p className="text-sm font-medium text-purple-800 dark:text-purple-400">{getRequester()}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <img
                                      src={user.profilePhoto || '/default-avatar.png'}
                                      alt={user.firstName}
                                      className="h-8 w-8 rounded-full object-cover"
                                      onError={(e) => {
                                        e.target.src = '/default-avatar.png';
                                      }}
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {user.firstName} {user.lastName}
                                      </p>
                                      {request.user?.phone && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">📞 {request.user.phone}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleViewRequest(request._id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                                title={getViewDetails()}
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* My Items */}
                {myItems.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Gift className="h-6 w-6 text-green-600 mr-2" />
                      {getMyItemListings()}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myItems.map((item) => (
                        <div key={item._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getConditionColor(item.condition)}`}>
                                  {item.condition.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(item.status)}`}>
                                  {item.status.toUpperCase()}
                                </span>
                              </div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {item.location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Package className="h-4 w-4" />
                                  {getQuantity()}: {item.quantity}
                                </div>
                              </div>
                              {item.receiver && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                  <p className="text-sm font-medium text-green-800 dark:text-green-400">{getReservedBy()}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <img
                                      src={item.receiver?.profilePhoto || '/default-avatar.png'}
                                      alt={item.receiver?.firstName || 'Receiver'}
                                      className="h-8 w-8 rounded-full object-cover"
                                      onError={(e) => {
                                        e.target.src = '/default-avatar.png';
                                      }}
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {item.receiver?.firstName} {item.receiver?.lastName}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewItem(item._id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                                title={getViewDetails()}
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              {item.status === 'available' && (
                                <>
                                  <button
                                    onClick={() => handleEditItem(item)}
                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
                                    title={getEdit()}
                                  >
                                    <Edit className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item._id)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                    title={getDelete()}
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                              {item.status === 'reserved' && item.user?._id === currentUser?.id && (
                                <>
                                  <button
                                    onClick={() => handleCompleteItemExchange(item._id, 'given')}
                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
                                    title={getMarkAsGiven()}
                                  >
                                    <PackageCheck className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item._id)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                    title={getCancel()}
                                  >
                                    <XCircle className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {myHelpRequests.length === 0 && myVolunteering.length === 0 && myItems.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
                    <Clock className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">{getNoActivitiesYet()}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{getStartActivities()}</p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setActiveTab('request')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {getRequestHelp()}
                      </button>
                      <button
                        onClick={() => setActiveTab('give')}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        {getGiveItems()}
                      </button>
                      <button
                        onClick={() => setActiveTab('volunteer')}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        {getVolunteer()}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== VIEW REQUEST MODAL ==================== */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{getHelpRequestDetails()}</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedRequest(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedRequest.user?.profilePhoto || '/default-avatar.png'}
                  alt={selectedRequest.user?.firstName || 'User'}
                  className="h-16 w-16 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                    {selectedRequest.user?.firstName} {selectedRequest.user?.lastName}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedRequest.user?.city}, {selectedRequest.user?.state}</p>
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
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {helpTypes.find(t => t.id === selectedRequest.type)?.label || selectedRequest.type}
                </span>
              </div>

              <div>
                <h5 className="font-bold text-gray-900 dark:text-white mb-2">{selectedRequest.title}</h5>
                <p className="text-gray-700 dark:text-gray-300">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-5 w-5" />
                  <span>{selectedRequest.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="h-5 w-5" />
                  <span>{getCreated()} {formatDate(selectedRequest.createdAt)}</span>
                </div>
                {selectedRequest.scheduledDate && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="h-5 w-5" />
                    <span>{getScheduled()} {formatDate(selectedRequest.scheduledDate)}</span>
                  </div>
                )}
                {selectedRequest.estimatedHours && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock className="h-5 w-5" />
                    <span>{getEstimated()} {selectedRequest.estimatedHours} {getEstimatedHours().toLowerCase()}</span>
                  </div>
                )}
              </div>

              {selectedRequest.volunteer && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h5 className="font-bold text-gray-900 dark:text-white mb-3">{getVolunteerInformation()}</h5>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedRequest.volunteer?.profilePhoto || '/default-avatar.png'}
                      alt={selectedRequest.volunteer?.firstName || getVolunteer()}
                      className="h-12 w-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRequest.volunteer?.firstName} {selectedRequest.volunteer?.lastName}
                      </p>
                      {selectedRequest.volunteer?.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <Phone className="h-4 w-4" />
                          {selectedRequest.volunteer.phone}
                        </p>
                      )}
                      {selectedRequest.volunteer?.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {selectedRequest.volunteer.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {selectedRequest.status === 'pending' && selectedRequest.user?._id === currentUser?.id && (
                  <>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleEditRequest(selectedRequest);
                      }}
                      className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="h-5 w-5" />
                      {getEdit()}
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleDeleteHelpRequest(selectedRequest._id);
                      }}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-5 w-5" />
                      {getDelete()}
                    </button>
                  </>
                )}
                {selectedRequest.status === 'accepted' && selectedRequest.user?._id === currentUser?.id && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleCancelHelpRequest(selectedRequest._id);
                    }}
                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-5 w-5" />
                    {getCancelRequest()}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedRequest(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {getClose()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIEW ITEM MODAL ==================== */}
      {showItemViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{getItemDetails()}</h3>
                <button
                  onClick={() => {
                    setShowItemViewModal(false);
                    setSelectedItem(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedItem.user?.profilePhoto || '/default-avatar.png'}
                  alt={selectedItem.user?.firstName || 'User'}
                  className="h-16 w-16 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                    {selectedItem.user?.firstName} {selectedItem.user?.lastName}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedItem.user?.city}, {selectedItem.user?.state}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(selectedItem.condition)}`}>
                  {selectedItem.condition.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-white flex items-center gap-1 ${getStatusColor(selectedItem.status)}`}>
                  {getStatusIcon(selectedItem.status)}
                  {selectedItem.status.toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  {getQuantity()}: {selectedItem.quantity}
                </span>
              </div>

              <div>
                <h5 className="font-bold text-gray-900 dark:text-white mb-2">{selectedItem.title}</h5>
                <p className="text-gray-700 dark:text-gray-300">{selectedItem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-5 w-5" />
                  <span>{selectedItem.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="h-5 w-5" />
                  <span>{getListed()} {formatDate(selectedItem.createdAt)}</span>
                </div>
                {selectedItem.pickupLocation && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 col-span-2">
                    <Package className="h-5 w-5" />
                    <span>{getPickup()} {selectedItem.pickupLocation}</span>
                  </div>
                )}
                {selectedItem.expiryDate && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="h-5 w-5" />
                    <span>{getExpires()} {formatDate(selectedItem.expiryDate)}</span>
                  </div>
                )}
              </div>

              {selectedItem.receiver && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h5 className="font-bold text-gray-900 dark:text-white mb-3">{getReceiverInformation()}</h5>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedItem.receiver?.profilePhoto || '/default-avatar.png'}
                      alt={selectedItem.receiver?.firstName || 'Receiver'}
                      className="h-12 w-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedItem.receiver?.firstName} {selectedItem.receiver?.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {selectedItem.status === 'available' && selectedItem.user?._id !== currentUser?.id && (
                  <button
                    onClick={() => {
                      handleReserveItem(selectedItem._id);
                      setShowItemViewModal(false);
                    }}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Package className="h-5 w-5" />
                        {getReserveItem()}
                      </>
                    )}
                  </button>
                )}
                {selectedItem.user?._id === currentUser?.id && selectedItem.status === 'available' && (
                  <>
                    <button
                      onClick={() => {
                        setShowItemViewModal(false);
                        handleEditItem(selectedItem);
                      }}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="h-5 w-5" />
                      {getEdit()}
                    </button>
                    <button
                      onClick={() => {
                        setShowItemViewModal(false);
                        handleDeleteItem(selectedItem._id);
                      }}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-5 w-5" />
                      {getDelete()}
                    </button>
                  </>
                )}
                {selectedItem.user?._id === currentUser?.id && selectedItem.status === 'reserved' && (
                  <>
                    <button
                      onClick={() => {
                        handleCompleteItemExchange(selectedItem._id, 'given');
                        setShowItemViewModal(false);
                      }}
                      className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <PackageCheck className="h-5 w-5" />
                      {getMarkAsGiven()}
                    </button>
                    <button
                      onClick={() => {
                        setShowItemViewModal(false);
                        handleDeleteItem(selectedItem._id);
                      }}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-5 w-5" />
                      {getCancel()}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowItemViewModal(false);
                    setSelectedItem(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {getClose()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT MODAL ==================== */}
      {showEditModal && (editingRequest || editingItem) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingRequest ? getEditHelpRequest() : getEditItemListing()}
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRequest(null);
                    setEditingItem(null);
                    resetForm();
                    resetItemForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {editingRequest ? (
                /* Edit Help Request Form */
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getWhatTypeOfHelp()}
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
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getTitle()}
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getDescription()}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {getLocation()}
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {getUrgencyLevel()}
                      </label>
                      <select
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">{getLow()}</option>
                        <option value="medium">{getMedium()}</option>
                        <option value="high">{getHigh()}</option>
                        <option value="urgent">{getUrgent()}</option>
                      </select>
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
                          {getUpdating()}
                        </>
                      ) : (
                        getUpdateRequest()
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingRequest(null);
                        resetForm();
                      }}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {getCancel()}
                    </button>
                  </div>
                </div>
              ) : editingItem ? (
                /* Edit Item Form */
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getCategory()}
                    </label>
                    <select
                      name="category"
                      value={itemFormData.category}
                      onChange={handleItemInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">{getSelectCategory()}</option>
                      {itemCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getItemTitle()}
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={itemFormData.title}
                      onChange={handleItemInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getItemDescription()}
                    </label>
                    <textarea
                      name="description"
                      value={itemFormData.description}
                      onChange={handleItemInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {getItemCondition()}
                      </label>
                      <select
                        name="condition"
                        value={itemFormData.condition}
                        onChange={handleItemInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="new">{getNew()}</option>
                        <option value="like_new">{getLikeNew()}</option>
                        <option value="good">{getGood()}</option>
                        <option value="fair">{getFair()}</option>
                        <option value="poor">Poor (Free only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {getQuantity()}
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={itemFormData.quantity}
                        onChange={handleItemInputChange}
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {getItemLocation()}
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={itemFormData.location}
                      onChange={handleItemInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleUpdateItem}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin" />
                          {getUpdating()}
                        </>
                      ) : (
                        getUpdateItem()
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingItem(null);
                        resetItemForm();
                      }}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {getCancel()}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpPage;