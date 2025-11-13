import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './DashboardScreen.css';

const DashboardScreen = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = () => {
    try {
      const data = localStorage.getItem('studentData');
      if (data) {
        setStudentData(JSON.parse(data));
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      navigate('/login');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const menuItems = [
    {
      title: 'My Grades',
      icon: '🎓',
      color: '#10b981',
      path: '/grades',
      description: 'View your exam results',
    },
    {
      title: 'Scan Attendance',
      icon: '📱',
      color: '#3b82f6',
      path: '/attendance',
      description: 'Scan QR code for attendance',
    },
    {
      title: 'Payment Status',
      icon: '💳',
      color: '#f59e0b',
      path: '/payment',
      description: 'Check payment information',
    },
    {
      title: 'Messages',
      icon: '✉️',
      color: '#8b5cf6',
      path: '/messages',
      description: 'Announcements & notifications',
    },
    {
      title: 'Settings',
      icon: '⚙️',
      color: '#6b7280',
      path: '/settings',
      description: 'Theme & language preferences',
    },
  ];

  return (
    <div className="dashboard-container" style={{ background: theme.background }}>
      <div className="welcome-card" style={{ background: theme.primary }}>
        <p className="welcome-text" style={{ color: theme.text }}>Welcome back,</p>
        <h2 className="student-name" style={{ color: theme.text }}>{studentData?.fullName || 'Student'}</h2>
        <p className="student-email" style={{ color: theme.text }}>{studentData?.schoolEmail}</p>
      </div>

      <div className="menu-grid">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className="menu-item"
            style={{ 
              background: theme.cardBg,
              borderLeftColor: item.color 
            }}
            onClick={() => navigate(item.path)}
          >
            <div className="icon-container" style={{ background: item.color + '20' }}>
              <span className="menu-icon">{item.icon}</span>
            </div>
            <div className="menu-text-container">
              <h3 className="menu-title" style={{ color: theme.text }}>{item.title}</h3>
              <p className="menu-description" style={{ color: theme.textLight }}>{item.description}</p>
            </div>
            <span className="chevron" style={{ color: '#9ca3af' }}>›</span>
          </div>
        ))}
      </div>

      <button className="logout-button" style={{ background: theme.cardBg }} onClick={handleLogout}>
        <span className="logout-icon">🚪</span>
        <span className="logout-text">Logout</span>
      </button>

      <div className="dashboard-footer">
        <p style={{ color: theme.textLight }}>Nisrine School Mobile App v1.0.1</p>
      </div>
    </div>
  );
};

export default DashboardScreen;
