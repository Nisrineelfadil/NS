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
    if (this.notificationPermission !== 'granted') {
      console.log('⚠️ Notification permission not granted');
      // Show in-app notification as fallback
      this.showInAppNotification(title, options.body);
      return;
    }

    try {
      // For ALL mobile devices (Android + iOS), use service worker's showNotification
      // This is more reliable on mobile browsers
      if (this.isMobile() && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body: options.body || '',
            icon: '/pwa/icon-192.png',
            badge: '/pwa/icon-192.png',
            tag: options.tag || 'nisrine-notification',
            renotify: true,
            requireInteraction: false,
            vibrate: [200, 100, 200],
            data: options.data || {},
          });
          console.log('✅ Mobile notification shown via service worker:', title);
          // Also show in-app notification for immediate feedback
          this.showInAppNotification(title, options.body);
          return;
        } catch (swError) {
          console.warn('⚠️ Service worker notification failed, trying fallback:', swError);
        }
      }

      // For desktop browsers, use standard Notification API
      const notification = new Notification(title, {
        icon: '/pwa/icon-192.png',
        badge: '/pwa/icon-192.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        if (options.onClick) {
          options.onClick();
        }
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      console.log('✅ Desktop notification shown:', title);
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      // Fallback: show in-app notification
      this.showInAppNotification(title, options.body);
    }
  }

  // Fallback in-app notification for iOS
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
      if (!token) return;

      const response = await axios.get(
        `${API_URL}/api/grades/student/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        const messages = response.data.messages;
        const unreadMessages = messages.filter(m => !m.isRead);

        // Check if there are new unread messages since last check
        const lastCount = localStorage.getItem('lastUnreadCount');
        const currentCount = unreadMessages.length;

        if (lastCount !== null && currentCount > parseInt(lastCount)) {
          const newCount = currentCount - parseInt(lastCount);
          
          // Show notification for new messages
          this.showNotification(
            `💬 ${newCount} New Message${newCount > 1 ? 's' : ''}`,
            {
              body: unreadMessages[0]?.message?.substring(0, 100) || 'You have new messages',
              tag: 'new-messages',
              onClick: () => {
                window.location.href = '/pwa/messages';
              },
            }
          );
        }

        localStorage.setItem('lastUnreadCount', currentCount.toString());
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
          const lastNotified = localStorage.getItem('lastAttendanceNotification');
          const session = activeSessions[0];
          
          // Only notify if we haven't notified for this session
          if (lastNotified !== session._id) {
            this.showNotification(
              '✅ Attendance Code Available',
              {
                body: `Mark your attendance for ${session.formation}. Code expires soon!`,
                tag: 'attendance-code',
                requireInteraction: true,
                onClick: () => {
                  window.location.href = '/pwa/attendance';
                },
              }
            );
            
            localStorage.setItem('lastAttendanceNotification', session._id);
          }
        }

        this.lastChecked.attendance = Date.now();
      }
    } catch (error) {
      console.error('❌ Error checking attendance:', error);
    }
  }

  // Check for payment reminders
  async checkPayments() {
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

      if (response.data.success && response.data.student) {
        const student = response.data.student;
        const paymentStatus = student.paymentStatus;
        const lastPaymentNotif = localStorage.getItem('lastPaymentNotification');
        const today = new Date().toDateString();

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
    
    // Request notification permission
    await this.requestPermission();
    
    this.isPolling = true;

    // Initial poll
    await this.pollNotifications();

    // Set up interval
    this.pollingInterval = setInterval(async () => {
      await this.pollNotifications();
    }, this.pollIntervalMs);

    console.log('✅ Notification polling started');
  }

  // Stop polling
  stop() {
    if (!this.isPolling) return;

    console.log('🛑 Stopping notification polling...');
    
    this.isPolling = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    console.log('✅ Notification polling stopped');
  }

  // Get polling status
  getStatus() {
    return {
      isPolling: this.isPolling,
      lastChecked: this.lastChecked,
      permission: this.notificationPermission,
      interval: this.pollIntervalMs / 1000 + 's',
    };
  }
}

// Create singleton instance
const notificationService = new NotificationPollingService();

export default notificationService;
