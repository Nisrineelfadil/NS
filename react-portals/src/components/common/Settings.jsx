import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import './Settings.css';

const Settings = () => {
  const [showSheet, setShowSheet] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [theme, setTheme] = useState('dark');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { language, changeLanguage: setLanguage, t } = useLanguage();
  const buttonRef = useRef(null);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme === 'light' ? 'light-theme' : '';
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showLangDropdown && !e.target.closest('.desktop-lang-selector')) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showLangDropdown]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (showSheet) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSheet]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme === 'light' ? 'light-theme' : '';
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    handleThemeChange(newTheme);
  };

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setShowLangDropdown(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!showLangDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right
      });
    }
    setShowLangDropdown(!showLangDropdown);
  };

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', label: 'DE' },
    { code: 'ar', name: 'العربية', flag: '🇲🇦', label: 'AR' },
    { code: 'en', name: 'English', flag: '🇬🇧', label: 'EN' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', label: 'FR' },
  ];

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  // Desktop version (dropdown + toggle)
  if (!isMobile) {
    return (
      <div className="desktop-settings">
        {/* Language Dropdown */}
        <div className="desktop-lang-selector">
          <button 
            ref={buttonRef}
            className="lang-dropdown-btn"
            onClick={toggleDropdown}
          >
            <span className="flag">{currentLanguage.flag}</span>
            <span className="lang-label">{currentLanguage.name}</span>
            <i className={`fas fa-chevron-down ${showLangDropdown ? 'rotate' : ''}`}></i>
          </button>
          {showLangDropdown && createPortal(
            <div 
              className="lang-dropdown" 
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
                zIndex: 99999
              }}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`lang-option ${language === lang.code ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <span className="flag">{lang.flag}</span>
                  <span className="lang-name">{lang.name}</span>
                  {language === lang.code && (
                    <i className="fas fa-check"></i>
                  )}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>

        {/* Theme Toggle Button */}
        <button 
          className="desktop-theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
      </div>
    );
  }

  // Mobile version (drawer)
  return (
    <>
      <button 
        className="settings-btn" 
        onClick={() => setShowSheet(true)}
        title="Settings"
      >
        <i className="fas fa-cog"></i>
      </button>

      {/* Backdrop */}
      {showSheet && (
        <div 
          className="settings-backdrop" 
          onClick={() => setShowSheet(false)}
        />
      )}

      {/* Side Drawer */}
      <div className={`settings-drawer ${showSheet ? 'open' : ''}`}>
        <div className="settings-drawer-header">
          <h2>
            <i className="fas fa-cog"></i>
            {t('settings')}
          </h2>
          <button 
            className="close-btn" 
            onClick={() => setShowSheet(false)}
            aria-label="Close settings"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="settings-drawer-content">
          {/* Theme Toggle */}
          <div className="settings-section">
            <div className="settings-section-header">
              <i className="fas fa-palette"></i>
              <span>{t('appearance')}</span>
            </div>
            <div className="theme-options">
              <button 
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <i className="fas fa-moon"></i>
                <span>{t('darkMode')}</span>
                {theme === 'dark' && <i className="fas fa-check-circle"></i>}
              </button>
              <button 
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <i className="fas fa-sun"></i>
                <span>{t('lightMode')}</span>
                {theme === 'light' && <i className="fas fa-check-circle"></i>}
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="settings-section">
            <div className="settings-section-header">
              <i className="fas fa-globe"></i>
              <span>{t('language')}</span>
            </div>
            <div className="language-grid">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`lang-card ${language === lang.code ? 'active' : ''}`}
                  onClick={() => setLanguage(lang.code)}
                >
                  <span className="flag">{lang.flag}</span>
                  <span className="lang-name">{lang.name}</span>
                  {language === lang.code && (
                    <i className="fas fa-check-circle check-icon"></i>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
