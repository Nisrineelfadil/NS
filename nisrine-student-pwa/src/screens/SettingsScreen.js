import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import Icon from '../components/Icon';
import { animations } from '../gradients';
import './SettingsScreen.css';

const LANGUAGES = [
  { key: 'en', name: 'English', flag: '🇬🇧', gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' },
  { key: 'fr', name: 'Français', flag: '🇫🇷', gradient: 'linear-gradient(135deg, #FF6B9D 0%, #C471ED 100%)' },
  { key: 'ar', name: 'العربية', flag: '🇲🇦', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
];

const SettingsScreen = () => {
  const navigate = useNavigate();
  const { theme, currentTheme, changeTheme, themes } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('checking');

  useEffect(() => {
    loadLanguage();
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      // Check basic support
      if (!('Notification' in window)) {
        setNotificationStatus('unsupported');
        return;
      }

      // For iOS, service worker might not be ready yet, so just check permission
      const permission = Notification.permission;
      
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (permission === 'granted' && registration.pushManager) {
            const subscription = await registration.pushManager.getSubscription();
            setNotificationsEnabled(!!subscription);
            setNotificationStatus(subscription ? 'enabled' : 'granted');
          } else {
            setNotificationStatus(permission);
          }
        } catch (error) {
          // Service worker not ready yet, just show the button
          console.log('Service worker not ready, showing enable button');
          setNotificationStatus(permission === 'granted' ? 'granted' : 'default');
        }
      } else {
        // No service worker support, but still allow trying
        setNotificationStatus('default');
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
      setNotificationStatus('default');
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleEnableNotifications = async () => {
    try {
      setNotificationStatus('requesting');
      
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Please allow notifications to receive updates!');
        setNotificationStatus('denied');
        return;
      }

      const response = await fetch('/api/push-notifications/vapid-public-key');
      const { publicKey } = await response.json();

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      const token = localStorage.getItem('token');
      const result = await fetch('/api/push-notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      });

      const data = await result.json();
      if (data.success) {
        setNotificationsEnabled(true);
        setNotificationStatus('enabled');
        alert('✅ Notifications enabled! You will receive updates about grades, attendance, messages, and payments.');
      } else {
        throw new Error(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      alert('Failed to enable notifications. Please try again or check your browser settings.');
      setNotificationStatus('error');
    }
  };

  const handleDisableNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        const token = localStorage.getItem('token');
        await fetch('/api/push-notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }
      
      setNotificationsEnabled(false);
      setNotificationStatus('default');
      alert('Notifications disabled');
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
  };

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
      // Success feedback with animation
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
          ← Back
        </motion.button>
        <h1>Settings</h1>
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
          <h2>Settings</h2>
          <p>Customize your app experience</p>
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
          <h3>Theme</h3>
        </div>
        <p className="section-description">
          Choose your preferred color theme
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
              <h4>{themes[themeKey].name}</h4>
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
                    <span>Active</span>
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
          <h3>Language</h3>
        </div>
        <p className="section-description">
          Select your preferred language
        </p>

        <div className="language-grid">
          {LANGUAGES.map((lang, index) => (
            <motion.div
                key={lang.key}
                className={`language-card ${selectedLanguage === lang.key ? 'selected' : ''}`}
                style={{ background: lang.gradient }}
                onClick={() => saveLanguage(lang.key)}
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
                  {selectedLanguage === lang.key && (
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
                  animate={selectedLanguage === lang.key ? {
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
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <div className="section-header">
          <div className="section-icon-wrapper">
            <span className="section-icon">🔔</span>
          </div>
          <h3>Push Notifications</h3>
        </div>
        <p className="section-description">
          Receive notifications about grades, attendance, messages, and payments
        </p>

        {notificationStatus === 'unsupported' && (
          <div style={{ padding: '15px', background: '#fee', borderRadius: '10px', color: '#c00' }}>
            ❌ Push notifications are not supported on this device
          </div>
        )}

        {notificationStatus !== 'unsupported' && (
          <motion.button
            className="logout-button-gradient"
            onClick={notificationsEnabled ? handleDisableNotifications : handleEnableNotifications}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              background: notificationsEnabled 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}
          >
            {notificationStatus === 'requesting' && '⏳ Requesting...'}
            {notificationStatus === 'checking' && '🔍 Checking...'}
            {notificationStatus === 'enabled' && '🔔 Notifications Enabled'}
            {notificationStatus === 'granted' && '🔔 Enable Notifications'}
            {notificationStatus === 'default' && '🔔 Enable Notifications'}
            {notificationStatus === 'denied' && '❌ Permission Denied'}
            {notificationStatus === 'error' && '⚠️ Enable Notifications'}
          </motion.button>
        )}

        {notificationsEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: '15px',
              padding: '15px',
              background: '#d1fae5',
              borderRadius: '10px',
              color: '#065f46'
            }}
          >
            ✅ You will receive notifications for:
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>📊 New grades</li>
              <li>✅ Attendance codes</li>
              <li>💬 Admin messages</li>
              <li>💰 Payment reminders</li>
            </ul>
          </motion.div>
        )}
      </motion.div>

      <motion.div 
        className="settings-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <div className="section-header">
          <div className="section-icon-wrapper">
            <span className="section-icon">🚪</span>
          </div>
          <h3>Account</h3>
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
          Logout
        </motion.button>
      </motion.div>

      <motion.div 
        className="info-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p>Nisrine School Student App</p>
        <p>Version 1.1.0</p>
      </motion.div>
    </motion.div>
  );
};

export default SettingsScreen;
