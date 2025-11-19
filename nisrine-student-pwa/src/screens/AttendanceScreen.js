import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Icon from '../components/Icon';
import { animations } from '../gradients';
import './AttendanceScreen.css';
import { API_URL } from '../config';

const AttendanceScreen = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAttendanceHistory();
  }, []);

  const loadAttendanceHistory = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/attendance/student/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 },
        }
      );

      if (response.data.success) {
        setAttendanceHistory(response.data.records);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading attendance history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAttendanceHistory();
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    
    if (!sessionId.trim()) {
      alert('Please enter a session ID');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('studentToken');
      const response = await axios.post(
        `${API_URL}/api/attendance/scan`,
        {
          sessionId: sessionId.trim(),
          timestamp: new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const status = response.data.status;
        const statusEmoji = status === 'present' ? '✅' : status === 'late' ? '⏰' : '❌';
        const statusText = status === 'present' ? 'Present' : status === 'late' ? 'Late' : 'Absent';
        
        alert(
          `${statusEmoji} Marked as ${statusText}\n\nSession: ${response.data.session?.groupName || 'Unknown'}\nFormation: ${response.data.session?.formation || 'Unknown'}`
        );
        
        setSessionId('');
        loadAttendanceHistory();
      }
    } catch (error) {
      console.error('Error scanning attendance:', error);
      const errorMessage = error.response?.data?.error || 'Failed to mark attendance';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'late': return '#f59e0b';
      case 'absent': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'late': return '⏰';
      case 'absent': return '❌';
      default: return '❓';
    }
  };

  return (
    <motion.div 
      className="attendance-container"
      initial="initial"
      animate="animate"
      variants={animations.fadeIn}
    >
      <motion.div 
        className="attendance-header"
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
        <h1>Scan Attendance</h1>
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
        className="scanner-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="scanner-header">
          <div className="scanner-icon-wrapper">
            <Icon type="smartphone" size={24} color="#FFFFFF" />
          </div>
          <h2>Scan Attendance QR Code</h2>
        </div>
        
        <p className="scanner-description">
          Enter the Session ID from the QR code displayed by your teacher
        </p>

        <form onSubmit={handleManualEntry}>
          <div className="input-container">
            <span className="input-icon">🔑</span>
            <input
              type="text"
              className="session-input"
              placeholder="Enter Session ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              disabled={loading}
            />
          </div>

          <motion.button 
            type="submit"
            className={`scan-button ${loading ? 'loading' : ''}`}
            disabled={loading}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span>Marking...</span>
            ) : (
              <>
                <span>✓</span>
                <span>Mark Attendance</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="info-box">
          <span className="info-icon">ℹ️</span>
          <p>You'll be marked as Present if on time, or Late if after the grace period</p>
        </div>
      </motion.div>

      {stats && (
        <motion.div 
          className="stats-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h3 className="stats-title">Attendance Statistics</h3>
          
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon-container" style={{ background: '#10b98120' }}>
                <span>✅</span>
              </div>
              <p className="stat-value">{stats.present}</p>
              <p className="stat-label">Present</p>
            </div>

            <div className="stat-item">
              <div className="stat-icon-container" style={{ background: '#f59e0b20' }}>
                <span>⏰</span>
              </div>
              <p className="stat-value">{stats.late}</p>
              <p className="stat-label">Late</p>
            </div>

            <div className="stat-item">
              <div className="stat-icon-container" style={{ background: '#ef444420' }}>
                <span>❌</span>
              </div>
              <p className="stat-value">{stats.absent}</p>
              <p className="stat-label">Absent</p>
            </div>

            <div className="stat-item">
              <div className="stat-icon-container" style={{ background: '#FFCC0020' }}>
                <span>📊</span>
              </div>
              <p className="stat-value">{stats.attendanceRate}%</p>
              <p className="stat-label">Rate</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        className="history-section"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h3 className="history-title">Attendance History</h3>
        
        {attendanceHistory.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📅</span>
            <h4>No attendance records yet</h4>
            <p>Your attendance history will appear here</p>
          </div>
        ) : (
          attendanceHistory.map((record, index) => (
            <div key={index} className="history-card">
              <div className="history-header">
                <div 
                  className="status-badge"
                  style={{ background: getStatusColor(record.status) + '20' }}
                >
                  <span style={{ color: getStatusColor(record.status) }}>
                    {getStatusIcon(record.status)}
                  </span>
                  <span style={{ color: getStatusColor(record.status) }}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
                <span className="date-text">
                  {new Date(record.date).toLocaleDateString()}
                </span>
              </div>

              <div className="history-details">
                <div className="detail-row">
                  <span>🎓</span>
                  <span>{record.formation}</span>
                </div>
                
                {record.scanTime && (
                  <div className="detail-row">
                    <span>⏰</span>
                    <span>Scanned at {new Date(record.scanTime).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
};

export default AttendanceScreen;
