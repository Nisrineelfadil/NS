// Firebase Cloud Messaging Service
// Handles device token registration and foreground notifications

import { messaging, VAPID_KEY, getToken, onMessage } from '../firebase/config';
import { API_URL } from '../config';
import axios from 'axios';

class FirebaseMessagingService {
  constructor() {
    this.currentToken = null;
    this.isSupported = !!messaging;
  }

  // Check if FCM is supported
  isMessagingSupported() {
    return this.isSupported && 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Request notification permission and get FCM token
  async requestPermissionAndGetToken() {
    if (!this.isMessagingSupported()) {
      console.warn('⚠️ Firebase Messaging not supported on this device');
      return null;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('⚠️ Notification permission denied');
        return null;
      }

      console.log('✅ Notification permission granted');

      // Register Firebase messaging service worker explicitly
      let swRegistration;
      try {
        // Try to register Firebase-specific service worker
        swRegistration = await navigator.serviceWorker.register('/pwa/firebase-messaging-sw.js', {
          scope: '/pwa/'
        });
        console.log('✅ Firebase SW registered:', swRegistration.scope);
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
        await this.saveTokenToBackend(token);
        
        return token;
      } else {
        console.warn('⚠️ No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
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
      
      const response = await axios.post(
        `${API_URL}/api/fcm/register-token`,
        { fcmToken: token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.data.success) {
        console.log('✅ FCM token saved to backend successfully');
        return true;
      } else {
        console.warn('⚠️ Backend rejected token:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving FCM token to backend:', error.response?.data || error.message);
      return false;
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
