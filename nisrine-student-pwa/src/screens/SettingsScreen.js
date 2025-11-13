import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './SettingsScreen.css';

const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧' },
  fr: { name: 'Français', flag: '🇫🇷' },
  ar: { name: 'العربية', flag: '🇲🇦' },
};

const SettingsScreen = () => {
  const navigate = useNavigate();
  const { theme, currentTheme, changeTheme, themes } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = () => {
    try {
      const language = localStorage.getItem('appLanguage');
      if (language && LANGUAGES[language]) {
        setSelectedLanguage(language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const saveLanguage = (languageKey) => {
    try {
      localStorage.setItem('appLanguage', languageKey);
      setSelectedLanguage(languageKey);
      alert('Language Changed\n\nYour language preference has been saved! This feature will be fully implemented soon.');
    } catch (error) {
      console.error('Error saving language:', error);
      alert('Failed to save language');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Clear ALL data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear service worker caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      // Use window.location.replace for proper navigation
      window.location.replace(window.location.origin + '/pwa/login');
    }
  };

  return (
    <div className="settings-container" style={{ background: theme.background }}>
      <div className="settings-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <h1>Settings</h1>
        <div style={{ width: '60px' }}></div>
      </div>

      <div className="settings-header-card" style={{ background: theme.cardBg }}>
        <span className="settings-icon">⚙️</span>
        <h2 style={{ color: theme.text }}>Settings</h2>
        <p style={{ color: theme.textLight }}>Customize your app experience</p>
      </div>

      <div className="settings-section" style={{ background: theme.cardBg }}>
        <div className="section-header">
          <span className="section-icon">🎨</span>
          <h3 style={{ color: theme.text }}>Theme</h3>
        </div>
        <p className="section-description" style={{ color: theme.textLight }}>
          Choose your preferred color theme
        </p>

        <div className="theme-grid">
          {Object.keys(themes).map((themeKey) => (
            <div
              key={themeKey}
              className={`theme-card ${currentTheme === themeKey ? 'active' : ''}`}
              style={{
                background: themes[themeKey].cardBg,
                borderColor: currentTheme === themeKey ? themes[themeKey].primary : themes[themeKey].borderColor,
              }}
              onClick={() => changeTheme(themeKey)}
            >
              <div 
                className="theme-icon-container"
                style={{ background: themes[themeKey].primary + '20' }}
              >
                <span style={{ fontSize: '40px' }}>
                  {themeKey === 'bright' ? '☀️' : '🌙'}
                </span>
              </div>
              <h4 style={{ color: themes[themeKey].text }}>{themes[themeKey].name}</h4>
              <div className="theme-colors">
                <div className="color-dot" style={{ background: themes[themeKey].primary }}></div>
                <div className="color-dot" style={{ background: themes[themeKey].secondary }}></div>
                <div className="color-dot" style={{ background: themes[themeKey].background }}></div>
              </div>
              {currentTheme === themeKey && (
                <div className="selected-badge" style={{ background: themes[themeKey].primary }}>
                  <span>✓</span>
                  <span>Active</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section" style={{ background: theme.cardBg }}>
        <div className="section-header">
          <span className="section-icon">🌐</span>
          <h3 style={{ color: theme.text }}>Language</h3>
        </div>
        <p className="section-description" style={{ color: theme.textLight }}>
          Select your preferred language
        </p>

        {Object.keys(LANGUAGES).map((langKey) => (
          <div
            key={langKey}
            className={`option-card ${selectedLanguage === langKey ? 'selected' : ''}`}
            style={{
              background: theme.background,
              borderColor: selectedLanguage === langKey ? theme.primary : 'transparent',
            }}
            onClick={() => saveLanguage(langKey)}
          >
            <div className="option-content">
              <span className="flag-emoji">{LANGUAGES[langKey].flag}</span>
              <span className="option-title" style={{ color: theme.text }}>
                {LANGUAGES[langKey].name}
              </span>
            </div>
            {selectedLanguage === langKey && (
              <span style={{ color: theme.primary, fontSize: '24px' }}>✓</span>
            )}
          </div>
        ))}
      </div>

      <div className="settings-section" style={{ background: theme.cardBg, marginTop: '20px' }}>
        <div className="section-header">
          <span className="section-icon">🚪</span>
          <h3 style={{ color: theme.text }}>Account</h3>
        </div>
        <button
          className="logout-button"
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '15px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Logout
        </button>
      </div>

      <div className="info-section">
        <p style={{ color: theme.textLight }}>Nisrine School Student App</p>
        <p style={{ color: theme.textLight }}>Version 1.1.0</p>
      </div>
    </div>
  );
};

export default SettingsScreen;
