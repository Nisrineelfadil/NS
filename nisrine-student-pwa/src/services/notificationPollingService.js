// Notification Polling Service
// Checks for new messages/grades/attendance every 60 seconds
// Shows phone notifications when updates are found

import axios from 'axios';
import { API_URL } from '../config';
import { getToken } from './authService';

class NotificationPollingService {
  constructor() {
    this.pollingInterval = null;
    this.isPolling = false;
    this.pollIntervalMs = 60000; // 60 seconds
    this.lastChecked = {
      messages: null,
      grades: null,
      attendance: null,
      payments: null,
    };
    this.notificationPermission = 'default';
  }

  // Request notification permission
  async requestPermission() {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission;
        console.log('📢 Notification permission:', permission);
        return permission === 'granted';
      } catch (error) {
        console.error('❌ Error requesting notification permission:', error);
        return false;
      }
    }
    return false;
  }

  // Detect if running on mobile device (iOS or Android)
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  // Detect if running on iOS
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  // Check if running as installed PWA
  isInstalledPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;
  }

  // Show browser notification (mobile-compatible using service worker)
  async showNotification(title, options = {}) {
    console.log('🔔 Attempting to show notification:', title);
    console.log('📋 Current permission:', this.notificationPermission);
    
    // Re-check permission status
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
    
    if (this.notificationPermission !== 'granted') {
      console.log('⚠️ Notification permission not granted, showing in-app only');
      this.showInAppNotification(title, options.body);
      return;
    }

    // Always show in-app notification first for immediate feedback
    this.showInAppNotification(title, options.body);

    try {
      // Try service worker notification (works on both mobile and desktop)
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log('📱 Service worker ready, showing notification...');
          
          await registration.showNotification(title, {
            body: options.body || '',
            icon: '/pwa/icon-192.png',
            badge: '/pwa/icon-192.png',
            tag: options.tag || 'nisrine-notification-' + Date.now(),
            renotify: true,
            requireInteraction: false,
            silent: false,
            vibrate: [200, 100, 200],
            data: options.data || { url: '/pwa/messages' },
          });
          
          console.log('✅ Service worker notification shown:', title);
          return;
        } catch (swError) {
          console.warn('⚠️ Service worker notification failed:', swError);
        }
      }

      // Fallback: Direct Notification API (desktop)
      if (!this.isMobile()) {
        const notification = new Notification(title, {
          icon: '/pwa/icon-192.png',
          badge: '/pwa/icon-192.png',
          vibrate: [200, 100, 200],
          requireInteraction: false,
          body: options.body || '',
        });

        notification.onclick = () => {
          window.focus();
          if (options.onClick) {
            options.onClick();
          }
          notification.close();
        };

        setTimeout(() => notification.close(), 10000);
        console.log('✅ Desktop notification shown:', title);
      }
    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }

  // Fallback in-app notification for mobile
  showInAppNotification(title, body) {
    const banner = document.createElement('div');
    banner.id = 'in-app-notification';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #FF6B9D 0%, #C471ED 100%);
        color: white;
        padding: 16px;
        border-radius: 12px;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
      ">
        <strong style="display: block; margin-bottom: 4px;">${title}</strong>
        <span style="opacity: 0.9;">${body || ''}</span>
      </div>
    `;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
  }

  // Check for new messages
  async checkMessages() {
    try {
      const token = await getToken();
      if (!token) {
        console.log('⚠️ No token available for message check');
        return;
      }

      console.log('📬 Checking for new messages...');

      const response = await axios.get(
        `${API_URL}/api/grades/student/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        const messages = response.data.messages || [];
        const unreadMessages = messages.filter(m => !m.isRead);
        const currentCount = unreadMessages.length;

        console.log(`📨 Found ${currentCount} unread messages`);

        // Get last known message IDs to detect truly new messages
        const lastMessageIds = JSON.parse(localStorage.getItem('lastMessageIds') || '[]');
        const currentMessageIds = unreadMessages.map(m => m._id);
        
        // Find messages that are new (not in last known list)
        const newMessageIds = currentMessageIds.filter(id => !lastMessageIds.includes(id));
        
        if (newMessageIds.length > 0) {
          const newestMessage = unreadMessages.find(m => m._id === newMessageIds[0]);
          
          console.log(`🆕 Found ${newMessageIds.length} NEW messages!`);
          
          // Show notification for new messages
          await this.showNotification(
            `💬 ${newMessageIds.length} New Message${newMessageIds.length > 1 ? 's' : ''}`,
            {
              body: newestMessage?.message?.substring(0, 100) || 'You have new messages',
              tag: 'new-messages-' + Date.now(),
              onClick: () => {
                window.location.href = '/pwa/messages';
              },
            }
          );
        } else {
          console.log('📭 No new messages since last check');
        }

        // Store current message IDs for next comparison
        localStorage.setItem('lastMessageIds', JSON.stringify(currentMessageIds));
        this.lastChecked.messages = Date.now();
      }
    } catch (error) {
      console.error('❌ Error checking messages:', error);
    }
  }

  // Check for new grades
  async checkGrades() {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await axios.get(
        `${API_URL}/api/grades/student`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        const grades = response.data.grades;
        const lastGradeCount = localStorage.getItem('lastGradeCount');
        const currentCount = grades.length;

        if (lastGradeCount !== null && currentCount > parseInt(lastGradeCount)) {
          const newGrade = grades[0]; // Most recent grade
          
          this.showNotification(
            '📊 New Grade Available',
            {
              body: `${newGrade.formation}: ${newGrade.score}/${newGrade.maxScore}`,
              tag: 'new-grade',
              onClick: () => {
                window.location.href = '/pwa/grades';
              },
            }
          );
        }

        localStorage.setItem('lastGradeCount', currentCount.toString());
        this.lastChecked.grades = Date.now();
      }
    } catch (error) {
      console.error('❌ Error checking grades:', error);
    }
  }

  // Check for attendance updates
  async checkAttendance() {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await axios.get(
        `${API_URL}/api/attendance/student/sessions`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        const sessions = response.data.sessions;
        const activeSessions = sessions.filter(s => s.qrValid);
        
        if (activeSessions.length > 0) {
          const lastAttendanceCheck = localStorage.getItem('lastAttendanceCheck');
          const now = Date.now();
          
          // Only notify if we haven't notified in the last hour
          if (!lastAttendanceCheck || (now - parseInt(lastAttendanceCheck)) > 3600000) {
            this.showNotification(
              '✅ Attendance Code Available',
              {
                body: `Scan QR code for ${activeSessions[0].subject}`,
                tag: 'attendance-available',
                onClick: () => {
                  window.location.href = '/pwa/attendance';
                },
              }
            );
            localStorage.setItem('lastAttendanceCheck', now.toString());
          }
        }

        this.lastChecked.attendance = Date.now();
      }
    } catch (error) {
      console.error('❌ Error checking attendance:', error);
    }
  }

  // Check for payment updates
  async checkPayments() {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await axios.get(
        `${API_URL}/api/payments/student/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        const student = response.data.student;
        const paymentStatus = student.paymentStatus;
        
        // Check for overdue payments
        if (paymentStatus === 'overdue') {
          const today = new Date().toDateString();
          const lastPaymentNotif = localStorage.getItem('lastPaymentNotification');
          
          // Only notify once per day about overdue payments
          if (paymentStatus === 'overdue' && lastPaymentNotif !== today) {
            this.showNotification(
              '⚠️ Payment Overdue',
              {
                body: `Your payment of ${student.paymentAmount} MAD is overdue. Please pay as soon as possible.`,
                tag: 'payment-overdue',
                requireInteraction: true,
                onClick: () => {
                  window.location.href = '/pwa/payment';
                },
              }
            );
            
            localStorage.setItem('lastPaymentNotification', today);
          }
        }

        this.lastChecked.payments = Date.now();
      }
    } catch (error) {
      console.error('❌ Error checking payments:', error);
    }
  }

  // Poll all notifications
  async pollNotifications() {
    if (!this.isPolling) return;

    console.log('🔔 Polling for notifications...');

    try {
      await Promise.all([
        this.checkMessages(),
        this.checkGrades(),
        this.checkAttendance(),
        this.checkPayments(),
      ]);
    } catch (error) {
      console.error('❌ Error during polling:', error);
    }
  }

  // Start polling
  async start() {
    if (this.isPolling) {
      console.log('⚠️ Polling already running');
      return;
    }

    console.log('🚀 Starting notification polling (every 60 seconds)...');

    // Check current permission
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
      
      if (this.notificationPermission === 'default') {
        // Try to request permission
        const granted = await this.requestPermission();
        if (!granted) {
          console.warn('⚠️ Notification permission not granted');
        }
      }
    }

    this.isPolling = true;

    // Poll immediately on start
    this.pollNotifications();

    // Then poll every 60 seconds
    this.pollingInterval = setInterval(() => {
      this.pollNotifications();
    }, this.pollIntervalMs);
  }

  // Stop polling
  stop() {
    if (!this.isPolling) {
      console.log('⚠️ Polling not running');
      return;
    }

    console.log('🛑 Stopping notification polling...');
    
    this.isPolling = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Get polling status
  getStatus() {
    return {
      isPolling: this.isPolling,
      permission: this.notificationPermission,
      lastChecked: this.lastChecked,
    };
  }
}

// Create singleton instance
const notificationService = new NotificationPollingService();

export default notificationService;
