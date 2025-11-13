import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MessagesScreen.css';
import { API_URL } from '../config';

const MessagesScreen = () => {
  const navigate = useNavigate();
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
    if (!window.confirm('Are you sure you want to delete this message?')) {
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

  const getIcon = (type) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'notification': return '🔔';
      case 'alert': return '⚠️';
      default: return '✉️';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'announcement': return '#FFCC00';
      case 'notification': return '#3b82f6';
      case 'alert': return '#ef4444';
      default: return '#6b7280';
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
      <div className="messages-loading">
        <div className="spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <h1>Messages</h1>
        <button className="refresh-button" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? '⟳' : '↻'}
        </button>
      </div>

      <div className="header-card">
        <div className="stat-item">
          <span className="stat-icon">✉️</span>
          <p className="stat-value">{messages.length}</p>
          <p className="stat-label">Total</p>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-icon">📬</span>
          <p className="stat-value">{unreadCount}</p>
          <p className="stat-label">Unread</p>
        </div>
      </div>

      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No messages yet</h3>
            <p>You'll receive announcements and notifications here</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`message-card ${!message.isRead ? 'unread' : ''}`}
              onClick={() => markAsRead(message._id)}
            >
              <div className="message-header">
                <div 
                  className="icon-container"
                  style={{ background: getIconColor(message.type) + '20' }}
                >
                  <span style={{ fontSize: '24px' }}>
                    {getIcon(message.type)}
                  </span>
                </div>
                <div className="message-header-text">
                  <h3 className="message-title">{message.title}</h3>
                  <p className="message-date">{formatDate(message.createdAt)}</p>
                </div>
                {!message.isRead && (
                  <div className="unread-badge">
                    <div className="unread-dot"></div>
                  </div>
                )}
              </div>
              <p className="message-text">{message.message}</p>
              <div className="message-footer">
                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMessage(message._id);
                  }}
                >
                  <span>🗑️</span>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessagesScreen;
