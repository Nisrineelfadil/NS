import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    if (!paymentInfo) return { status: 'unknown', color: '#9ca3af', icon: '❓' };

    const status = paymentInfo.paymentStatus?.toLowerCase();
    if (status === 'paid') {
      return { status: 'Paid', color: '#10b981', icon: '✅' };
    } else if (status === 'pending') {
      return { status: 'Pending', color: '#f59e0b', icon: '⏰' };
    } else if (status === 'overdue') {
      return { status: 'Overdue', color: '#ef4444', icon: '⚠️' };
    }
    return { status: 'Unknown', color: '#9ca3af', icon: '❓' };
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
      <div className="payment-loading">
        <div className="spinner"></div>
        <p>Loading payment information...</p>
      </div>
    );
  }

  const paymentStatus = getPaymentStatus();
  const daysUntilDue = getDaysUntilDue();

  return (
    <div className="payment-container">
      <div className="payment-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <h1>Payment Status</h1>
        <button className="refresh-button" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? '⟳' : '↻'}
        </button>
      </div>

      <div className="status-card" style={{ background: paymentStatus.color + '20' }}>
        <div className="status-icon" style={{ background: paymentStatus.color }}>
          <span>{paymentStatus.icon}</span>
        </div>
        <h2 className="status-title">Payment Status</h2>
        <p className="status-text" style={{ color: paymentStatus.color }}>
          {paymentStatus.status}
        </p>
      </div>

      <div className="details-card">
        <h3 className="card-title">Payment Information</h3>

        <div className="detail-row">
          <div className="detail-label">
            <span>💰</span>
            <span>Amount</span>
          </div>
          <span className="detail-value">
            {paymentInfo?.paymentAmount ? `${paymentInfo.paymentAmount} MAD` : 'N/A'}
          </span>
        </div>

        <div className="divider"></div>

        <div className="detail-row">
          <div className="detail-label">
            <span>📅</span>
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
                <span>⏳</span>
                <span>Days Until Due</span>
              </div>
              <span
                className="detail-value"
                style={{
                  color: daysUntilDue < 0 ? '#ef4444' : daysUntilDue < 7 ? '#f59e0b' : '#10b981',
                }}
              >
                {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="details-card">
        <h3 className="card-title">Student Information</h3>

        <div className="detail-row">
          <div className="detail-label">
            <span>👤</span>
            <span>Full Name</span>
          </div>
          <span className="detail-value">{paymentInfo?.fullName || 'N/A'}</span>
        </div>

        <div className="divider"></div>

        <div className="detail-row">
          <div className="detail-label">
            <span>✉️</span>
            <span>Email</span>
          </div>
          <span className="detail-value detail-value-small">
            {paymentInfo?.schoolEmail || 'N/A'}
          </span>
        </div>

        <div className="divider"></div>

        <div className="detail-row">
          <div className="detail-label">
            <span>🎓</span>
            <span>Formation</span>
          </div>
          <span className="detail-value">
            {paymentInfo?.formation?.join(', ') || 'N/A'}
          </span>
        </div>
      </div>

      <div className="help-card">
        <span className="help-icon">ℹ️</span>
        <p>For payment inquiries, please contact the school administration office.</p>
      </div>
    </div>
  );
};

export default PaymentScreen;
