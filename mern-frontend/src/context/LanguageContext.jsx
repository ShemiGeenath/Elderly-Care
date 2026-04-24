// frontend/src/context/LanguageContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// Translation function that uses Google Translate API
const translateText = async (text, targetLang) => {
  if (targetLang === 'en') return text;
  
  try {
    // You can use Google Translate API or a free alternative
    // For free alternative, you can use:
    // https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|si
    
    const response = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang === 'si' ? 'si' : 'en'}`
    );
    
    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      return response.data.responseData.translatedText;
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'en';
  });
  
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('appLanguage', language);
    document.documentElement.lang = language === 'si' ? 'si' : 'en';
    
    // For Sinhala, you might want to load a specific font
    if (language === 'si') {
      // Load Sinhala font if needed
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;500;600;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      document.body.style.fontFamily = "'Noto Sans Sinhala', sans-serif";
    } else {
      document.body.style.fontFamily = '';
    }
  }, [language]);

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    // Reload page to apply translations (or implement dynamic translation)
    window.location.reload();
  };

  // Function to translate text dynamically
  const t = async (text) => {
    if (language === 'en') return text;
    
    // Check cache first
    const cacheKey = `${text}_${language}`;
    if (translations[cacheKey]) {
      return translations[cacheKey];
    }
    
    // Translate and cache
    const translated = await translateText(text, language);
    setTranslations(prev => ({ ...prev, [cacheKey]: translated }));
    return translated;
  };

  // Synchronous translation helper (for components)
  const getTranslation = (englishText, sinhalaText) => {
    return language === 'si' ? sinhalaText : englishText;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage: changeLanguage,
      t,
      getTranslation,
      isTranslating
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;