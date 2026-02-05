// Firebase Cloud Messaging Service
// Handles device token registration and foreground notifications
// Works for both Android and iOS PWA

import { messaging, VAPID_KEY, getToken, onMessage } from '../firebase/config';
import { API_URL } from '../config';
import axios from 'axios';

class FirebaseMessagingService {
  constructor() {
    this.currentToken = null;
    this.isSupported = !!messaging;
    this.tokenRefreshInterval = null;
  }

  // Check if FCM is supported
  isMessagingSupported() {
    return this.isSupported && 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Detect iOS device
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  // Check if running as installed PWA (added to home screen)
  isInstalledPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;
  }

  // Request notification permission and get FCM token
  async requestPermissionAndGetToken() {
    if (!this.isMessagingSupported()) {
      console.warn('⚠️ Firebase Messaging not supported on this device');
      return null;
    }

    try {
      // Check current permission state first
      const currentPermission = Notification.permission;
      console.log('🔔 Current notification permission:', currentPermission);

      // iOS PWA specific warning
      if (this.isIOS() && !this.isInstalledPWA()) {
        console.warn('⚠️ iOS: PWA must be added to Home Screen for push notifications');
      }

      // Request notification permission if not already granted
      let permission = currentPermission;
      if (currentPermission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission !== 'granted') {
        console.log('⚠️ Notification permission denied or blocked');
        return null;
      }

      console.log('✅ Notification permission granted');

      // Register Firebase messaging service worker explicitly
      let swRegistration;
      try {
        // Unregister old service workers first for clean state
        const existingRegistrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of existingRegistrations) {
          if (reg.scope.includes('/pwa/') && !reg.active?.scriptURL?.includes('firebase-messaging-sw.js')) {
            console.log('🧹 Found non-Firebase SW, will use Firebase SW instead');
          }
        }

        // Register Firebase-specific service worker
        swRegistration = await navigator.serviceWorker.register('/pwa/firebase-messaging-sw.js', {
          scope: '/pwa/'
        });
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ Firebase SW registered and ready:', swRegistration.scope);
      } catch (swError) {
        console.warn('⚠️ Could not register Firebase SW, using default:', swError);
        swRegistration = await navigator.serviceWorker.ready;
      }

      // Get FCM token with explicit service worker
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration
      });

      if (token) {
        console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
        this.currentToken = token;
        
        // Save token to backend
        const saved = await this.saveTokenToBackend(token);
        
        if (saved) {
          // Set up periodic token refresh (tokens can expire)
          this.setupTokenRefresh();
        }
        
        return token;
      } else {
        console.warn('⚠️ No FCM token available - this may be normal on iOS Safari');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      // Provide helpful error messages
      if (error.code === 'messaging/permission-blocked') {
        console.error('🚫 Notifications are blocked. User must enable in browser settings.');
      } else if (error.code === 'messaging/unsupported-browser') {
        console.error('📱 This browser does not support push notifications');
      }
      return null;
    }
  }

  // Set up periodic token refresh
  setupTokenRefresh() {
    // Clear any existing interval
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }

    // Refresh token every 6 hours (FCM tokens can expire)
    this.tokenRefreshInterval = setInterval(async () => {
      console.log('🔄 Refreshing FCM token...');
      try {
        const swRegistration = await navigator.serviceWorker.ready;
        const newToken = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration
        });
        
        if (newToken && newToken !== this.currentToken) {
          console.log('🆕 FCM Token refreshed');
          this.currentToken = newToken;
          await this.saveTokenToBackend(newToken);
        }
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  // Save FCM token to backend
  async saveTokenToBackend(token) {
    try {
      const authToken = localStorage.getItem('studentToken');
      if (!authToken) {
        console.warn('⚠️ No auth token, cannot save FCM token');
        return false;
      }

      console.log('📤 Sending FCM token to backend...');
      
      // Include device info for debugging
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isIOS: this.isIOS(),
        isPWA: this.isInstalledPWA(),
        timestamp: new Date().toISOString()
      };
      
      const response = await axios.post(
        `${API_URL}/api/fcm/register-token`,
        { 
          fcmToken: token,
          deviceInfo: JSON.stringify(deviceInfo)
        },
        { 
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 10000
        }
      );

      if (response.data.success) {
        console.log('✅ FCM token saved to backend successfully');
        // Store locally to detect changes
        localStorage.setItem('fcmToken', token);
        return true;
      } else {
        console.warn('⚠️ Backend rejected token:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving FCM token to backend:', error.response?.data || error.message);
      // Retry once after a delay
      setTimeout(() => this.retrySaveToken(token), 5000);
      return false;
    }
  }

  // Retry saving token
  async retrySaveToken(token) {
    try {
      const authToken = localStorage.getItem('studentToken');
      if (!authToken) return;

      console.log('🔄 Retrying FCM token save...');
      const response = await axios.post(
        `${API_URL}/api/fcm/register-token`,
        { fcmToken: token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.data.success) {
        console.log('✅ FCM token saved on retry');
        localStorage.setItem('fcmToken', token);
      }
    } catch (error) {
      console.error('❌ Retry failed:', error.message);
    }
  }

  // Delete FCM token from backend (on logout)
  async deleteTokenFromBackend() {
    try {
      const authToken = localStorage.getItem('studentToken');
      if (!authToken || !this.currentToken) {
        return;
      }

      await axios.post(
        `${API_URL}/api/fcm/delete-token`,
        { fcmToken: this.currentToken },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('✅ FCM token deleted from backend');
      this.currentToken = null;
    } catch (error) {
      console.error('❌ Error deleting FCM token:', error);
    }
  }

  // Listen for foreground messages
  setupForegroundMessageHandler() {
    if (!this.isMessagingSupported()) {
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('📬 Foreground message received:', payload);

      const { notification } = payload;
      
      if (notification) {
        // Show in-app notification
        this.showInAppNotification(notification.title, notification.body);

        // Also try to show system notification
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(notification.title, {
              body: notification.body,
              icon: notification.icon || '/pwa/icon-192.png',
              badge: '/pwa/icon-192.png',
              tag: 'fcm-notification',
              data: payload.data || {},
            });
          });
        }
      }
    });

    console.log('✅ Foreground message handler setup');
  }

  // Show in-app notification banner
  showInAppNotification(title, body) {
    // Remove existing notification
    const existing = document.getElementById('fcm-in-app-notification');
    if (existing) {
      existing.remove();
    }

    const banner = document.createElement('div');
    banner.id = 'fcm-in-app-notification';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    
    // Auto-remove after 5 seconds
    setTimeout(() => banner.remove(), 5000);
  }

  // Get current token
  getCurrentToken() {
    return this.currentToken;
  }
}

// Create singleton instance
const firebaseMessagingService = new FirebaseMessagingService();

export default firebaseMessagingService;
