// frontend/src/hooks/useTranslation.js
import { useLanguage } from '../context/LanguageContext';

// Translation dictionary for common phrases
const translations = {
  en: {
    // Navigation
    "home": "Home",
    "profile": "Profile",
    "friends": "Friends",
    "chat": "Chat",
    "help": "Help",
    "settings": "Settings",
    "logout": "Log Out",
    
    // Common UI
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "search": "Search",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    
    // Chat
    "type_message": "Type a message...",
    "send": "Send",
    "online": "Online",
    "offline": "Offline",
    "typing": "typing...",
    "no_messages": "No messages yet",
    
    // Profile
    "about": "About",
    "hobbies": "Hobbies",
    "help_needed": "Help Needed",
    "emergency_contact": "Emergency Contact",
    "followers": "Followers",
    "following": "Following",
    "posts": "Posts",
    
    // Help Page
    "request_help": "Request Help",
    "give_items": "Give Items",
    "volunteer": "Volunteer",
    "my_activities": "My Activities",
    
    // SOS
    "sos_alert": "SOS Alert",
    "emergency": "Emergency",
    
    // Welcome
    "welcome_back": "Welcome Back",
    
    // Language
    "change_language": "Change Language",
    "english": "English",
    "sinhala": "සිංහල"
  },
  si: {
    // Navigation
    "home": "මුල් පිටුව",
    "profile": "පැතිකඩ",
    "friends": "මිතුරන්",
    "chat": "කතාබස්",
    "help": "උදව්",
    "settings": "සැකසුම්",
    "logout": "පිටවන්න",
    
    // Common UI
    "save": "සුරකින්න",
    "cancel": "අවලංගු කරන්න",
    "delete": "මකන්න",
    "edit": "සංස්කරණය",
    "add": "එකතු කරන්න",
    "search": "සොයන්න",
    "loading": "පූරණය වෙමින්...",
    "error": "දෝෂයක්",
    "success": "සාර්ථකයි",
    
    // Chat
    "type_message": "පණිවුඩයක් ටයිප් කරන්න...",
    "send": "යවන්න",
    "online": "මාර්ගගතව",
    "offline": "නොබැඳි",
    "typing": "ටයිප් කරමින්...",
    "no_messages": "තවම පණිවුඩ නැත",
    
    // Profile
    "about": "ගැන",
    "hobbies": "විනෝදාංශ",
    "help_needed": "අවශ්‍ය උදව්",
    "emergency_contact": "හදිසි ඇමතුම්",
    "followers": "අනුගාමිකයින්",
    "following": "අනුගමනය කරන",
    "posts": "පළ කිරීම්",
    
    // Help Page
    "request_help": "උදව් ඉල්ලන්න",
    "give_items": "භාණ්ඩ ලබා දෙන්න",
    "volunteer": "ස්වේච්ඡාවෙන්",
    "my_activities": "මගේ කටයුතු",
    
    // SOS
    "sos_alert": "SOS අනතුරු ඇඟවීම",
    "emergency": "හදිසි",
    
    // Welcome
    "welcome_back": "ආපසු සාදරයෙන් පිළිගනිමු",
    
    // Language
    "change_language": "භාෂාව වෙනස් කරන්න",
    "english": "ඉංග්‍රීසි",
    "sinhala": "සිංහල"
  }
};

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };
  
  return { t, language };
};

export default useTranslation;