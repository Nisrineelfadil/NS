import React, { createContext, useState, useEffect, useContext } from 'react';

const LANGUAGES = {
  fr: { key: 'fr', name: 'Français', flag: '🇫🇷', direction: 'ltr' },
  en: { key: 'en', name: 'English', flag: '🇬🇧', direction: 'ltr' },
  ar: { key: 'ar', name: 'العربية', flag: '🇲🇦', direction: 'rtl' },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('fr'); // Default to French
  const [language, setLanguage] = useState(LANGUAGES.fr);

  useEffect(() => {
    loadLanguage();
  }, []);

  useEffect(() => {
    // Apply direction to document
    document.documentElement.dir = language.direction;
    document.documentElement.lang = language.key;
  }, [language]);

  const loadLanguage = () => {
    try {
      const savedLanguage = localStorage.getItem('appLanguage');
      if (savedLanguage && LANGUAGES[savedLanguage]) {
        setCurrentLanguage(savedLanguage);
        setLanguage(LANGUAGES[savedLanguage]);
      } else {
        // Set French as default if nothing saved
        localStorage.setItem('appLanguage', 'fr');
        setCurrentLanguage('fr');
        setLanguage(LANGUAGES.fr);
      }
    } catch (error) {
      console.error('Error loading language:', error);
      setCurrentLanguage('fr');
      setLanguage(LANGUAGES.fr);
    }
  };

  const changeLanguage = (languageKey) => {
    try {
      if (LANGUAGES[languageKey]) {
        localStorage.setItem('appLanguage', languageKey);
        setCurrentLanguage(languageKey);
        setLanguage(LANGUAGES[languageKey]);
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      currentLanguage, 
      changeLanguage, 
      languages: LANGUAGES 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
