import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Icon from '../components/Icon';
import { animations } from '../gradients';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../translations/translations';
import './MessagesScreen.css';
import { API_URL } from '../config';

const MessagesScreen = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation(currentLanguage);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/grades/student/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('studentToken');
      await axios.put(
        `${API_URL}/api/grades/student/messages/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(messages.map(msg => 
        msg._id === id ? { ...msg, isRead: true } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm(t('confirmDelete'))) {
      return;
    }

    try {
      const token = localStorage.getItem('studentToken');
      await axios.delete(
        `${API_URL}/api/grades/student/messages/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(messages.filter(msg => msg._id !== id));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const getMessageGradient = (type) => {
    switch (type) {
      case 'announcement': return 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)';
      case 'notification': return 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)';
      case 'alert': return 'linear-gradient(135deg, #FF6B6B 0%, #FF8E9E 100%)';
      case 'payment': return 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)';
      default: return 'linear-gradient(135deg, #FF6B9D 0%, #C471ED 100%)';
    }
  };

  const getIconType = (type) => {
    switch (type) {
      case 'payment': return 'credit-card';
      default: return 'mail';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (loading) {
    return (
      <motion.div 
        className="messages-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="spinner"></div>
        <p>{t('loadingMessages')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="messages-container"
      initial="initial"
      animate="animate"
      variants={animations.fadeIn}
    >
      <motion.div 
        className="messages-header"
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
        <h1>{t('messages')}</h1>
        <motion.button 
          className="refresh-button" 
          onClick={handleRefresh} 
          disabled={refreshing}
          whileHover={{ scale: 1.05, rotate: refreshing ? 360 : 0 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: refreshing ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          ↻
        </motion.button>
      </motion.div>

      <motion.div 
        className="stats-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="stat-item">
          <div className="stat-icon-wrapper">
            <Icon type="mail" size={28} color="#667EEA" />
          </div>
          <p className="stat-value">{messages.length}</p>
          <p className="stat-label">{t('total')}</p>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-icon-wrapper unread">
            <Icon type="mail" size={28} color="#FF6B9D" />
            {unreadCount > 0 && <div className="badge-dot"></div>}
          </div>
          <p className="stat-value">{unreadCount}</p>
          <p className="stat-label">{t('unread')}</p>
        </div>
      </motion.div>

      <motion.div 
        className="messages-list"
        variants={animations.staggerContainer}
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="empty-icon">📭</div>
              <h3>{t('noMessagesYet')}</h3>
              <p>{t('receiveAnnouncements')}</p>
            </motion.div>
          ) : (
            messages.map((message, index) => (
            <motion.div
              key={message._id}
              className={`message-card ${!message.isRead ? 'unread' : ''}`}
              style={{ background: getMessageGradient(message.type) }}
              onClick={() => markAsRead(message._id)}
              variants={animations.staggerItem}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <div className="message-content">
                <div className="message-header-row">
                  <div className="message-icon-wrapper">
                    <Icon type={getIconType(message.type)} size={24} color="#FFFFFF" />
                  </div>
                  <div className="message-header-text">
                    <h3 className="message-title">{message.title}</h3>
                    <p className="message-date">{formatDate(message.createdAt)}</p>
                  </div>
                  {!message.isRead && (
                    <motion.div 
                      className="unread-indicator"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    />
                  )}
                </div>
                <p className="message-text">{message.message}</p>
                <motion.button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMessage(message._id);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{t('deleteMessage')}</span>
                </motion.button>
              </div>
            </motion.div>
          ))
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default MessagesScreen;
