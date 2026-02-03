import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { animations } from '../gradients';
import Icon from '../components/Icon';
import { API_URL } from '../config';
import './DashboardScreen.css';
import { getStudentData, clearAuthData } from '../services/authService';
import notificationService from '../services/notificationPollingService';
import { registerBackgroundSync, unregisterBackgroundSync } from '../utils/backgroundSync';
import NotificationPermission from '../components/NotificationPermission';

const DashboardScreen = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    loadStudentData();
    
    // Start notification polling when dashboard loads
    notificationService.start();
    
    // Register background sync for PWA
    registerBackgroundSync();
    
    // Cleanup: stop polling when component unmounts
    return () => {
      notificationService.stop();
    };
  }, []);

  const loadStudentData = async () => {
    try {
      const data = await getStudentData();
      if (data) {
        setStudentData(data);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Stop notification polling
      notificationService.stop();
      
      // Unregister background sync
      await unregisterBackgroundSync();
      
      // Clear auth data from IndexedDB and localStorage
      await clearAuthData();
      
      navigate('/login', { replace: true });
    }
  };

  const largeCard = {
    title: 'My Grades',
    icon: '📊', // Will be replaced with SVG icon
    iconType: 'chart',
    gradient: 'linear-gradient(135deg, #FF6B9D 0%, #C471ED 100%)',
    path: '/grades',
    description: 'View your exam results',
  };

  const gridItems = [
    {
      title: 'Scan Attendance',
      icon: '📱',
      iconType: 'smartphone',
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E9E 100%)',
      path: '/attendance',
      description: 'Scan QR code for attendance',
    },
    {
      title: 'Payment Status',
      icon: '💳',
      iconType: 'credit-card',
      gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      path: '/payment',
      description: 'Check payment information',
    },
    {
      title: 'Messages',
      icon: '✉️',
      iconType: 'mail',
      gradient: 'linear-gradient(135deg, #FF6B9D 0%, #FF8E9E 100%)',
      path: '/messages',
      description: 'Announcements & notifications',
    },
    {
      title: 'Settings',
      icon: '⚙️',
      iconType: 'settings',
      gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      path: '/settings',
      description: 'Theme & language preferences',
    },
  ];

  return (
    <motion.div 
      className="dashboard-container"
      initial="initial"
      animate="animate"
      variants={animations.fadeIn}
    >
      {/* Header with student info and photo */}
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="header-text">
          <p className="welcome-text-new">Welcome back</p>
          <h2 className="student-name-new">{studentData?.fullName || 'Student'}</h2>
          <p className="student-email-new">{studentData?.schoolEmail}</p>
        </div>
        <motion.div 
          className="student-photo"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {studentData?.photoPath && studentData.photoPath !== 'default-avatar.png' ? (
            <img 
              src={studentData.photoPath.startsWith('http') ? studentData.photoPath : `${API_URL}${studentData.photoPath}`} 
              alt="Student" 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="photo-placeholder" 
            style={{ display: studentData?.photoPath && studentData.photoPath !== 'default-avatar.png' ? 'none' : 'flex' }}
          >
            {studentData?.fullName?.charAt(0) || 'S'}
          </div>
        </motion.div>
      </motion.div>

      {/* Large Grades Card */}
      <motion.div
        className="large-card"
        style={{ background: largeCard.gradient }}
        onClick={() => navigate(largeCard.path)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="large-card-icon">
          <Icon type={largeCard.iconType} size={48} color="#FFFFFF" />
        </div>
        <h3 className="large-card-title">{largeCard.title}</h3>
        <p className="large-card-description">{largeCard.description}</p>
      </motion.div>

      {/* 2x2 Grid */}
      <motion.div 
        className="cards-grid"
        variants={animations.staggerContainer}
      >
        {gridItems.map((item, index) => (
          <motion.div
            key={index}
            className="grid-card"
            style={{ background: item.gradient }}
            onClick={() => navigate(item.path)}
            variants={animations.staggerItem}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid-card-icon">
              <Icon type={item.iconType} size={36} color="#FFFFFF" />
            </div>
            <h3 className="grid-card-title">{item.title}</h3>
            <p className="grid-card-description">{item.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Logout Button */}
      <motion.button 
        className="logout-button-gradient"
        onClick={handleLogout}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Logout
      </motion.button>

      <div className="dashboard-footer">
        <p>Nisrine School Mobile App v1.0.1</p>
      </div>

      {/* Notification Permission Banner for Mobile */}
      <NotificationPermission />
    </motion.div>
  );
};

export default DashboardScreen;
