import { useState, useEffect } from 'react';
import { useStudentAuth } from '../../../context/StudentAuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import axios from 'axios';
import './PaymentStatus.css';

const PaymentStatus = () => {
  const { user } = useStudentAuth();
  const { t } = useLanguage();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPaymentStatus();
    }
  }, [user]);

  const fetchPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      const response = await axios.get('/api/grades/student/payment-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentInfo(response.data.student);
    } catch (error) {
      console.error('Error fetching payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !paymentInfo) return null;

  const getPaymentStatus = () => {
    // Check payment status first (case-insensitive)
    const status = (paymentInfo.paymentStatus || '').toLowerCase();
    
    if (status === 'paid') {
      return { status: 'paid', label: t('paymentPending'), class: 'paid' };
    }
    
    if (!paymentInfo.paymentDate) {
      return { status: 'pending', label: t('paymentPending'), class: 'pending' };
    }

    const paymentDate = new Date(paymentInfo.paymentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for date comparison
    paymentDate.setHours(0, 0, 0, 0);
    
    if (today > paymentDate) {
      return { status: 'overdue', label: t('paymentPending'), class: 'overdue' };
    } else {
      return { status: 'pending', label: t('paymentPending'), class: 'pending' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const payment = getPaymentStatus();

  return (
    <div className={`payment-status-badge ${payment.class}`}>
      <div className="payment-icon">
        {payment.status === 'paid' ? (
          <i className="fas fa-check-circle"></i>
        ) : payment.status === 'overdue' ? (
          <i className="fas fa-exclamation-circle"></i>
        ) : (
          <i className="fas fa-clock"></i>
        )}
      </div>
      <div className="payment-info">
        <span className="payment-label">{payment.label}</span>
        {paymentInfo.paymentDate && (
          <span className="payment-date">{t('due')}: {formatDate(paymentInfo.paymentDate)}</span>
        )}
        {paymentInfo.paymentAmount && (
          <span className="payment-amount">{paymentInfo.paymentAmount} MAD</span>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
