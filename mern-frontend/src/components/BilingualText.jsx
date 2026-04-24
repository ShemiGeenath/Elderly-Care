// frontend/src/components/BilingualText.jsx
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const BilingualText = ({ english, sinhala, className = '' }) => {
  const { language } = useLanguage();
  
  return (
    <span className={className}>
      {language === 'si' ? sinhala : english}
    </span>
  );
};

export default BilingualText;