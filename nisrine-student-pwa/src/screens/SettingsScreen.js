import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../translations/translations';
import Icon from '../components/Icon';
import { animations } from '../gradients';
import './SettingsScreen.css';

const SettingsScreen = () => {
  const navigate = useNavigate();
  const { theme, currentTheme, changeTheme, themes } = useTheme();
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const { t } = useTranslation(currentLanguage);

  useEffect(() => {
    // Apply theme colors to CSS variables
    document.documentElement.style.setProperty('--bg-color', theme.background);
    document.documentElement.style.setProperty('--card-bg', theme.cardBg);
    document.documentElement.style.setProperty('--text-color', theme.text);
    document.documentElement.style.setProperty('--text-light', theme.textLight);
  }, [theme]);


  const handleLogout = () => {
    const confirmMessage = currentLanguage === 'fr' ? 'Êtes-vous sûr de vouloir vous déconnecter?' : 
                          currentLanguage === 'ar' ? 'هل أنت متأكد أنك تريد تسجيل الخروج؟' : 
                          'Are you sure you want to logout?';
    if (window.confirm(confirmMessage)) {
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
    <motion.div 
      className="settings-container"
      initial="initial"
      animate="animate"
      variants={animations.fadeIn}
    >
      <motion.div 
        className="settings-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.button 
          className="back-button" 
          onClick={() => navigate('/dashboard')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {t('back')}
        </motion.button>
        <h1>{t('settingsTitle')}</h1>
        <div style={{ width: '60px' }}></div>
      </motion.div>

      <motion.div 
        className="settings-intro"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="intro-icon">
          <Icon type="settings" size={32} color="#667EEA" />
        </div>
        <div className="intro-text">
          <h2>{t('settingsTitle')}</h2>
          <p>{t('customizeExperience')}</p>
        </div>
      </motion.div>

      <motion.div 
        className="settings-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="section-header">
          <div className="section-icon-wrapper">
            <span className="section-icon">🎨</span>
          </div>
          <h3>{t('theme')}</h3>
        </div>
        <p className="section-description">
          {t('chooseTheme')}
        </p>

        <div className="theme-grid">
          {Object.keys(themes).map((themeKey, index) => (
            <motion.div
              key={themeKey}
              className={`theme-card ${currentTheme === themeKey ? 'active' : ''}`}
              style={{
                background: themeKey === 'bright' 
                  ? 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)'
                  : 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
              }}
              onClick={() => changeTheme(themeKey)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="theme-icon-container">
                <span style={{ fontSize: '48px' }}>
                  {themeKey === 'bright' ? '☀️' : '🌙'}
                </span>
              </div>
              <h4>{themeKey === 'bright' ? t('brightMode') : t('darkMode')}</h4>
              <div className="theme-colors">
                <motion.div 
                  className="color-dot" 
                  style={{ background: themes[themeKey].primary }}
                  whileHover={{ scale: 1.3 }}
                />
                <motion.div 
                  className="color-dot" 
                  style={{ background: themes[themeKey].secondary }}
                  whileHover={{ scale: 1.3 }}
                />
              </div>
              <AnimatePresence>
                {currentTheme === themeKey && (
                  <motion.div 
                    className="selected-badge"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <span>✓</span>
                    <span>{t('active')}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        className="settings-section language-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="section-header">
          <div className="section-icon-wrapper">
            <span className="section-icon">🌐</span>
          </div>
          <h3>{t('language')}</h3>
        </div>
        <p className="section-description">
          {t('selectLanguage')}
        </p>

        <div className="language-grid">
          {Object.values(languages).map((lang, index) => (
            <motion.div
                key={lang.key}
                className={`language-card ${currentLanguage === lang.key ? 'selected' : ''}`}
                style={{ 
                  background: lang.key === 'en' ? 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' :
                             lang.key === 'fr' ? 'linear-gradient(135deg, #FF6B9D 0%, #C471ED 100%)' :
                             'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
                }}
                onClick={() => changeLanguage(lang.key)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: 0.5 + index * 0.1,
                  duration: 0.4
                }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="language-flag">
                  {lang.flag}
                </div>
                <h4 className="language-name">
                  {lang.name}
                </h4>
                <AnimatePresence>
                  {currentLanguage === lang.key && (
                    <motion.div 
                      className="language-check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      ✓
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div 
                  className="language-ripple"
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={currentLanguage === lang.key ? {
                    scale: [1, 1.5, 2],
                    opacity: [0.5, 0.3, 0]
                  } : { scale: 0, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </motion.div>
            ))}
        </div>
      </motion.div>

      <motion.div 
        className="settings-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <div className="section-header">
          <div className="section-icon-wrapper">
            <span className="section-icon">�</span>
          </div>
          <h3>{t('account')}</h3>
        </div>
        <motion.button
          className="logout-button-gradient"
          onClick={handleLogout}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {t('logout')}
        </motion.button>
      </motion.div>

      <motion.div 
        className="info-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p>Nisrine School Student App</p>
        <p>{t('version')} 1.1.0</p>
      </motion.div>
    </motion.div>
  );
};

export default SettingsScreen;
