import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Icon from '../components/Icon';
import { animations } from '../gradients';
import './PaymentScreen.css';
import { API_URL } from '../config';

const PaymentScreen = () => {
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPaymentInfo();
  }, []);

  const loadPaymentInfo = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/grades/student/payment-status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setPaymentInfo(response.data.student);
      }
    } catch (error) {
      console.error('Error loading payment info:', error);
      alert('Failed to load payment information. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPaymentInfo();
  };

  const getPaymentStatus = () => {
    if (!paymentInfo) return { 
      status: 'unknown', 
      gradient: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
      icon: 'credit-card'
    };

    const status = paymentInfo.paymentStatus?.toLowerCase();
    if (status === 'paid') {
      return { 
        status: 'Paid', 
        gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        icon: 'credit-card'
      };
    } else if (status === 'pending') {
      return { 
        status: 'Pending', 
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        icon: 'credit-card'
      };
    } else if (status === 'overdue') {
      return { 
        status: 'Overdue', 
        gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        icon: 'credit-card'
      };
    }
    return { 
      status: 'Unknown', 
      gradient: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)',
      icon: 'credit-card'
    };
  };

  const getDaysUntilDue = () => {
    if (!paymentInfo?.paymentDate) return null;

    const paymentDate = new Date(paymentInfo.paymentDate);
    const today = new Date();
    const diffTime = paymentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  if (loading) {
    return (
      <motion.div 
        className="payment-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="spinner"></div>
        <p>Loading payment information...</p>
      </motion.div>
    );
  }

  const paymentStatus = getPaymentStatus();
  const daysUntilDue = getDaysUntilDue();

  return (
    <motion.div 
      className="payment-container"
      initial="initial"
      animate="animate"
      variants={animations.fadeIn}
    >
      <motion.div 
        className="payment-header"
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
        <h1>Payment Status</h1>
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
        className="status-card-gradient" 
        style={{ background: paymentStatus.gradient }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        whileHover={{ scale: 1.02, y: -4 }}
      >
        <div className="status-icon-wrapper">
          <Icon type={paymentStatus.icon} size={40} color="#FFFFFF" />
        </div>
        <h2 className="status-title">Payment Status</h2>
        <p className="status-text">
          {paymentStatus.status}
        </p>
      </motion.div>

      <motion.div 
        className="details-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h3 className="card-title">Payment Information</h3>

        <div className="detail-row">
          <div className="detail-label">
            <div className="detail-icon money">💰</div>
            <span>Amount</span>
          </div>
          <span className="detail-value">
            {paymentInfo?.paymentAmount ? `${paymentInfo.paymentAmount} MAD` : 'N/A'}
          </span>
        </div>

        <div className="divider"></div>

        <div className="detail-row">
          <div className="detail-label">
            <div className="detail-icon calendar">📅</div>
            <span>Due Date</span>
          </div>
          <span className="detail-value">
            {paymentInfo?.paymentDate
              ? new Date(paymentInfo.paymentDate).toLocaleDateString()
              : 'N/A'}
          </span>
        </div>

        {daysUntilDue !== null && (
          <>
            <div className="divider"></div>
            <div className="detail-row">
              <div className="detail-label">
                <div className="detail-icon timer">⏳</div>
                <span>Days Until Due</span>
              </div>
              <span
                className="detail-value"
                style={{
                  color: daysUntilDue < 0 ? '#ef4444' : daysUntilDue < 7 ? '#f59e0b' : '#10b981',
                  fontWeight: '700'
                }}
              >
                {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
              </span>
            </div>
          </>
        )}
      </motion.div>

      <motion.div 
        className="details-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h3 className="card-title">Student Information</h3>

        <div className="detail-row">
          <div className="detail-label">
            <div className="detail-icon user">👤</div>
            <span>Full Name</span>
          </div>
          <span className="detail-value">{paymentInfo?.fullName || 'N/A'}</span>
        </div>

        <div className="divider"></div>

        <div className="detail-row">
          <div className="detail-label">
            <div className="detail-icon email">✉️</div>
            <span>Email</span>
          </div>
          <span className="detail-value detail-value-small">
            {paymentInfo?.schoolEmail || 'N/A'}
          </span>
        </div>

        <div className="divider"></div>

        <div className="detail-row">
          <div className="detail-label">
            <div className="detail-icon formation">🎓</div>
            <span>Formation</span>
          </div>
          <span className="detail-value">
            {paymentInfo?.formation?.join(', ') || 'N/A'}
          </span>
        </div>
      </motion.div>

      <motion.div 
        className="help-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <span className="help-icon">ℹ️</span>
        <p>For payment inquiries, please contact the school administration office.</p>
      </motion.div>
    </motion.div>
  );
};

export default PaymentScreen;
